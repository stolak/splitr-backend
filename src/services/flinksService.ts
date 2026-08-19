import { flinksRequest, getFlinksErrorMessage } from "../utils/flinks";

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
}

export const flinksService = new FlinksService();
