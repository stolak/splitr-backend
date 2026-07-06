import { CountryCode, Products } from "plaid";
import { getPlaidClient } from "../utils/plaid";

const PLAID_CLIENT_NAME = process.env.PLAID_CLIENT_NAME || "Splitr";
const PLAID_WEBHOOK_URL = process.env.PLAID_WEBHOOK_URL;

export class PlaidService {
  async createLinkToken(userId: string) {
    if (!userId) {
      throw new Error("userId is required");
    }

    const response = await getPlaidClient().linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: PLAID_CLIENT_NAME,
      language: "en",
      country_codes: [CountryCode.Ca],
      products: [Products.Transactions],
      // products: [Products.Transactions, Products.Auth, Products.Identity],

      ...(PLAID_WEBHOOK_URL ? { webhook: PLAID_WEBHOOK_URL } : {}),
    });

    return {
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
    };
  }

  async exchangePublicToken(publicToken: string) {
    if (!publicToken) {
      throw new Error("publicToken is required");
    }

    const response = await getPlaidClient().itemPublicTokenExchange({
      public_token: publicToken,
    });

    return {
      itemId: response.data.item_id,
      requestId: response.data.request_id,
      accessToken: response.data.access_token,
    };
  }
}

export const plaidService = new PlaidService();
