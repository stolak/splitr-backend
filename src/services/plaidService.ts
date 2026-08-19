import {
  CountryCode,
  CreditBankIncomeGetResponse,
  IdentityVerificationCreateRequestUser,
  IdentityVerificationGetResponse,
  IdentityVerificationRequestUser,
  Products,
  Strategy,
} from "plaid";
import { getPlaidClient, getPlaidErrorMessage } from "../utils/plaid";
import prisma from "../utils/prisma";
import { plaidPost } from "../utils/plaid-rest";

const PLAID_CLIENT_NAME = process.env.PLAID_CLIENT_NAME || "Splitr";
const PLAID_WEBHOOK_URL = process.env.PLAID_WEBHOOK_URL;
const PLAID_BANK_INCOME_DAYS = Number(process.env.PLAID_BANK_INCOME_DAYS || 60);
const PLAID_IDV_TEMPLATE_ID = process.env.PLAID_IDV_TEMPLATE_ID;

export type CreateIdentityVerificationInput = {
  isShareable?: boolean;
  gaveConsent?: boolean;
  isIdempotent?: boolean;
  templateId?: string;
  user?: IdentityVerificationCreateRequestUser;
};

export type RetryIdentityVerificationInput = {
  strategy?: Strategy;
  templateId?: string;
  isShareable?: boolean;
  user?: IdentityVerificationRequestUser;
};

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
    console.log(userResponse.data);
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

    // if (!plaidAccount.itemId) {
    //   throw new Error("Bank account not linked yet. Exchange the public token after Plaid Link.");
    // }
    console.log(plaidAccount.userToken);
    console.log(plaidAccount);
    try {
      const response = await getPlaidClient().creditBankIncomeGet({
        ...(plaidAccount.plaidUserId ? { user_id: plaidAccount.plaidUserId } : {}),
        // ...(plaidAccount.userToken ? { user_token: plaidAccount.userToken } : {}),

        // ...(plaidAccount.userToken
        //   ? { user_token: plaidAccount.userToken }
        //   : { user_token: "user-sandbox-b0e2c4ee-a763-4df5-bfe9-46a46bce993d" }),
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
      // user_token: "user-sandbox-b0e2c4ee-a763-4df5-bfe9-46a46bce993d",
      options: {
        count: 1,
      },
    });
    return response;
  }

  private resolveIdvTemplateId(templateId?: string) {
    const resolved = templateId || PLAID_IDV_TEMPLATE_ID;
    if (!resolved) {
      throw new Error("PLAID_IDV_TEMPLATE_ID is not set");
    }
    return resolved;
  }

  async createIdentityVerification(userId: string, input: CreateIdentityVerificationInput = {}) {
    if (!userId) {
      throw new Error("userId is required");
    }

    const templateId = this.resolveIdvTemplateId(input.templateId);

    try {
      const response = await getPlaidClient().identityVerificationCreate({
        client_user_id: userId,
        template_id: templateId,
        is_shareable: input.isShareable ?? false,
        gave_consent: input.gaveConsent ?? false,
        is_idempotent: input.isIdempotent ?? true,
        ...(input.user ? { user: input.user } : {}),
      });

      return response.data;
    } catch (error) {
      throw new Error(getPlaidErrorMessage(error));
    }
  }

  async getIdentityVerification(identityVerificationId: string) {
    if (!identityVerificationId) {
      throw new Error("identityVerificationId is required");
    }

    try {
      const response = await getPlaidClient().identityVerificationGet({
        identity_verification_id: identityVerificationId,
      });

      return response.data;
    } catch (error) {
      throw new Error(getPlaidErrorMessage(error));
    }
  }

  private mapIdentityVerificationToBuyerData(verification: IdentityVerificationGetResponse) {
    const user = verification.user;
    const address = user?.address;
    const name = user?.name;
    const idNumber = user?.id_number;
    const kycSuccess = verification.kyc_check?.status === "success";
    const smsSuccess = verification.verify_sms?.status === "success";

    const data: Record<string, string | boolean> = {};

    if (kycSuccess) {
      data.isVerified = true;
      data.status = "verified";
    }

    if (smsSuccess) {
      data.isPhoneVerified = true;
    }

    if (name?.given_name) data.firstName = name.given_name;
    if (name?.family_name) data.lastName = name.family_name;
    if (user?.date_of_birth) data.DOB = user.date_of_birth;
    if (user?.phone_number) data.phoneNumber = user.phone_number;
    if (user?.email_address) data.email = user.email_address;

    if (address?.street) {
      data.address = address.street2 ? `${address.street}, ${address.street2}` : address.street;
    }
    if (address?.street2) data.houseNo = address.street2;
    if (address?.city) data.city = address.city;
    if (address?.region) {
      data.province = address.region;
      data.state = address.region;
    }
    if (address?.postal_code) data.postalCode = address.postal_code;

    if (idNumber?.type) data.idType = idNumber.type;
    if (idNumber?.value) {
      data.idNumber = idNumber.value;
      if (idNumber.type === "ca_sin") {
        data.sinNumber = idNumber.value;
      }
    }

    return { data, kycSuccess, smsSuccess };
  }

  async syncIdentityVerification(params: { userId: string; buyerId?: string; isAdmin?: boolean }) {
    const { userId, buyerId, isAdmin = false } = params;

    if (!userId) {
      throw new Error("userId is required");
    }

    const buyer = buyerId
      ? await prisma.buyer.findUnique({ where: { id: buyerId } })
      : await prisma.buyer.findUnique({ where: { userId } });

    if (!buyer) {
      throw new Error("Buyer not found");
    }

    if (!isAdmin && buyer.userId !== userId) {
      throw new Error("Unauthorized to sync this buyer");
    }

    if (!buyer.plaidIdentityVerificationId) {
      throw new Error(
        "Buyer has no plaidIdentityVerificationId. Complete identity verification first."
      );
    }

    const verification = await this.getIdentityVerification(buyer.plaidIdentityVerificationId);

    const { data, kycSuccess } = this.mapIdentityVerificationToBuyerData(verification);

    if (Object.keys(data).length === 0) {
      return {
        buyer,
        verification,
        isVerified: buyer.isVerified,
        updated: false,
      };
    }

    if (kycSuccess) {
      await prisma.user.update({
        where: { id: buyer.userId },
        data: { isVerified: true },
      });
    }

    const updatedBuyer = await prisma.buyer.update({
      where: { id: buyer.id },
      data,
    });

    return {
      buyer: updatedBuyer,
      verification,
      isVerified: updatedBuyer.isVerified,
      updated: true,
    };
  }

  async listIdentityVerifications(
    userId: string,
    options: { templateId?: string; cursor?: string } = {}
  ) {
    if (!userId) {
      throw new Error("userId is required");
    }

    const templateId = this.resolveIdvTemplateId(options.templateId);

    try {
      const response = await getPlaidClient().identityVerificationList({
        template_id: templateId,
        client_user_id: userId,
        ...(options.cursor ? { cursor: options.cursor } : {}),
      });

      return response.data;
    } catch (error) {
      throw new Error(getPlaidErrorMessage(error));
    }
  }

  async retryIdentityVerification(userId: string, input: RetryIdentityVerificationInput = {}) {
    if (!userId) {
      throw new Error("userId is required");
    }

    const templateId = this.resolveIdvTemplateId(input.templateId);

    try {
      const response = await getPlaidClient().identityVerificationRetry({
        client_user_id: userId,
        template_id: templateId,
        strategy: input.strategy ?? Strategy.Infer,
        ...(input.isShareable !== undefined ? { is_shareable: input.isShareable } : {}),
        ...(input.user ? { user: input.user } : {}),
      });

      return response.data;
    } catch (error) {
      throw new Error(getPlaidErrorMessage(error));
    }
  }

  async createIdentityVerificationLinkToken(
    userId: string,
    options: { templateId?: string; gaveConsent?: boolean } = {}
  ) {
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
    if (!plaidAccount.id) {
      throw new Error("Failed to create Plaid user");
    }
    const templateId = this.resolveIdvTemplateId(options.templateId);

    try {
      const response = await getPlaidClient().linkTokenCreate({
        user: {
          client_user_id: userId,
        },
        client_name: PLAID_CLIENT_NAME,
        language: "en",
        country_codes: [CountryCode.Ca],
        products: [Products.IdentityVerification],
        identity_verification: {
          template_id: templateId,
          gave_consent: options.gaveConsent ?? false,
        },
        ...(PLAID_WEBHOOK_URL ? { webhook: PLAID_WEBHOOK_URL } : {}),
      });

      await prisma.plaidAccount.update({
        where: { userId },
        data: {
          buyerId: buyer.id,
          linkToken: response.data.link_token,
          expiration: response.data.expiration,
        },
      });
      // update buyer with plaidIdentityVerificationId
      const identityVerification = await this.createIdentityVerification(userId, {
        templateId,
        gaveConsent: options.gaveConsent ?? false,
      });
      await prisma.buyer.update({
        where: { id: buyer.id },
        data: {
          plaidIdentityVerificationId: identityVerification.id,
        },
      });
      return {
        linkToken: response.data.link_token,
        expiration: response.data.expiration,
        plaidAccountId: plaidAccount.id,
        plaidUserId: plaidAccount.plaidUserId,
        templateId,
      };
    } catch (error) {
      throw new Error(getPlaidErrorMessage(error));
    }
  }

  async getCraCheckReportIncomeInsights(userId: string) {
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

    try {
      const response = await getPlaidClient().craCheckReportIncomeInsightsGet({
        ...(plaidAccount.plaidUserId ? { user_id: plaidAccount.plaidUserId } : {}),
        ...(plaidAccount.userToken ? { user_token: plaidAccount.userToken } : {}),
      });

      return response.data;
    } catch (error) {
      throw new Error(getPlaidErrorMessage(error));
    }
  }
}

export const plaidService = new PlaidService();
