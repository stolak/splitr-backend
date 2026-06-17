import { Request, Response } from "express";
import { personaInquiryService } from "../services/personaInquiryService";

/**
 * @openapi
 * components:
 *   schemas:
 *     PersonaInquiryAttributes:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: created
 *         reference-id:
 *           type: string
 *           nullable: true
 *         note:
 *           type: string
 *           nullable: true
 *         creator:
 *           type: string
 *           example: API
 *         created-at:
 *           type: string
 *           format: date-time
 *         updated-at:
 *           type: string
 *           format: date-time
 *         expires-at:
 *           type: string
 *           format: date-time
 *         next-step-name:
 *           type: string
 *           example: start
 *     PersonaInquiry:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           example: inquiry
 *         id:
 *           type: string
 *           example: inq_ArBFGqtTeKAxBQNddW773J2V8uoBUC
 *         attributes:
 *           $ref: '#/components/schemas/PersonaInquiryAttributes'
 *     PersonaInquiryResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/PersonaInquiry'
 *         meta:
 *           type: object
 *           properties:
 *             session-token:
 *               type: string
 *               nullable: true
 *             one-time-link:
 *               type: string
 *               nullable: true
 *             one-time-link-short:
 *               type: string
 *               nullable: true
 *     PersonaInquiryListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PersonaInquiry'
 *         links:
 *           type: object
 *           properties:
 *             prev:
 *               type: string
 *               nullable: true
 *             next:
 *               type: string
 *               nullable: true
 *     CreatePersonaInquiryInput:
 *       type: object
 *       properties:
 *         inquiryTemplateId:
 *           type: string
 *           description: Optional override for PERSONA_INQUIRY_TEMPLATE_ID
 *           example: itmpl_ArBFGqtRxSjWkG9ZqwmFKFKNuAGRt5
 *     PersonaInquiryRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         inquiryId:
 *           type: string
 *           example: inq_ArBFGqtTeKAxBQNddW773J2V8uoBUC
 *         inquiryTemplateId:
 *           type: string
 *         buyerId:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [Created, Completed, Failed]
 *         response:
 *           type: object
 *           nullable: true
 *           description: Full Persona API response payload
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     BuyerPersonaInquiryResponse:
 *       type: object
 *       properties:
 *         created:
 *           type: boolean
 *           description: True when a new inquiry was created; false when an existing record was returned
 *         record:
 *           $ref: '#/components/schemas/PersonaInquiryRecord'
 *     UpdatePersonaInquiryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: True when Persona inquiry is completed and buyer was verified
 *         message:
 *           type: string
 *         buyer:
 *           type: object
 *           description: Updated buyer record when completed; otherwise mapped field data from Persona
 *         record:
 *           $ref: '#/components/schemas/PersonaInquiryRecord'
 *           description: Present when inquiry is completed
 */

/**
 * @openapi
 * /api/v1/persona/inquiries:
 *   post:
 *     summary: Create a Persona inquiry
 *     description: Proxies to Persona API POST /inquiries using the configured inquiry template.
 *     tags: [Persona]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePersonaInquiryInput'
 *     responses:
 *       200:
 *         description: Inquiry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonaInquiryResponse'
 *       400:
 *         description: Missing configuration or Persona API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
export async function createInquiry(req: Request, res: Response) {
  try {
    const { inquiryTemplateId } = req.body || {};
    const result = await personaInquiryService.createInquiry(inquiryTemplateId);
    return res.status(200).json(result);
  } catch (error: any) {
    const message =
      typeof error === "string" ? error : error?.message || "Failed to create Persona inquiry";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/persona/inquiries:
 *   get:
 *     summary: List all Persona inquiries
 *     description: Proxies to Persona API GET /inquiries.
 *     tags: [Persona]
 *     responses:
 *       200:
 *         description: Inquiries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonaInquiryListResponse'
 *       500:
 *         description: Persona API or server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
export async function listInquiries(_req: Request, res: Response) {
  try {
    const result = await personaInquiryService.listInquiries();
    return res.status(200).json(result);
  } catch (error: any) {
    const message =
      typeof error === "string" ? error : error?.message || "Failed to list Persona inquiries";
    return res.status(500).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/persona/inquiries/{inquiryId}:
 *   get:
 *     summary: Retrieve a Persona inquiry by ID
 *     description: Proxies to Persona API GET /inquiries/{inquiryId}.
 *     tags: [Persona]
 *     parameters:
 *       - in: path
 *         name: inquiryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Persona inquiry ID
 *         example: inq_ArBFGqtTeKAxBQNddW773J2V8uoBUC
 *     responses:
 *       200:
 *         description: Inquiry retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonaInquiryResponse'
 *       400:
 *         description: Invalid inquiry ID or Persona API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
export async function getInquiry(req: Request, res: Response) {
  try {
    const { inquiryId } = req.params;

    if (!inquiryId) {
      return res.status(400).json({ message: "inquiryId is required" });
    }

    const result = await personaInquiryService.getInquiry(inquiryId);
    return res.status(200).json(result);
  } catch (error: any) {
    const message =
      typeof error === "string" ? error : error?.message || "Failed to retrieve Persona inquiry";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/persona/inquiries/buyer/{buyerId}:
 *   post:
 *     summary: Get or create a Persona inquiry for a buyer
 *     description: Returns the existing persona_inquiry record for the buyer if one exists; otherwise creates a Persona inquiry via the API, stores it locally, and returns the new record.
 *     tags: [Persona]
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Buyer ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePersonaInquiryInput'
 *     responses:
 *       200:
 *         description: Existing inquiry record returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BuyerPersonaInquiryResponse'
 *       201:
 *         description: New inquiry created and stored
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BuyerPersonaInquiryResponse'
 *       400:
 *         description: Invalid request or Persona API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Buyer not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
export async function getOrCreateInquiryForBuyer(req: Request, res: Response) {
  try {
    const { buyerId } = req.params;
    const { inquiryTemplateId } = req.body || {};

    const result = await personaInquiryService.getOrCreateInquiryForBuyer(
      buyerId,
      inquiryTemplateId
    );

    return res.status(result.created ? 201 : 200).json({
      created: result.created,
      record: result.record,
    });
  } catch (error: any) {
    const message =
      typeof error === "string"
        ? error
        : error?.message || "Failed to get or create Persona inquiry for buyer";

    if (message === "Buyer not found") {
      return res.status(404).json({ message });
    }

    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/persona/inquiries/{inquiryId}/sync:
 *   patch:
 *     summary: Sync a local Persona inquiry record with Persona
 *     description: Fetches the latest inquiry status from Persona using the Persona inquiry ID. If status is completed, verifies the linked user and buyer and maps Persona field data to the buyer profile. Otherwise updates the local inquiry status and response only.
 *     tags: [Persona]
 *     parameters:
 *       - in: path
 *         name: inquiryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Persona inquiry ID
 *         example: inq_ArBFGqt47V5UidzFu1RKkeKeiSuTm3
 *     responses:
 *       200:
 *         description: Inquiry synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdatePersonaInquiryResponse'
 *       400:
 *         description: Persona API or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Local inquiry record not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
export async function updateInquiry(req: Request, res: Response) {
  try {
    const { inquiryId } = req.params;

    if (!inquiryId) {
      return res.status(400).json({ message: "inquiryId is required" });
    }

    const result = await personaInquiryService.updateInquiry(inquiryId);
    return res.status(200).json(result);
  } catch (error: any) {
    const message =
      typeof error === "string"
        ? error
        : error?.message || "Failed to sync Persona inquiry";

    if (message === "Inquiry not found") {
      return res.status(404).json({ message });
    }

    return res.status(400).json({ message });
  }
}
