import axios, { Method } from "axios";
import { PersonaInquiryStatus } from "@prisma/client";
import prisma from "../utils/prisma";

const PERSONA_API_BASE_URL =
  process.env.PERSONA_API_BASE_URL || "https://api.withpersona.com/api/v1";
const PERSONA_API_KEY = process.env.PERSONA_API_KEY;
const PERSONA_INQUIRY_TEMPLATE_ID = process.env.PERSONA_INQUIRY_TEMPLATE_ID;

interface PersonaApiRequestOptions {
  method: Method;
  endpoint: string; // e.g. "/inquiries"
  data?: any;
  params?: any;
  headers?: Record<string, string>;
}

function requirePersonaApiKey() {
  if (!PERSONA_API_KEY || PERSONA_API_KEY.trim().length === 0) {
    throw new Error("PERSONA_API_KEY is not set");
  }
  return PERSONA_API_KEY;
}

function mapPersonaInquiryStatus(status?: string): PersonaInquiryStatus {
  const normalized = status?.toLowerCase();

  if (normalized === "completed" || normalized === "approved") {
    return PersonaInquiryStatus.Completed;
  }

  if (normalized === "failed" || normalized === "declined") {
    return PersonaInquiryStatus.Failed;
  }

  return PersonaInquiryStatus.Created;
}

async function personaApiRequest<T = any>({
  method,
  endpoint,
  data,
  params,
  headers = {},
}: PersonaApiRequestOptions): Promise<T> {
  try {
    const response = await axios({
      method,
      url: `${PERSONA_API_BASE_URL}${endpoint}`,
      data,
      params,
      headers: {
        Authorization: `Bearer ${requirePersonaApiKey()}`,
        "Content-Type": "application/json",
        accept: "application/json",
        ...headers,
      },
    });

    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
}

export class PersonaInquiryService {
  async createInquiry(inquiryTemplateId?: string) {
    const templateId = inquiryTemplateId || PERSONA_INQUIRY_TEMPLATE_ID;
    if (!templateId) {
      throw new Error("PERSONA_INQUIRY_TEMPLATE_ID is not set");
    }

    return personaApiRequest({
      method: "POST",
      endpoint: "/inquiries",
      data: {
        data: {
          attributes: {
            "inquiry-template-id": templateId,
          },
        },
      },
    });
  }

  async listInquiries() {
    return personaApiRequest({
      method: "GET",
      endpoint: "/inquiries",
    });
  }

  async getInquiry(inquiryId: string) {
    if (!inquiryId) {
      throw new Error("inquiryId is required");
    }

    return personaApiRequest({
      method: "GET",
      endpoint: `/inquiries/${encodeURIComponent(inquiryId)}`,
    });
  }

  async getOrCreateInquiryForBuyer(
    buyerId: string,
    inquiryTemplateId?: string
  ) {
    if (!buyerId) {
      throw new Error("buyerId is required");
    }

    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      throw new Error("Buyer not found");
    }

    const existing = await prisma.personaInquiry.findFirst({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return { record: existing, created: false };
    }

    const templateId = inquiryTemplateId || PERSONA_INQUIRY_TEMPLATE_ID;
    const personaResponse = await this.createInquiry(templateId);
    const inquiryId = personaResponse?.data?.id;

    if (!inquiryId) {
      throw new Error("Persona API did not return an inquiry id");
    }

    const record = await prisma.personaInquiry.create({
      data: {
        inquiryId,
        inquiryTemplateId: templateId!,
        buyerId,
        status: mapPersonaInquiryStatus(personaResponse?.data?.attributes?.status),
        response: personaResponse,
      },
    });

    return { record, created: true };
  }
}

export const personaInquiryService = new PersonaInquiryService();

