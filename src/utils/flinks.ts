const FLINKS_BASE_URL = process.env.FLINKS_BASE_URL?.replace(/\/$/, "");
const FLINKS_AUTH_KEY = process.env.FLINKS_AUTH_KEY;
const FLINKS_CUSTOMER_ID = process.env.FLINKS_CUSTOMER_ID;
const FLINKS_X_API_KEY = process.env.FLINKS_X_API_KEY;

export function getFlinksConfig() {
  if (!FLINKS_BASE_URL) {
    throw new Error("FLINKS_BASE_URL is not set");
  }
  if (!FLINKS_AUTH_KEY) {
    throw new Error("FLINKS_AUTH_KEY is not set");
  }
  if (!FLINKS_CUSTOMER_ID) {
    throw new Error("FLINKS_CUSTOMER_ID is not set");
  }

  return {
    baseUrl: FLINKS_BASE_URL,
    authKey: FLINKS_AUTH_KEY,
    customerId: FLINKS_CUSTOMER_ID,
    xApiKey: FLINKS_X_API_KEY,
  };
}

export function getFlinksErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Flinks request failed";
}

type FlinksRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: Record<string, unknown>;
  /** Override the flinks-auth-key from env */
  authKey?: string;
  /** When true, uses x-api-key header instead of flinks-auth-key (e.g. BankingServices data endpoints) */
  useXApiKey?: boolean;
  /** Override the x-api-key from env */
  xApiKey?: string;
};

export async function flinksRequest<T>({
  method = "POST",
  path,
  body,
  authKey: overrideAuthKey,
  useXApiKey = false,
  xApiKey: overrideXApiKey,
}: FlinksRequestOptions): Promise<T> {
  const {
    baseUrl,
    authKey: configAuthKey,
    customerId,
    xApiKey: configXApiKey,
  } = getFlinksConfig();

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}/${customerId}${normalizedPath}`;

  const authHeaders: Record<string, string> = useXApiKey
    ? { "x-api-key": overrideXApiKey ?? configXApiKey ?? "" }
    : { "flinks-auth-key": overrideAuthKey ?? configAuthKey };

  const response = await fetch(url, {
    method,
    headers: {
      ...authHeaders,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (json && typeof json === "object" && "Message" in json && String(json.Message)) ||
      (json && typeof json === "object" && "message" in json && String(json.message)) ||
      JSON.stringify(json) ||
      `Flinks request failed with status ${response.status}`;
    throw new Error(message);
  }

  return json as T;
}
