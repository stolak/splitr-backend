import { CountryCode, Products } from "plaid";
import { getPlaidClient } from "../utils/plaid";
import prisma from "../utils/prisma";

const PLAID_CLIENT_NAME = process.env.PLAID_CLIENT_NAME || "Splitr";
const PLAID_WEBHOOK_URL = process.env.PLAID_WEBHOOK_URL;

export class PlaidService {
  async createLinkToken(userId: string) {
    if (!userId) {
      throw new Error("userId is required");
    }

    const buyer = await prisma.buyer.findUnique({
      select: { id: true },
      where: { userId },
    });

    if (!buyer) {
      throw new Error("Buyer not found");
    }

    const response = await getPlaidClient().linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: PLAID_CLIENT_NAME,
      language: "en",
      country_codes: [CountryCode.Ca],
      products: [Products.Transactions, Products.Auth, Products.Identity],
      ...(PLAID_WEBHOOK_URL ? { webhook: PLAID_WEBHOOK_URL } : {}),
    });

    const plaidAccount = await prisma.plaidAccount.upsert({
      where: { userId },
      update: {
        buyerId: buyer.id,
        linkToken: response.data.link_token,
        expiration: response.data.expiration,
        publicToken: null,
        itemId: null,
        requestId: null,
      },
      create: {
        userId,
        buyerId: buyer.id,
        linkToken: response.data.link_token,
        expiration: response.data.expiration,
      },
    });

    return {
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
      plaidAccountId: plaidAccount.id,
    };
  }

  async exchangePublicToken(userId: string, publicToken: string) {
    if (!userId) {
      throw new Error("userId is required");
    }

    if (!publicToken) {
      throw new Error("publicToken is required");
    }

    const response = await getPlaidClient().itemPublicTokenExchange({
      public_token: publicToken,
    });

    const plaidAccount = await prisma.plaidAccount.update({
      where: { userId },
      data: {
        publicToken,
        itemId: response.data.item_id,
        requestId: response.data.request_id,
        accessToken: response.data.access_token,
      },
    });

    return {
      itemId: response.data.item_id,
      requestId: response.data.request_id,
      accessToken: response.data.access_token,
      plaidAccountId: plaidAccount.id,
    };
  }

  async getBankIncome(input: { userToken: string; count?: number }) {
    console.log("input", input);
    if (!input.userToken) {
      throw new Error("userToken is required");
    }

    const response = await getPlaidClient().creditBankIncomeGet({
      user_token: input.userToken,
      options: {
        count: input.count ?? 1,
      },
    });

    return response.data;
  }
}

export const plaidService = new PlaidService();
