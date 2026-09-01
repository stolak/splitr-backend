const INVERITE_BASE_URL = process.env.INVERITE_BASE_URL?.replace(/\/$/, "");
const INVERITE_API_KEY = process.env.INVERITE_API_KEY;
const INVERITE_SITE_ID = process.env.INVERITE_SITE_ID;
const INVERITE_TYPE = process.env.INVERITE_TYPE ?? "web";
const INVERITE_DAYS = Number(process.env.INVERITE_DAYS ?? "60");

export function getInveriteConfig() {
  if (!INVERITE_BASE_URL) {
    throw new Error("INVERITE_BASE_URL is not set");
  }
  if (!INVERITE_API_KEY) {
    throw new Error("INVERITE_API_KEY is not set");
  }
  if (!INVERITE_SITE_ID) {
    throw new Error("INVERITE_SITE_ID is not set");
  }

  if (INVERITE_TYPE !== "web" && INVERITE_TYPE !== "mobile") {
    throw new Error("INVERITE_TYPE must be either 'web' or 'mobile'");
  }

  if (!Number.isInteger(INVERITE_DAYS) || INVERITE_DAYS <= 0) {
    throw new Error("INVERITE_DAYS must be a positive integer");
  }

  return {
    baseUrl: INVERITE_BASE_URL,
    apiKey: INVERITE_API_KEY,
    siteId: INVERITE_SITE_ID,
    type: INVERITE_TYPE as "web" | "mobile",
    days: INVERITE_DAYS,
  };
}

export function getInveriteErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Inverite request failed";
}

type InveriteRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: Record<string, unknown>;
  /** Override the Auth key from env */
  apiKey?: string;
};

export async function inveriteRequest<T>({
  method = "POST",
  path,
  body,
  apiKey: overrideApiKey,
}: InveriteRequestOptions): Promise<T> {
  const { baseUrl, apiKey } = getInveriteConfig();

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  const response = await fetch(url, {
    method,
    headers: {
      Auth: overrideApiKey ?? apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (json && typeof json === "object" && "message" in json && String(json.message)) ||
      (json && typeof json === "object" && "error" in json && String(json.error)) ||
      (json ? JSON.stringify(json) : null) ||
      `Inverite request failed with status ${response.status}`;
    throw new Error(message);
  }

  return json as T;
}
