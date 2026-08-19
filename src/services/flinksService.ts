import { flinksRequest, getFlinksErrorMessage } from "../utils/flinks";

export interface AuthorizeInput {
  loginId: string;
  mostRecentCached?: boolean;
}

export class FlinksService {
  /**
   * Generate an authorize token for Flinks Connect / banking services.
   */
  async generateAuthorizeToken() {
    try {
      const data = await flinksRequest<Record<string, unknown>>({
        method: "POST",
        path: "/BankingServices/GenerateAuthorizeToken",
      });

      return data;
    } catch (error) {
      throw new Error(getFlinksErrorMessage(error));
    }
  }

  /**
   * Get income attributes for a Flinks login/account pair.
   */
  async getIncomeAttributes({
    loginId,
    attributeId,
  }: {
    loginId: string;
    attributeId: string;
  }) {
    if (!loginId) throw new Error("loginId is required");
    if (!attributeId) throw new Error("attributeId is required");

    try {
      const data = await flinksRequest<Record<string, unknown>>({
        method: "GET",
        path: `/insight/login/${loginId}/attributes/${attributeId}/GetIncomeAttributes`,
        useXApiKey: true,
      });

      return data;
    } catch (error) {
      throw new Error(getFlinksErrorMessage(error));
    }
  }

  /**
   * Get detailed accounts information including transactions and KYC for a Flinks request.
   */
  async getAccountsDetail({
    requestId,
    withAccountIdentity = true,
    withKYC = true,
    withTransactions = true,
    daysOfTransactions = "Days90",
    withDetailsAndBankingStatements = false,
    numberOfBankingStatements = "MostRecent",
  }: {
    requestId: string;
    withAccountIdentity?: boolean;
    withKYC?: boolean;
    withTransactions?: boolean;
    daysOfTransactions?: string;
    withDetailsAndBankingStatements?: boolean;
    numberOfBankingStatements?: string;
  }) {
    if (!requestId) {
      throw new Error("requestId is required");
    }

    try {
      const data = await flinksRequest<Record<string, unknown>>({
        method: "POST",
        path: "/BankingServices/GetAccountsDetail",
        useXApiKey: true,
        body: {
          RequestId: requestId,
          WithAccountIdentity: withAccountIdentity,
          WithKYC: withKYC,
          WithTransactions: withTransactions,
          DaysOfTransactions: daysOfTransactions,
          WithDetailsAndBankingStatements: withDetailsAndBankingStatements,
          NumberOfBankingStatements: numberOfBankingStatements,
        },
      });

      return data;
    } catch (error) {
      throw new Error(getFlinksErrorMessage(error));
    }
  }

  /**
   * Get accounts summary for a previously authorized Flinks request.
   */
  async getAccountsSummary({
    requestId,
    withBalance = true,
    withAccountIdentity = true,
  }: {
    requestId: string;
    withBalance?: boolean;
    withAccountIdentity?: boolean;
  }) {
    if (!requestId) {
      throw new Error("requestId is required");
    }

    try {
      const data = await flinksRequest<Record<string, unknown>>({
        method: "POST",
        path: "/BankingServices/GetAccountsSummary",
        useXApiKey: true,
        body: {
          RequestId: requestId,
          WithBalance: withBalance,
          WithAccountIdentity: withAccountIdentity,
        },
      });

      return data;
    } catch (error) {
      throw new Error(getFlinksErrorMessage(error));
    }
  }

  /**
   * Authorize a Flinks login and retrieve linked account links.
   */
  async authorize({ loginId, mostRecentCached = true }: AuthorizeInput) {
    if (!loginId) {
      throw new Error("loginId is required");
    }
    // generate authorize token
    const authorizeToken = await this.generateAuthorizeToken();
    if (!authorizeToken) {
      throw new Error("Authorize token not found");
    }
    console.log(authorizeToken.Token);
    try {
      const data = await flinksRequest<Record<string, unknown>>({
        method: "POST",
        path: "/BankingServices/Authorize",
        body: {
          LoginId: loginId,
          MostRecentCached: mostRecentCached,
        },
        authKey: authorizeToken.Token as string,
      });

      return data;
    } catch (error) {
      throw new Error(getFlinksErrorMessage(error));
    }
  }
}

export const flinksService = new FlinksService();
