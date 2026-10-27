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
 *         businessName:
 *           type: string
 *           nullable: true
 *           description: Resolved from Merchant on read (not stored in merchantIds JSON).
 *         splitrId:
 *           type: string
 *           nullable: true
 *           description: Resolved from Merchant on read (not stored in merchantIds JSON).
 *     CampaignProductFinanceChargeDiscount:
 *       type: object
 *       required: [product, financeChargeDiscountPercentage]
 *       properties:
 *         product:
 *           type: string
 *           enum: [PayIn4, PayIn6, MonthlyFlex]
 *         financeChargeDiscountPercentage:
 *           type: number
 *           minimum: 0
 *           exclusiveMinimum: true
 *           maximum: 100
 *           example: 4
 *     CampaignInput:
 *       type: object
 *       required:
 *         - initiatedBy
 *         - name
 *         - promoType
 *         - financingProducts
 *         - funding
 *         - startDate
 *         - endDate
 *       properties:
 *         merchantId:
 *           type: string
 *           nullable: true
 *           description: Owner merchant. Required when initiatedBy is Merchant.
 *         initiatedBy:
 *           type: string
 *           enum: [Merchant, Splitr]
 *         name:
 *           type: string
 *           example: Back to School with Splitr
 *         description:
 *           type: string
 *           example: Seasonal financing promotion for qualifying purchases.
 *         imageUrl:
 *           type: string
 *           example: https://cdn.example.com/campaigns/campaign.png
 *           description: Public URL of the campaign image (not a filename).
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
 *         financingProducts:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *             enum: [PayIn4, PayIn6, MonthlyFlex]
 *           example: [PayIn4, PayIn6, MonthlyFlex]
 *           description: At least one financing product is required.
 *         promoType:
 *           type: string
 *           enum: [PurchaseDiscount, FinanceChargeDiscount, Mixed]
 *         purchaseDiscountType:
 *           type: string
 *           nullable: true
 *           enum: [FixedAmountOff, PercentageOff]
 *           description: Required when promoType is PurchaseDiscount or Mixed.
 *         purchaseDiscountAmount:
 *           type: number
 *           example: 50
 *           description: Required when purchaseDiscountType is FixedAmountOff.
 *         purchaseDiscountPercentage:
 *           type: number
 *           example: 10
 *           description: Required when purchaseDiscountType is PercentageOff.
 *         minPurchase:
 *           type: number
 *           example: 200
 *         allProducts:
 *           type: boolean
 *           example: true
 *         productFinanceChargeDiscount:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CampaignProductFinanceChargeDiscount'
 *           description: >
 *             Required when promoType is FinanceChargeDiscount or Mixed.
 *             Must include exactly one entry for every product in financingProducts
 *             (and no products outside financingProducts). Must be empty for PurchaseDiscount.
 *           example:
 *             - product: PayIn4
 *               financeChargeDiscountPercentage: 4
 *             - product: PayIn6
 *               financeChargeDiscountPercentage: 6
 *         splittingRatio:
 *           type: object
 *           properties:
 *             merchant:
 *               type: number
 *               example: 0.3
 *             splitr:
 *               type: number
 *               example: 0.7
 *           description: >
 *             Required when funding is MerchantAndSplitrFunded (both sides > 0, merchant + splitr = 1).
 *             Ignored/overwritten when MerchantFunded ({merchant:1,splitr:0}) or
 *             SplitrFunded ({merchant:0,splitr:1}).
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
 *           enum: [Pending, Active, Expire, Cancel, Paused, Cancelled]
 *       - in: query
 *         name: funding
 *         schema:
 *           type: string
 *           enum: [MerchantFunded, SplitrFunded, MerchantAndSplitrFunded]
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
 *         description: >
 *           Campaigns retrieved successfully. Admin/Splitr see all campaigns across funding types.
 *           Merchants are scoped to their merchant relation when merchantId is applied.
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a campaign
 *     description: |
 *       Creates a campaign. `campaignCode` is auto-generated (CMP-YYMM-XXXXXXXX).
 *
 *       Funding create permissions (enforced server-side):
 *       - Merchant: MerchantFunded, MerchantAndSplitrFunded (not SplitrFunded)
 *       - Admin/Splitr: SplitrFunded, MerchantAndSplitrFunded (not MerchantFunded)
 *
 *       Activation is evaluated after create / approve / merchant acceptance.
 *       Client-supplied `status` and `approved` are ignored on create.
 *
 *       Rules:
 *       - `financingProducts` must include at least one of PayIn4, PayIn6, MonthlyFlex
 *       - PurchaseDiscount / Mixed: require `purchaseDiscountType` + amount or percentage
 *       - FinanceChargeDiscount / Mixed: `productFinanceChargeDiscount` must 1:1 match `financingProducts`
 *       - PurchaseDiscount: `productFinanceChargeDiscount` must be [] or omitted
 *       - FinanceChargeDiscount: purchase discount fields must be omitted/null
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CampaignInput'
 *           examples:
 *             purchaseDiscountPercentageAllProducts:
 *               summary: Purchase % off — all financing products
 *               value:
 *                 initiatedBy: Splitr
 *                 name: Back to School with Splitr
 *                 description: Seasonal financing promotion for qualifying purchases.
 *                 imageUrl: https://cdn.example.com/campaigns/campaign.png
 *                 outletIds: []
 *                 merchantIds: []
 *                 eligibility: AllCustomers
 *                 channels: [OnlineStoreWebsite, InStorePOS, PaymentLinkInvoice]
 *                 productScope: All products
 *                 financingProducts: [PayIn4, PayIn6, MonthlyFlex]
 *                 promoType: PurchaseDiscount
 *                 purchaseDiscountType: PercentageOff
 *                 purchaseDiscountPercentage: 10
 *                 minPurchase: 200
 *                 allProducts: true
 *                 productFinanceChargeDiscount: []
 *                 splittingRatio:
 *                   merchant: 0.3
 *                   splitr: 0.7
 *                 funding: MerchantAndSplitrFunded
 *                 budget: 10000
 *                 startDate: "2026-10-01"
 *                 endDate: "2026-10-31"
 *                 confirm: true
 *                 approved: false
 *                 status: Pending
 *             purchaseDiscountFixedAmountMerchant:
 *               summary: Purchase fixed $ off — merchant-initiated
 *               value:
 *                 merchantId: merchant-uuid-1
 *                 initiatedBy: Merchant
 *                 name: $50 Off Fall Sale
 *                 description: Fixed amount off purchases of $300+
 *                 outletIds: []
 *                 merchantIds: []
 *                 eligibility: AllCustomers
 *                 channels: [InStorePOS, OnlineStoreWebsite]
 *                 productScope: All products
 *                 financingProducts: [PayIn4]
 *                 promoType: PurchaseDiscount
 *                 purchaseDiscountType: FixedAmountOff
 *                 purchaseDiscountAmount: 50
 *                 minPurchase: 300
 *                 allProducts: true
 *                 productFinanceChargeDiscount: []
 *                 funding: MerchantFunded
 *                 budget: 5000
 *                 startDate: "2026-10-01"
 *                 endDate: "2026-11-15"
 *                 confirm: true
 *                 status: Pending
 *             purchaseDiscountNewCustomersPayIn4And6:
 *               summary: Purchase % off — new customers, PayIn4 + PayIn6
 *               value:
 *                 merchantId: merchant-uuid-1
 *                 initiatedBy: Merchant
 *                 name: New Customer Welcome
 *                 eligibility: NewCustomer
 *                 channels: [OnlineStoreWebsite]
 *                 financingProducts: [PayIn4, PayIn6]
 *                 promoType: PurchaseDiscount
 *                 purchaseDiscountType: PercentageOff
 *                 purchaseDiscountPercentage: 15
 *                 minPurchase: 100
 *                 allProducts: true
 *                 productFinanceChargeDiscount: []
 *                 funding: MerchantFunded
 *                 startDate: "2026-10-01"
 *                 endDate: "2026-12-31"
 *                 confirm: true
 *             purchaseDiscountReturningOutletScoped:
 *               summary: Purchase fixed off — returning customers, specific outlets
 *               value:
 *                 merchantId: merchant-uuid-1
 *                 initiatedBy: Merchant
 *                 name: Loyalty Outlet Promo
 *                 eligibility: ReturningCustomer
 *                 outletIds: [outlet-uuid-a, outlet-uuid-b]
 *                 channels: [InStorePOS]
 *                 financingProducts: [MonthlyFlex]
 *                 promoType: PurchaseDiscount
 *                 purchaseDiscountType: FixedAmountOff
 *                 purchaseDiscountAmount: 25
 *                 minPurchase: 150
 *                 allProducts: false
 *                 productScope: Selected SKUs
 *                 productFinanceChargeDiscount: []
 *                 funding: MerchantFunded
 *                 startDate: "2026-10-15"
 *                 endDate: "2026-10-31"
 *                 confirm: false
 *                 status: Pending
 *             financeChargeAllProducts:
 *               summary: Finance charge discount — all products
 *               value:
 *                 initiatedBy: Splitr
 *                 name: Zero Fee October
 *                 description: Reduce finance charges across all plans
 *                 merchantIds:
 *                   - merchantId: merchant-uuid-1
 *                     approved: false
 *                   - merchantId: merchant-uuid-2
 *                     approved: false
 *                 eligibility: AllCustomers
 *                 channels: [OnlineStoreWebsite, InStorePOS, PaymentLinkInvoice]
 *                 financingProducts: [PayIn4, PayIn6, MonthlyFlex]
 *                 promoType: FinanceChargeDiscount
 *                 productFinanceChargeDiscount:
 *                   - product: PayIn4
 *                     financeChargeDiscountPercentage: 100
 *                   - product: PayIn6
 *                     financeChargeDiscountPercentage: 50
 *                   - product: MonthlyFlex
 *                     financeChargeDiscountPercentage: 25
 *                 splittingRatio:
 *                   merchant: 0.5
 *                   splitr: 0.5
 *                 funding: MerchantAndSplitrFunded
 *                 budget: 20000
 *                 startDate: "2026-10-01"
 *                 endDate: "2026-10-31"
 *                 confirm: true
 *                 approved: false
 *                 status: Pending
 *             financeChargePayIn4Only:
 *               summary: Finance charge discount — PayIn4 only
 *               value:
 *                 merchantId: merchant-uuid-1
 *                 initiatedBy: Merchant
 *                 name: PayIn4 Fee Cut
 *                 eligibility: AllCustomers
 *                 channels: [PaymentLinkInvoice]
 *                 financingProducts: [PayIn4]
 *                 promoType: FinanceChargeDiscount
 *                 productFinanceChargeDiscount:
 *                   - product: PayIn4
 *                     financeChargeDiscountPercentage: 4
 *                 funding: MerchantFunded
 *                 startDate: "2026-10-01"
 *                 endDate: "2026-11-30"
 *                 confirm: true
 *             financeChargeSplitrFunded:
 *               summary: Finance charge discount — Splitr funded
 *               value:
 *                 initiatedBy: Splitr
 *                 name: Splitr Covers Fees
 *                 merchantIds: [merchant-uuid-1, merchant-uuid-2]
 *                 eligibility: NewCustomer
 *                 channels: [OnlineStoreWebsite]
 *                 financingProducts: [PayIn4, PayIn6]
 *                 promoType: FinanceChargeDiscount
 *                 productFinanceChargeDiscount:
 *                   - product: PayIn4
 *                     financeChargeDiscountPercentage: 10
 *                   - product: PayIn6
 *                     financeChargeDiscountPercentage: 8
 *                 splittingRatio:
 *                   merchant: 0
 *                   splitr: 1
 *                 funding: SplitrFunded
 *                 budget: 15000
 *                 startDate: "2026-11-01"
 *                 endDate: "2026-11-30"
 *                 confirm: true
 *                 approved: true
 *                 status: Active
 *             mixedPercentageAndFinanceCharge:
 *               summary: Mixed — purchase % off + finance charge discounts
 *               value:
 *                 initiatedBy: Splitr
 *                 name: Mega Mixed Promo
 *                 description: Purchase discount plus reduced finance charges
 *                 merchantIds:
 *                   - merchantId: merchant-uuid-1
 *                     approved: false
 *                 eligibility: AllCustomers
 *                 channels: [OnlineStoreWebsite, InStorePOS]
 *                 financingProducts: [PayIn4, PayIn6, MonthlyFlex]
 *                 promoType: Mixed
 *                 purchaseDiscountType: PercentageOff
 *                 purchaseDiscountPercentage: 5
 *                 minPurchase: 250
 *                 allProducts: true
 *                 productFinanceChargeDiscount:
 *                   - product: PayIn4
 *                     financeChargeDiscountPercentage: 4
 *                   - product: PayIn6
 *                     financeChargeDiscountPercentage: 6
 *                   - product: MonthlyFlex
 *                     financeChargeDiscountPercentage: 3
 *                 splittingRatio:
 *                   merchant: 0.3
 *                   splitr: 0.7
 *                 funding: MerchantAndSplitrFunded
 *                 budget: 25000
 *                 startDate: "2026-10-01"
 *                 endDate: "2026-12-31"
 *                 confirm: true
 *                 status: Pending
 *             mixedFixedAmountAndFinanceCharge:
 *               summary: Mixed — fixed $ off + finance charge (PayIn4 + MonthlyFlex)
 *               value:
 *                 merchantId: merchant-uuid-1
 *                 initiatedBy: Merchant
 *                 name: Bundle & Save Mixed
 *                 eligibility: ReturningCustomer
 *                 outletIds: [outlet-uuid-a]
 *                 channels: [InStorePOS]
 *                 financingProducts: [PayIn4, MonthlyFlex]
 *                 promoType: Mixed
 *                 purchaseDiscountType: FixedAmountOff
 *                 purchaseDiscountAmount: 75
 *                 minPurchase: 500
 *                 allProducts: true
 *                 productFinanceChargeDiscount:
 *                   - product: PayIn4
 *                     financeChargeDiscountPercentage: 2
 *                   - product: MonthlyFlex
 *                     financeChargeDiscountPercentage: 5
 *                 funding: MerchantFunded
 *                 budget: 8000
 *                 startDate: "2026-10-10"
 *                 endDate: "2026-10-25"
 *                 confirm: true
 *             invoiceChannelOnly:
 *               summary: Purchase % off — PaymentLinkInvoice only
 *               value:
 *                 merchantId: merchant-uuid-1
 *                 initiatedBy: Merchant
 *                 name: Invoice Channel Promo
 *                 eligibility: AllCustomers
 *                 channels: [PaymentLinkInvoice]
 *                 financingProducts: [PayIn6]
 *                 promoType: PurchaseDiscount
 *                 purchaseDiscountType: PercentageOff
 *                 purchaseDiscountPercentage: 8
 *                 minPurchase: 50
 *                 productFinanceChargeDiscount: []
 *                 funding: MerchantFunded
 *                 startDate: "2026-10-01"
 *                 endDate: "2026-10-31"
 *                 confirm: true
 *             minimalPurchaseDiscount:
 *               summary: Minimal valid PurchaseDiscount payload
 *               value:
 *                 initiatedBy: Splitr
 *                 name: Minimal Purchase Promo
 *                 financingProducts: [PayIn4]
 *                 promoType: PurchaseDiscount
 *                 purchaseDiscountType: PercentageOff
 *                 purchaseDiscountPercentage: 5
 *                 funding: SplitrFunded
 *                 startDate: "2026-10-01"
 *                 endDate: "2026-10-31"
 *             minimalFinanceChargeDiscount:
 *               summary: Minimal valid FinanceChargeDiscount payload
 *               value:
 *                 initiatedBy: Splitr
 *                 name: Minimal Fee Promo
 *                 financingProducts: [PayIn4]
 *                 promoType: FinanceChargeDiscount
 *                 productFinanceChargeDiscount:
 *                   - product: PayIn4
 *                     financeChargeDiscountPercentage: 4
 *                 funding: SplitrFunded
 *                 startDate: "2026-10-01"
 *                 endDate: "2026-10-31"
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
 * /api/v1/campaigns/financing-options:
 *   get:
 *     summary: Campaign financing options with rates
 *     description: |
 *       Returns exactly three items:
 *       - PayIn4 → PAY_IN_4 rate
 *       - PayIn6 → PAY_IN_6 rate
 *       - MonthlyFlex → MONTHLY_FLEX_3 rate
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financing options with rates
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - product: PayIn4
 *                   name: Pay in 4
 *                   rate: 0
 *                 - product: PayIn6
 *                   name: Pay in 6
 *                   rate: 5
 *                 - product: MonthlyFlex
 *                   name: MonthlyFlex
 *                   rate: 12.99
 *       401:
 *         description: Unauthorized
 */
router.get("/financing-options", auth, controller.listFinancingOptions.bind(controller));

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
 * /api/v1/campaigns/generate-image:
 *   post:
 *     summary: Generate a campaign image with OpenAI and store it on S3
 *     description: |
 *       Uses campaign name and short description to generate a landscape hero image,
 *       uploads it to AWS S3 (or local fallback), and returns the public URL for imageUrl.
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *                 example: Back to School with Splitr
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: 0% APR Pay-in-4 on school essentials this month
 *     responses:
 *       200:
 *         description: Image generated and uploaded
 *       400:
 *         description: Validation or generation failure
 *       401:
 *         description: Unauthorized
 */
router.post("/generate-image", auth, controller.generateImage.bind(controller));

/**
 * @swagger
 * /api/v1/campaigns/validate-code:
 *   post:
 *     summary: Validate a campaign code for a purchase
 *     description: |
 *       Checks whether a campaign code can be applied given merchant, buyer, and purchase amount.
 *
 *       Fails when:
 *       - campaign code does not exist
 *       - campaign status is not Active
 *       - current date is outside startDate–endDate (inclusive, UTC calendar days)
 *       - purchaseAmount is below minPurchase (when set)
 *       - merchant is not the campaign owner and is not an approved merchantIds entry
 *       - buyer eligibility does not match (NewCustomer = no prior Paid invoice with merchant;
 *         ReturningCustomer = at least one prior Paid invoice with merchant)
 *
 *       Customer identity: provide `buyerId` when known. If `buyerId` is omitted, provide `email`.
 *       With email, returning/new is determined from `invoice.customerEmail` only — the email does
 *       not need to exist in the buyer table.
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [campaignCode, merchantId, purchaseAmount]
 *             properties:
 *               campaignCode:
 *                 type: string
 *                 example: CMP-2610-A1B2C3
 *               merchantId:
 *                 type: string
 *               purchaseAmount:
 *                 type: number
 *                 example: 350
 *               buyerId:
 *                 type: string
 *                 description: Preferred customer id. If omitted, email is required.
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Used when buyerId is omitted. Matched against invoice.customerEmail.
 *     responses:
 *       200:
 *         description: Validation result (valid true/false). Failed rules return success=false with reason.
 *       400:
 *         description: Missing or invalid input parameters
 *       401:
 *         description: Unauthorized
 */
router.post("/validate-code", auth, controller.validateCode.bind(controller));

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
 * /api/v1/campaigns/{id}/actions:
 *   post:
 *     summary: Campaign workflow action (approve, pause, cancel, resume, statusRemarks)
 *     description: |
 *       Single endpoint for campaign-level workflow actions (not merchant participation).
 *
 *       Actions:
 *       - `approve` — Admin/Splitr campaign-level approval (required for merchant-created
 *         MerchantAndSplitrFunded). Optional `approvedRemarks` or `remark`.
 *       - `pause` — Active → Paused. Remark required. Merchant: own MerchantFunded only;
 *         Admin/Splitr: any. Writes audit row.
 *       - `cancel` — Active/Paused → Cancel. Remark required. Same permissions as pause.
 *       - `resume` — Paused → Active when activation gates still pass. Optional remark
 *         (defaults to "Resumed").
 *       - `statusRemarks` — Returns pause/cancel/resume audit history for the campaign.
 *
 *       For merchant participation acceptance use `POST /campaigns/{id}/approve-merchant`.
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
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, pause, cancel, resume, statusRemarks]
 *               remark:
 *                 type: string
 *                 description: Required for pause/cancel. Optional for approve/resume.
 *               approvedRemarks:
 *                 type: string
 *                 nullable: true
 *                 description: Optional alias used for approve (falls back to remark).
 *           examples:
 *             approve:
 *               summary: Admin approve co-funded campaign
 *               value:
 *                 action: approve
 *                 approvedRemarks: Approved for Q4 co-funded launch
 *             pause:
 *               summary: Pause active campaign
 *               value:
 *                 action: pause
 *                 remark: Pausing due to inventory shortage
 *             cancel:
 *               summary: Cancel campaign
 *               value:
 *                 action: cancel
 *                 remark: Cancelled — budget exhausted
 *             resume:
 *               summary: Resume paused campaign
 *               value:
 *                 action: resume
 *                 remark: Inventory restored
 *             statusRemarks:
 *               summary: List audit remarks
 *               value:
 *                 action: statusRemarks
 *     responses:
 *       200:
 *         description: Action completed (campaign payload, or remark list for statusRemarks)
 *       400:
 *         description: Invalid action, transition, or missing remark
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Campaign not found
 */
router.post("/:id/actions", auth, controller.actions.bind(controller));

/**
 * @swagger
 * /api/v1/campaigns/{id}/approve-merchant:
 *   post:
 *     summary: Approve or reject a merchant's campaign participation
 *     description: >
 *       Updates the matching entry in merchantIds. Merchants can only approve their own
 *       merchantId. Admins must pass merchantId in the body.
 *       For Admin/Splitr-created MerchantAndSplitrFunded campaigns, one acceptance can unlock Active.
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
 *           examples:
 *             updateFinanceChargePairing:
 *               summary: Change financing products + matching fee discounts
 *               value:
 *                 financingProducts: [PayIn4, PayIn6]
 *                 promoType: FinanceChargeDiscount
 *                 productFinanceChargeDiscount:
 *                   - product: PayIn4
 *                     financeChargeDiscountPercentage: 5
 *                   - product: PayIn6
 *                     financeChargeDiscountPercentage: 7
 *             updatePurchaseDiscount:
 *               summary: Switch to purchase percentage off
 *               value:
 *                 promoType: PurchaseDiscount
 *                 purchaseDiscountType: PercentageOff
 *                 purchaseDiscountPercentage: 12
 *                 financingProducts: [PayIn4]
 *                 productFinanceChargeDiscount: []
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
