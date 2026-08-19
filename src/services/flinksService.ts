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
