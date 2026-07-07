import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || "sandbox";

let plaidClient: PlaidApi | null = null;

export function getPlaidClient(): PlaidApi {
  if (!PLAID_CLIENT_ID || PLAID_CLIENT_ID.trim().length === 0) {
    throw new Error("PLAID_CLIENT_ID is not set");
  }
  if (!PLAID_SECRET || PLAID_SECRET.trim().length === 0) {
    throw new Error("PLAID_SECRET is not set");
  }

  if (!plaidClient) {
    const envKey = PLAID_ENV as keyof typeof PlaidEnvironments;
    const basePath = PlaidEnvironments[envKey] ?? PlaidEnvironments.sandbox;

    const configuration = new Configuration({
      basePath,
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
          "PLAID-SECRET": PLAID_SECRET,
        },
      },
    });

    plaidClient = new PlaidApi(configuration);
  }

  return plaidClient;
}

export function getPlaidErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { error_message?: string; error_code?: string } } })
      .response?.data;

    if (data?.error_message) {
      return data.error_code
        ? `${data.error_code}: ${data.error_message}`
        : data.error_message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Plaid request failed";
}
