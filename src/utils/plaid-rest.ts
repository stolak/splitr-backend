// utils/plaid-rest.ts

const PLAID_BASE_URL =
  process.env.PLAID_ENV === "production"
    ? "https://production.plaid.com"
    : process.env.PLAID_ENV === "development"
      ? "https://development.plaid.com"
      : "https://sandbox.plaid.com";

export async function plaidPost<T>(endpoint: string, body: Record<string, any>): Promise<T> {
  const response = await fetch(`${PLAID_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      ...body,
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error_message ?? JSON.stringify(json));
  }

  return json;
}
