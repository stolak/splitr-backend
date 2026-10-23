import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { campaignController } from "../controllers/campaignController";

const router = Router();
const auth = authenticateJWT;
const controller = campaignController;

/**
 * @swagger
 * tags:
 *   - name: Campaign
 *     description: Merchant and Splitr financing promotions
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CampaignMerchantEntry:
 *       type: object
 *       required: [merchantId]
 *       properties:
 *         merchantId:
 *           type: string
 *         approved:
 *           type: boolean
 *           default: false
 *         approvedBy:
 *           type: string
 *           nullable: true
 *         approvedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         approvedRemarks:
 *           type: string
 *           nullable: true
 *     CampaignProductFinancing:
 *       type: object
 *       required: [product]
 *       properties:
 *         product:
 *           type: string
 *           enum: [PayIn4, PayIn6, MonthlyFlex]
 *         reducedPercentage:
 *           type: number
 *           nullable: true
 *           example: 4
 *         productDiscount:
 *           type: object
 *           nullable: true
 *           properties:
 *             fixed:
 *               type: number
 *               nullable: true
 *               example: 300
 *             percentage:
 *               type: number
 *               nullable: true
 *               example: 5
 *     CampaignInput:
 *       type: object
 *       required: [initiatedBy, name, promoType, funding, startDate, endDate]
 *       properties:
 *         merchantId:
 *           type: string
 *           nullable: true
 *           description: Optional owner merchant. Defaults to the authenticated merchant's id when available.
 *         initiatedBy:
 *           type: string
 *           enum: [Merchant, Splitr]
 *         name:
 *           type: string
 *           example: Back to School with Splitr
 *         description:
 *           type: string
 *           example: Seasonal financing promotion for qualifying purchases.
 *         imageName:
 *           type: string
 *           example: campaign.png
 *         outletIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Outlet ids. Empty array means all outlets for the merchant.
 *           example: []
 *         merchantIds:
 *           type: array
 *           description: >
 *             Participating merchants. Accepts merchant id strings or objects.
 *             New entries default to approved=false.
 *           items:
 *             oneOf:
 *               - type: string
 *               - $ref: '#/components/schemas/CampaignMerchantEntry'
 *           example:
 *             - id1
 *             - merchantId: id2
 *               approved: false
 *         eligibility:
 *           type: string
 *           enum: [AllCustomers, NewCustomer, ReturningCustomer]
 *         channels:
 *           type: array
 *           items:
 *             type: string
 *             enum: [OnlineStoreWebsite, InStorePOS, PaymentLinkInvoice]
 *           example: [OnlineStoreWebsite, InStorePOS, PaymentLinkInvoice]
 *         productScope:
 *           type: string
 *           example: All products
 *         promoType:
 *           type: string
 *           enum: [PurchaseDiscount, FixedAmountOff, Mixed]
 *         discountAmount:
 *           type: number
 *           example: 50
 *           description: Required when promoType is FixedAmountOff.
 *         discountPercentage:
 *           type: number
 *           example: 50
 *           description: Required when promoType is PurchaseDiscount.
 *         minPurchase:
 *           type: number
 *           example: 200
 *         allProducts:
 *           type: boolean
 *           example: true
 *         stacking:
 *           type: boolean
 *           example: false
 *         financing:
 *           type: array
 *           items:
 *             type: string
 *             enum: [PayIn4, PayIn6, MonthlyFlex]
 *           example: [PayIn4, PayIn6, MonthlyFlex]
 *         productFinancing:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CampaignProductFinancing'
 *           description: Required when promoType is Mixed.
 *           example:
 *             - product: PayIn4
 *               reducedPercentage: 4
 *               productDiscount:
 *                 fixed: 300
 *                 percentage: 5
 *         splittingRatio:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: >
 *             Funding split ratios keyed by party (e.g. merchant, splitr, or a merchant id).
 *             Values must be between 0 and 1 and sum to 1. Empty object clears a prior ratio.
 *           example:
 *             merchant: 0.3
 *             splitr: 0.7
 *         funding:
 *           type: string
 *           enum: [MerchantFunded, SplitrFunded, MerchantAndSplitrFunded]
 *         budget:
 *           type: number
 *           example: 10000
 *         startDate:
 *           type: string
 *           format: date
 *           example: 2026-10-01
 *         endDate:
 *           type: string
 *           format: date
 *           example: 2026-10-31
 *         confirm:
 *           type: boolean
 *           example: true
 *         approved:
 *           type: boolean
 *           example: false
 *         status:
 *           type: string
 *           enum: [Pending, Active, Expire, Cancel]
 *           default: Pending
 */

/**
 * @swagger
 * /api/v1/campaigns:
 *   get:
 *     summary: List campaigns
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *         description: Owner merchant or a merchant listed in merchantIds
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Active, Expire, Cancel]
 *       - in: query
 *         name: initiatedBy
 *         schema:
 *           type: string
 *           enum: [Merchant, Splitr]
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search name, description, or campaignCode
 *     responses:
 *       200:
 *         description: Campaigns retrieved successfully
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a campaign
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CampaignInput'
 *           example:
 *             initiatedBy: Splitr
 *             name: Back to School with Splitr
 *             description: Seasonal financing promotion for qualifying purchases.
 *             imageName: campaign.png
 *             outletIds: []
 *             merchantIds: []
 *             eligibility: AllCustomers
 *             channels: [OnlineStoreWebsite, InStorePOS, PaymentLinkInvoice]
 *             productScope: All products
 *             promoType: PurchaseDiscount
 *             discountPercentage: 50
 *             minPurchase: 200
 *             allProducts: true
 *             stacking: false
 *             financing: [PayIn4, PayIn6, MonthlyFlex]
 *             productFinancing: []
 *             splittingRatio:
 *               merchant: 0.3
 *               splitr: 0.7
 *             funding: MerchantAndSplitrFunded
 *             budget: 10000
 *             startDate: 2026-10-01
 *             endDate: 2026-10-31
 *             confirm: true
 *             approved: false
 *             status: Pending
 *     responses:
 *       201:
 *         description: Campaign created successfully. campaignCode is auto-generated.
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 */
router.get("/", auth, controller.list.bind(controller));
router.post("/", auth, controller.create.bind(controller));

/**
 * @swagger
 * /api/v1/campaigns/merchant/{merchantId}:
 *   get:
 *     summary: List campaigns related to a merchant
 *     description: >
 *       Returns campaigns where merchantId is the owner (Campaign.merchantId),
 *       or where that merchant appears in Campaign.merchantIds.
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Active, Expire, Cancel]
 *       - in: query
 *         name: initiatedBy
 *         schema:
 *           type: string
 *           enum: [Merchant, Splitr]
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search name, description, or campaignCode
 *     responses:
 *       200:
 *         description: Merchant campaigns retrieved successfully
 *       404:
 *         description: Merchant not found
 */
router.get("/merchant/:merchantId", auth, controller.listByMerchant.bind(controller));

/**
 * @swagger
 * /api/v1/campaigns/code/{campaignCode}:
 *   get:
 *     summary: Get a campaign by campaignCode
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign retrieved successfully
 *       404:
 *         description: Campaign not found
 */
router.get("/code/:campaignCode", auth, controller.getByCode.bind(controller));

/**
 * @swagger
 * /api/v1/campaigns/{id}/approve-merchant:
 *   post:
 *     summary: Approve or reject a merchant's campaign participation
 *     description: >
 *       Updates the matching entry in merchantIds. Merchants can only approve their own
 *       merchantId. Admins must pass merchantId in the body.
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               merchantId:
 *                 type: string
 *                 description: Required for admins. Ignored for merchants (uses JWT merchantId).
 *               approved:
 *                 type: boolean
 *                 default: true
 *               approvedRemarks:
 *                 type: string
 *                 nullable: true
 *           example:
 *             approved: true
 *             approvedRemarks: Accepted terms for this campaign
 *     responses:
 *       200:
 *         description: Merchant approval updated successfully
 *       400:
 *         description: Validation failed or merchant is not part of the campaign
 *       403:
 *         description: Merchant access is required
 *       404:
 *         description: Campaign not found
 */
router.post("/:id/approve-merchant", auth, controller.approveMerchant.bind(controller));

/**
 * @swagger
 * /api/v1/campaigns/{id}:
 *   get:
 *     summary: Get a campaign
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign retrieved successfully
 *       404:
 *         description: Campaign not found
 *   put:
 *     summary: Update a campaign
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CampaignInput'
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Campaign not found
 *   patch:
 *     summary: Partially update a campaign
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CampaignInput'
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Campaign not found
 *   delete:
 *     summary: Delete a campaign
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign deleted successfully
 *       404:
 *         description: Campaign not found
 */
router.get("/:id", auth, controller.getById.bind(controller));
router.put("/:id", auth, controller.update.bind(controller));
router.patch("/:id", auth, controller.update.bind(controller));
router.delete("/:id", auth, controller.remove.bind(controller));

export default router;
