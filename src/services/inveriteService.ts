import {
  getInveriteConfig,
  getInveriteErrorMessage,
  inveriteRequest,
} from "../utils/inverite";

export type InveriteRequestType = "web" | "mobile";

export interface CreateInveriteRequestInput {
  ip: string;
  email: string;
  firstname: string;
  lastname: string;
  siteID?: string;
  referenceid?: string;
  type?: InveriteRequestType;
  days?: number;
}

export interface CreateBuyerInveriteRequestInput {
  buyerId: string;
  email: string;
  firstname: string;
  lastname: string;
  ip?: string;
}

export interface CreateInveriteRequestResponse {
  iframeurl: string;
  request_guid: string;
  username: string;
}

export class InveriteService {
  /**
   * Create an Inverite verification request and return the hosted iframe URL.
   */
  async createRequest({
    ip,
    email,
    firstname,
    lastname,
    siteID,
    referenceid,
    type = "web",
    days = 60,
  }: CreateInveriteRequestInput): Promise<CreateInveriteRequestResponse> {
    if (!ip) throw new Error("ip is required");
    if (!email) throw new Error("email is required");
    if (!firstname) throw new Error("firstname is required");
    if (!lastname) throw new Error("lastname is required");

    const { siteId: configSiteId } = getInveriteConfig();
    const resolvedSiteId = siteID ?? configSiteId;

    if (!resolvedSiteId) {
      throw new Error("siteID is required (set INVERITE_SITE_ID or pass siteID)");
    }

    if (type !== "web" && type !== "mobile") {
      throw new Error("type must be either 'web' or 'mobile'");
    }

    if (!Number.isInteger(days) || days <= 0) {
      throw new Error("days must be a positive integer");
    }

    try {
      return await inveriteRequest<CreateInveriteRequestResponse>({
        method: "POST",
        path: "/create",
        body: {
          ip,
          email,
          firstname,
          lastname,
          siteID: resolvedSiteId,
          ...(referenceid !== undefined ? { referenceid } : {}),
          type,
          days,
        },
      });
    } catch (error) {
      throw new Error(getInveriteErrorMessage(error));
    }
  }

  /**
   * Create an Inverite request for an authenticated buyer.
   * siteID, type, and days come from environment configuration.
   */
  async createBuyerRequest({
    buyerId,
    email,
    firstname,
    lastname,
    ip,
  }: CreateBuyerInveriteRequestInput): Promise<CreateInveriteRequestResponse> {
    if (!buyerId) throw new Error("buyerId is required");
    if (!email) throw new Error("email is required");
    if (!firstname) throw new Error("firstname is required");
    if (!lastname) throw new Error("lastname is required");
    if (!ip) throw new Error("ip is required and could not be resolved");

    const { siteId, type, days } = getInveriteConfig();

    return this.createRequest({
      ip,
      email,
      firstname,
      lastname,
      siteID: siteId,
      referenceid: buyerId,
      type,
      days,
    });
  }

  /**
   * Fetch the results of a previously created Inverite request by its GUID.
   */
  async fetchRequest(guid: string): Promise<Record<string, unknown>> {
    if (!guid) throw new Error("guid is required");

    try {
      return await inveriteRequest<Record<string, unknown>>({
        method: "GET",
        path: `/fetch/${encodeURIComponent(guid)}`,
      });
    } catch (error) {
      throw new Error(getInveriteErrorMessage(error));
    }
  }
}

export const inveriteService = new InveriteService();
