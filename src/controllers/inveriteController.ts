import { Request, Response } from "express";
import {
  inveriteService,
  CreateInveriteRequestInput,
  InveriteRequestType,
} from "../services/inveriteService";
import { buyerService } from "../services/buyerService";

function resolveClientIp(req: Request): string | undefined {
  const forwarded = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();

  const ip = forwardedIp || req.ip || req.socket?.remoteAddress;

  if (!ip) return undefined;

  // Normalize IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
  return ip.replace(/^::ffff:/, "");
}

/**
 * @openapi
 * /api/v1/inverite/create:
 *   post:
 *     summary: Create an Inverite verification request
 *     description: >
 *       Calls Inverite POST /api/v2/create and returns the hosted iframe URL,
 *       request GUID, and username. When `ip` is omitted, the caller's IP is used.
 *     tags: [Inverite]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, firstname, lastname]
 *             properties:
 *               ip:
 *                 type: string
 *                 example: "123.123.123.123"
 *               email:
 *                 type: string
 *                 example: "test@inverite.com"
 *               firstname:
 *                 type: string
 *                 example: "First"
 *               lastname:
 *                 type: string
 *                 example: "Last"
 *               siteID:
 *                 type: string
 *                 description: Defaults to INVERITE_SITE_ID when omitted
 *                 example: "9"
 *               referenceid:
 *                 type: string
 *                 example: "123456"
 *               type:
 *                 type: string
 *                 enum: [web, mobile]
 *                 default: web
 *               days:
 *                 type: integer
 *                 default: 60
 *     responses:
 *       200:
 *         description: Verification request created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     iframeurl:
 *                       type: string
 *                     request_guid:
 *                       type: string
 *                     username:
 *                       type: string
 *       400:
 *         description: Validation or Inverite error
 *       401:
 *         description: Unauthorized
 */
export async function createRequest(req: Request, res: Response) {
  try {
    const { ip, email, firstname, lastname, siteID, referenceid, type, days } = (req.body ??
      {}) as Partial<CreateInveriteRequestInput>;

    const resolvedIp = ip || resolveClientIp(req);

    if (!resolvedIp) {
      return res
        .status(400)
        .json({ success: false, message: "ip is required and could not be resolved" });
    }

    if (!email) {
      return res.status(400).json({ success: false, message: "email is required" });
    }

    if (!firstname) {
      return res.status(400).json({ success: false, message: "firstname is required" });
    }

    if (!lastname) {
      return res.status(400).json({ success: false, message: "lastname is required" });
    }

    const result = await inveriteService.createRequest({
      ip: resolvedIp,
      email,
      firstname,
      lastname,
      ...(siteID !== undefined ? { siteID: String(siteID) } : {}),
      ...(referenceid !== undefined ? { referenceid: String(referenceid) } : {}),
      ...(type !== undefined ? { type: type as InveriteRequestType } : {}),
      ...(days !== undefined ? { days: Number(days) } : {}),
    });

    return res.status(200).json({
      success: true,
      message: "Inverite request created successfully",
      data: result,
    });
  } catch (error: any) {
    const message = error?.message || "Failed to create Inverite request";
    return res.status(400).json({ success: false, message });
  }
}

/**
 * @openapi
 * /api/v1/inverite/buyer/create:
 *   post:
 *     summary: Create an Inverite verification request for the authenticated buyer
 *     description: >
 *       Uses the authenticated buyer's profile for email, firstname, and lastname.
 *       Sets referenceid to the buyer ID. siteID, type, and days are read from env.
 *       Only `ip` is accepted from the request body and is optional.
 *     tags: [Inverite]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ip:
 *                 type: string
 *                 example: "185.238.28.36"
 *     responses:
 *       200:
 *         description: Verification request created
 *       400:
 *         description: Validation or Inverite error
 *       401:
 *         description: Unauthorized
 */
export async function createBuyerRequest(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    console.log("req.user", req.user);
    if (req.user?.userType?.toUpperCase() !== "BUYER") {
      return res.status(403).json({
        success: false,
        message: "Only buyers can create Inverite requests",
      });
    }

    const buyer = await buyerService.getBuyerByUserId(userId);
    const { ip } = (req.body ?? {}) as { ip?: string };
    const resolvedIp = ip || resolveClientIp(req);

    if (!resolvedIp) {
      return res.status(400).json({
        success: false,
        message: "ip is required and could not be resolved",
      });
    }

    if (!buyer.email) {
      return res.status(400).json({
        success: false,
        message: "Buyer email is required",
      });
    }

    if (!buyer.firstName) {
      return res.status(400).json({
        success: false,
        message: "Buyer first name is required",
      });
    }

    if (!buyer.lastName) {
      return res.status(400).json({
        success: false,
        message: "Buyer last name is required",
      });
    }

    const result = await inveriteService.createBuyerRequest({
      buyerId: buyer.id,
      email: buyer.email,
      firstname: buyer.firstName,
      lastname: buyer.lastName,
      ip: resolvedIp,
    });

    return res.status(200).json({
      success: true,
      message: "Inverite request created successfully",
      data: result,
    });
  } catch (error: any) {
    const message = error?.message || "Failed to create Inverite request";
    const status = message.includes("not found") ? 404 : 400;
    return res.status(status).json({ success: false, message });
  }
}

/**
 * @openapi
 * /api/v1/inverite/fetch/{guid}:
 *   get:
 *     summary: Fetch an Inverite request by GUID
 *     description: >
 *       Calls Inverite GET /api/v2/fetch/{guid} to retrieve the verification
 *       results for a request created earlier.
 *     tags: [Inverite]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *         description: The request_guid returned by the create endpoint
 *         example: "9633F964-513E-11E7-A970-6EC618044181"
 *     responses:
 *       200:
 *         description: Request retrieved
 *       400:
 *         description: Validation or Inverite error
 *       401:
 *         description: Unauthorized
 */
export async function fetchRequest(req: Request, res: Response) {
  try {
    const { guid } = req.params;

    if (!guid) {
      return res.status(400).json({ success: false, message: "guid is required" });
    }

    const result = await inveriteService.fetchRequest(guid);

    return res.status(200).json({
      success: true,
      message: "Inverite request fetched successfully",
      data: result,
    });
  } catch (error: any) {
    const message = error?.message || "Failed to fetch Inverite request";
    return res.status(400).json({ success: false, message });
  }
}
