import OpenAI from "openai";
import { uploadFileToS3 } from "./awsService";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** Prefer GPT Image models — many projects no longer expose dall-e-3. Override with OPENAI_IMAGE_MODEL. */
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";

export type GenerateCampaignImageInput = {
  name: string;
  description: string;
};

export type GenerateCampaignImageResult = {
  success: boolean;
  message: string;
  data?: {
    key: string;
    url: string;
    mimetype: string;
    originalname: string;
    prompt: string;
  };
  error?: string;
};

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function buildPrompt(name: string, description: string): string {
  return [
    "Create a polished landscape promotional campaign hero image for a consumer financing / retail offer.",
    "Style: modern, clean, premium marketplace photography feel. No text, logos, watermarks, or UI chrome.",
    "Composition: wide banner suitable for a campaign card (about 1200×630).",
    `Campaign name: ${name}`,
    `Campaign description: ${description}`,
    "Visualize the vibe and category implied by the name and description with realistic lifestyle or product atmosphere.",
  ].join("\n");
}

async function bufferFromOpenAIImage(result: OpenAI.Images.ImagesResponse): Promise<{
  buffer: Buffer;
  mimetype: string;
  extension: string;
}> {
  const image = result.data?.[0];
  if (!image) {
    throw new Error("OpenAI did not return an image");
  }

  if (image.b64_json) {
    return {
      buffer: Buffer.from(image.b64_json, "base64"),
      mimetype: "image/png",
      extension: "png",
    };
  }

  if (image.url) {
    const res = await fetch(image.url);
    if (!res.ok) {
      throw new Error(`Failed to download generated image (${res.status})`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";
    const extension = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
    return {
      buffer: Buffer.from(arrayBuffer),
      mimetype: contentType,
      extension,
    };
  }

  throw new Error("OpenAI image response missing b64_json and url");
}

export class CampaignImageService {
  async generateAndUpload(input: GenerateCampaignImageInput): Promise<GenerateCampaignImageResult> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          success: false,
          message: "Image generation is not configured",
          error: "OPENAI_API_KEY is missing",
        };
      }

      const name = requireText(input.name, "name");
      const description = requireText(input.description, "description");
      if (name.length > 200) throw new Error("name must be 200 characters or fewer");
      if (description.length > 500) throw new Error("description must be 500 characters or fewer");

      const prompt = buildPrompt(name, description);

      // GPT Image models return b64 by default and reject `response_format`.
      // Landscape 1536x1024 suits campaign hero cards (~1200×630).
      const isDalle3 = IMAGE_MODEL.includes("dall-e-3");
      const generated = await client.images.generate({
        model: IMAGE_MODEL,
        prompt,
        n: 1,
        size: isDalle3 ? "1792x1024" : "1536x1024",
      });

      const { buffer, mimetype, extension } = await bufferFromOpenAIImage(generated);
      const originalname = `campaign-${Date.now()}.${extension}`;

      const uploaded = await uploadFileToS3(
        {
          buffer,
          size: buffer.length,
          mimetype,
          originalname,
        },
        "campaigns"
      );

      if (!uploaded.key || !uploaded.url) {
        return {
          success: false,
          message: "Generated image could not be stored",
          error: "S3 upload returned an empty result",
        };
      }

      return {
        success: true,
        message: "Campaign image generated successfully",
        data: {
          key: uploaded.key,
          url: uploaded.url,
          mimetype: uploaded.mimetype || mimetype,
          originalname: uploaded.originalname || originalname,
          prompt,
        },
      };
    } catch (error: any) {
      console.error("Campaign image generation error:", error);
      return {
        success: false,
        message: error?.message || "Failed to generate campaign image",
        error: error?.message || "Unknown error occurred",
      };
    }
  }
}

export const campaignImageService = new CampaignImageService();
