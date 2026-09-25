import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { merchantPricingController } from "../controllers/merchantPricingController";

const fees = merchantPricingController;
const auth = authenticateJWT;

export const merchantFeesRateRoutes = Router();
export const merchantTierRoutes = Router();
export const tCutOffRoutes = Router();
export const rollingReserveRoutes = Router();
export const merchantInstantPayoutSettingsRoutes = Router();
export const merchantDefaultFeesRateRoutes = Router();

/**
 * @swagger
 * tags:
 *   - name: MerchantFeesRate
 *     description: Merchant-specific fees rates by product configuration
 *   - name: MerchantTier
 *     description: Merchant tiers, cut offs, rolling reserves, and instant payout settings
 *   - name: TCutOff
 *     description: Settlement cut offs for a merchant tier
 *   - name: RollingReserve
 *     description: Rolling reserve rates by merchant tier and product configuration
 *   - name: MerchantInstantPayoutSettings
 *     description: Instant payout settings for a merchant tier
 *   - name: MerchantDefaultFeesRate
 *     description: Default merchant fees rate for a product configuration
 */

/**
 * @swagger
 * /api/v1/merchant-fees-rates:
 *   get:
 *     summary: List merchant fees rates
 *     tags: [MerchantFeesRate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *       - in: query
 *         name: productConfigurationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Merchant fees rates retrieved successfully
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a merchant fees rate
 *     tags: [MerchantFeesRate]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [merchantId, productConfigurationId, rate]
 *             properties:
 *               merchantId:
 *                 type: string
 *               productConfigurationId:
 *                 type: string
 *               rate:
 *                 type: number
 *                 example: 2.5
 *     responses:
 *       201:
 *         description: Merchant fees rate created successfully
 *       400:
 *         description: Validation failed or duplicate rate
 *       404:
 *         description: Merchant or product configuration not found
 */
merchantFeesRateRoutes.get("/", auth, fees.listFeesRates.bind(fees));
merchantFeesRateRoutes.post("/", auth, fees.createFeesRate.bind(fees));

/**
 * @swagger
 * /api/v1/merchant-fees-rates/{id}:
 *   get:
 *     summary: Get a merchant fees rate by id
 *     tags: [MerchantFeesRate]
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
 *         description: Merchant fees rate retrieved successfully
 *       404:
 *         description: Merchant fees rate not found
 *   put:
 *     summary: Update a merchant fees rate
 *     tags: [MerchantFeesRate]
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
 *               productConfigurationId:
 *                 type: string
 *               rate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Merchant fees rate updated successfully
 *       400:
 *         description: Validation failed or duplicate rate
 *       404:
 *         description: Record not found
 *   patch:
 *     summary: Partially update a merchant fees rate
 *     tags: [MerchantFeesRate]
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
 *               productConfigurationId:
 *                 type: string
 *               rate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Merchant fees rate updated successfully
 *   delete:
 *     summary: Delete a merchant fees rate
 *     tags: [MerchantFeesRate]
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
 *         description: Merchant fees rate deleted successfully
 *       404:
 *         description: Merchant fees rate not found
 */
merchantFeesRateRoutes.get("/:id", auth, fees.getFeesRate.bind(fees));
merchantFeesRateRoutes.put("/:id", auth, fees.updateFeesRate.bind(fees));
merchantFeesRateRoutes.patch("/:id", auth, fees.updateFeesRate.bind(fees));
merchantFeesRateRoutes.delete("/:id", auth, fees.deleteFeesRate.bind(fees));

/**
 * @swagger
 * /api/v1/merchant-tiers:
 *   get:
 *     summary: List merchant tiers
 *     description: Each tier includes its cut off, rolling reserves, and instant payout settings.
 *     tags: [MerchantTier]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Merchant tiers retrieved successfully
 *   post:
 *     summary: Create a merchant tier
 *     tags: [MerchantTier]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [label]
 *             properties:
 *               label:
 *                 type: string
 *                 example: A
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: T+1 business day
 *     responses:
 *       201:
 *         description: Merchant tier created successfully
 *       400:
 *         description: Validation failed
 */
merchantTierRoutes.get("/", auth, fees.listTiers.bind(fees));
merchantTierRoutes.post("/", auth, fees.createTier.bind(fees));

/**
 * @swagger
 * /api/v1/merchant-tiers/{id}:
 *   get:
 *     summary: Get a merchant tier by id
 *     tags: [MerchantTier]
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
 *         description: Merchant tier retrieved successfully
 *       404:
 *         description: Merchant tier not found
 *   put:
 *     summary: Update a merchant tier
 *     tags: [MerchantTier]
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
 *               label:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Merchant tier updated successfully
 *       404:
 *         description: Merchant tier not found
 *   patch:
 *     summary: Partially update a merchant tier
 *     tags: [MerchantTier]
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
 *         description: Merchant tier updated successfully
 *   delete:
 *     summary: Delete a merchant tier
 *     description: Also deletes the tier's cut off, rolling reserves, and instant payout settings.
 *     tags: [MerchantTier]
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
 *         description: Merchant tier deleted successfully
 *       404:
 *         description: Merchant tier not found
 */
merchantTierRoutes.get("/:id", auth, fees.getTier.bind(fees));
merchantTierRoutes.put("/:id", auth, fees.updateTier.bind(fees));
merchantTierRoutes.patch("/:id", auth, fees.updateTier.bind(fees));
merchantTierRoutes.delete("/:id", auth, fees.deleteTier.bind(fees));

/**
 * @swagger
 * /api/v1/t-cut-offs:
 *   get:
 *     summary: List T cut offs
 *     tags: [TCutOff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantTierId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: T cut offs retrieved successfully
 *   post:
 *     summary: Create a T cut off
 *     description: One cut off is allowed per merchant tier.
 *     tags: [TCutOff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [merchantTierId, label, dayPlus, rollingMaturityDay]
 *             properties:
 *               merchantTierId:
 *                 type: string
 *               label:
 *                 type: string
 *                 example: T+1
 *               dayPlus:
 *                 type: integer
 *                 example: 1
 *               rollingMaturityDay:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       201:
 *         description: T cut off created successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Merchant tier not found
 */
tCutOffRoutes.get("/", auth, fees.listCutOffs.bind(fees));
tCutOffRoutes.post("/", auth, fees.createCutOff.bind(fees));

/**
 * @swagger
 * /api/v1/t-cut-offs/tier/{merchantTierId}:
 *   get:
 *     summary: Get the T cut off for a merchant tier
 *     tags: [TCutOff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantTierId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: T cut off retrieved successfully
 *       404:
 *         description: T cut off not found
 */
tCutOffRoutes.get("/tier/:merchantTierId", auth, fees.getCutOffByTier.bind(fees));

/**
 * @swagger
 * /api/v1/t-cut-offs/{id}:
 *   get:
 *     summary: Get a T cut off by id
 *     tags: [TCutOff]
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
 *         description: T cut off retrieved successfully
 *       404:
 *         description: T cut off not found
 *   put:
 *     summary: Update a T cut off
 *     tags: [TCutOff]
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
 *               merchantTierId:
 *                 type: string
 *               label:
 *                 type: string
 *               dayPlus:
 *                 type: integer
 *               rollingMaturityDay:
 *                 type: integer
 *     responses:
 *       200:
 *         description: T cut off updated successfully
 *       404:
 *         description: Record not found
 *   patch:
 *     summary: Partially update a T cut off
 *     tags: [TCutOff]
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
 *         description: T cut off updated successfully
 *   delete:
 *     summary: Delete a T cut off
 *     tags: [TCutOff]
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
 *         description: T cut off deleted successfully
 *       404:
 *         description: T cut off not found
 */
tCutOffRoutes.get("/:id", auth, fees.getCutOff.bind(fees));
tCutOffRoutes.put("/:id", auth, fees.updateCutOff.bind(fees));
tCutOffRoutes.patch("/:id", auth, fees.updateCutOff.bind(fees));
tCutOffRoutes.delete("/:id", auth, fees.deleteCutOff.bind(fees));

/**
 * @swagger
 * /api/v1/rolling-reserves:
 *   get:
 *     summary: List rolling reserves
 *     tags: [RollingReserve]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantTierId
 *         schema:
 *           type: string
 *       - in: query
 *         name: productConfigurationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rolling reserves retrieved successfully
 *   post:
 *     summary: Create a rolling reserve
 *     tags: [RollingReserve]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [merchantTierId, productConfigurationId, rate]
 *             properties:
 *               merchantTierId:
 *                 type: string
 *               productConfigurationId:
 *                 type: string
 *               rate:
 *                 type: number
 *                 example: 10
 *     responses:
 *       201:
 *         description: Rolling reserve created successfully
 *       400:
 *         description: Validation failed or duplicate reserve
 *       404:
 *         description: Merchant tier or product configuration not found
 */
rollingReserveRoutes.get("/", auth, fees.listReserves.bind(fees));
rollingReserveRoutes.post("/", auth, fees.createReserve.bind(fees));

/**
 * @swagger
 * /api/v1/rolling-reserves/{id}:
 *   get:
 *     summary: Get a rolling reserve by id
 *     tags: [RollingReserve]
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
 *         description: Rolling reserve retrieved successfully
 *       404:
 *         description: Rolling reserve not found
 *   put:
 *     summary: Update a rolling reserve
 *     tags: [RollingReserve]
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
 *               merchantTierId:
 *                 type: string
 *               productConfigurationId:
 *                 type: string
 *               rate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Rolling reserve updated successfully
 *       404:
 *         description: Record not found
 *   patch:
 *     summary: Partially update a rolling reserve
 *     tags: [RollingReserve]
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
 *         description: Rolling reserve updated successfully
 *   delete:
 *     summary: Delete a rolling reserve
 *     tags: [RollingReserve]
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
 *         description: Rolling reserve deleted successfully
 *       404:
 *         description: Rolling reserve not found
 */
rollingReserveRoutes.get("/:id", auth, fees.getReserve.bind(fees));
rollingReserveRoutes.put("/:id", auth, fees.updateReserve.bind(fees));
rollingReserveRoutes.patch("/:id", auth, fees.updateReserve.bind(fees));
rollingReserveRoutes.delete("/:id", auth, fees.deleteReserve.bind(fees));

/**
 * @swagger
 * /api/v1/merchant-instant-payout-settings:
 *   get:
 *     summary: List instant payout settings
 *     tags: [MerchantInstantPayoutSettings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantTierId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instant payout settings retrieved successfully
 *   post:
 *     summary: Create instant payout settings
 *     description: One settings row is allowed per merchant tier.
 *     tags: [MerchantInstantPayoutSettings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [merchantTierId, baseRate, surchargeRate, maxPayoutPercentage]
 *             properties:
 *               merchantTierId:
 *                 type: string
 *               baseRate:
 *                 type: number
 *                 example: 1.5
 *               surchargeRate:
 *                 type: number
 *                 example: 0.5
 *               maxPayoutPercentage:
 *                 type: number
 *                 example: 80
 *               isEnabled:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Instant payout settings created successfully
 *       400:
 *         description: Validation failed or settings already exist
 *       404:
 *         description: Merchant tier not found
 */
merchantInstantPayoutSettingsRoutes.get("/", auth, fees.listInstantSettings.bind(fees));
merchantInstantPayoutSettingsRoutes.post("/", auth, fees.createInstantSettings.bind(fees));

/**
 * @swagger
 * /api/v1/merchant-instant-payout-settings/tier/{merchantTierId}:
 *   get:
 *     summary: Get instant payout settings for a merchant tier
 *     tags: [MerchantInstantPayoutSettings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantTierId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instant payout settings retrieved successfully
 *       404:
 *         description: Instant payout settings not found
 */
merchantInstantPayoutSettingsRoutes.get(
  "/tier/:merchantTierId",
  auth,
  fees.getInstantSettingsByTier.bind(fees)
);

/**
 * @swagger
 * /api/v1/merchant-instant-payout-settings/{id}:
 *   get:
 *     summary: Get instant payout settings by id
 *     tags: [MerchantInstantPayoutSettings]
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
 *         description: Instant payout settings retrieved successfully
 *       404:
 *         description: Instant payout settings not found
 *   put:
 *     summary: Update instant payout settings
 *     tags: [MerchantInstantPayoutSettings]
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
 *               merchantTierId:
 *                 type: string
 *               baseRate:
 *                 type: number
 *               surchargeRate:
 *                 type: number
 *               maxPayoutPercentage:
 *                 type: number
 *               isEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Instant payout settings updated successfully
 *       404:
 *         description: Record not found
 *   patch:
 *     summary: Partially update instant payout settings
 *     tags: [MerchantInstantPayoutSettings]
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
 *         description: Instant payout settings updated successfully
 *   delete:
 *     summary: Delete instant payout settings
 *     tags: [MerchantInstantPayoutSettings]
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
 *         description: Instant payout settings deleted successfully
 *       404:
 *         description: Instant payout settings not found
 */
merchantInstantPayoutSettingsRoutes.get("/:id", auth, fees.getInstantSettings.bind(fees));
merchantInstantPayoutSettingsRoutes.put("/:id", auth, fees.updateInstantSettings.bind(fees));
merchantInstantPayoutSettingsRoutes.patch("/:id", auth, fees.updateInstantSettings.bind(fees));
merchantInstantPayoutSettingsRoutes.delete("/:id", auth, fees.deleteInstantSettings.bind(fees));

/**
 * @swagger
 * /api/v1/merchant-default-fees-rates:
 *   get:
 *     summary: List default merchant fees rates
 *     tags: [MerchantDefaultFeesRate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productConfigurationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default fees rates retrieved successfully
 *   post:
 *     summary: Create a default merchant fees rate
 *     description: One default rate is allowed per product configuration.
 *     tags: [MerchantDefaultFeesRate]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productConfigurationId, rate]
 *             properties:
 *               productConfigurationId:
 *                 type: string
 *               rate:
 *                 type: number
 *                 example: 2.5
 *     responses:
 *       201:
 *         description: Default fees rate created successfully
 *       400:
 *         description: Validation failed or duplicate rate
 *       404:
 *         description: Product configuration not found
 */
merchantDefaultFeesRateRoutes.get("/", auth, fees.listDefaultFeesRates.bind(fees));
merchantDefaultFeesRateRoutes.post("/", auth, fees.createDefaultFeesRate.bind(fees));

/**
 * @swagger
 * /api/v1/merchant-default-fees-rates/product-configuration/{productConfigurationId}:
 *   get:
 *     summary: Get the default fees rate for a product configuration
 *     tags: [MerchantDefaultFeesRate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productConfigurationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default fees rate retrieved successfully
 *       404:
 *         description: Default fees rate not found
 */
merchantDefaultFeesRateRoutes.get(
  "/product-configuration/:productConfigurationId",
  auth,
  fees.getDefaultFeesRateByProduct.bind(fees)
);

/**
 * @swagger
 * /api/v1/merchant-default-fees-rates/{id}:
 *   get:
 *     summary: Get a default fees rate by id
 *     tags: [MerchantDefaultFeesRate]
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
 *         description: Default fees rate retrieved successfully
 *       404:
 *         description: Default fees rate not found
 *   put:
 *     summary: Update a default fees rate
 *     tags: [MerchantDefaultFeesRate]
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
 *               productConfigurationId:
 *                 type: string
 *               rate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Default fees rate updated successfully
 *       404:
 *         description: Record not found
 *   patch:
 *     summary: Partially update a default fees rate
 *     tags: [MerchantDefaultFeesRate]
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
 *         description: Default fees rate updated successfully
 *   delete:
 *     summary: Delete a default fees rate
 *     tags: [MerchantDefaultFeesRate]
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
 *         description: Default fees rate deleted successfully
 *       404:
 *         description: Default fees rate not found
 */
merchantDefaultFeesRateRoutes.get("/:id", auth, fees.getDefaultFeesRate.bind(fees));
merchantDefaultFeesRateRoutes.put("/:id", auth, fees.updateDefaultFeesRate.bind(fees));
merchantDefaultFeesRateRoutes.patch("/:id", auth, fees.updateDefaultFeesRate.bind(fees));
merchantDefaultFeesRateRoutes.delete("/:id", auth, fees.deleteDefaultFeesRate.bind(fees));
