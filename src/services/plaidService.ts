import {
  CountryCode,
  CreditBankIncomeGetResponse,
  IncomeVerificationSourceType,
  Products,
} from "plaid";
import { getPlaidClient, getPlaidErrorMessage } from "../utils/plaid";
import prisma from "../utils/prisma";
import { plaidPost } from "../utils/plaid-rest";

const PLAID_CLIENT_NAME = process.env.PLAID_CLIENT_NAME || "Splitr";
const PLAID_WEBHOOK_URL = process.env.PLAID_WEBHOOK_URL;
const PLAID_BANK_INCOME_DAYS = Number(process.env.PLAID_BANK_INCOME_DAYS || 60);

export class PlaidService {
  private async ensurePlaidUser(userId: string, buyerId: string) {
    const existing = await prisma.plaidAccount.findUnique({
      where: { userId },
    });

    if (existing?.plaidUserId || existing?.userToken) {
      return existing;
    }

    const userResponse = await getPlaidClient().userCreate({
      client_user_id: userId,
    });

    return prisma.plaidAccount.upsert({
      where: { userId },
      update: {
        buyerId,
        plaidUserId: userResponse.data.user_id,
        userToken: userResponse.data.user_token ?? null,
      },
      create: {
        userId,
        buyerId,
        plaidUserId: userResponse.data.user_id,
        userToken: userResponse.data.user_token ?? null,
      },
    });
  }

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
    const plaidAccount = await this.ensurePlaidUser(userId, buyer.id);

    if (!plaidAccount.plaidUserId) {
      throw new Error("Failed to create Plaid user");
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

    const updatedPlaidAccount = await prisma.plaidAccount.update({
      where: { userId },
      data: {
        buyerId: buyer.id,
        linkToken: response.data.link_token,
        expiration: response.data.expiration,
        publicToken: null,
        itemId: null,
        requestId: null,
      },
    });

    return {
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
      plaidAccountId: updatedPlaidAccount.id,
      plaidUserId: updatedPlaidAccount.plaidUserId,
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
    console.log("response", response);

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

  async getBankIncome(userId: string, count = 1) {
    if (!userId) {
      throw new Error("userId is required");
    }

    const plaidAccount = await prisma.plaidAccount.findUnique({
      where: { userId },
    });

    if (!plaidAccount) {
      throw new Error(
        "Plaid account not found. Create a link token and complete Plaid Link first."
      );
    }

    if (!plaidAccount.plaidUserId && !plaidAccount.userToken) {
      throw new Error("Plaid user not found. Create a link token first.");
    }

    if (!plaidAccount.itemId) {
      throw new Error("Bank account not linked yet. Exchange the public token after Plaid Link.");
    }

    try {
      const response = await getPlaidClient().creditBankIncomeGet({
        // ...(plaidAccount.plaidUserId ? { user_id: plaidAccount.plaidUserId } : {}),
        ...(plaidAccount.userToken ? { user_token: plaidAccount.userToken } : {}),
        options: { count },
      });

      return response.data;
    } catch (error) {
      throw new Error(getPlaidErrorMessage(error));
    }
  }
  async getBankIncomeRest(userId: string, count = 1) {
    if (!userId) {
      throw new Error("userId is required");
    }
    const response = await plaidPost<CreditBankIncomeGetResponse>("/credit/bank_income/get", {
      user_id: userId,
      user_token: "user-sandbox-b0e2c4ee-a763-4df5-bfe9-46a46bce993d",
      options: {
        count: 1,
      },
    });
    return response;
  }
}

export const plaidService = new PlaidService();
