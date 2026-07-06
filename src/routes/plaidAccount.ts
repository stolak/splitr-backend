import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { plaidAccountController } from "../controllers/plaidAccountController";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PlaidAccount:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         buyerId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         expiration:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         itemId:
 *           type: string
 *           nullable: true
 *         requestId:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreatePlaidAccountInput:
 *       type: object
 *       properties:
 *         buyerId:
 *           type: string
 *           format: uuid
 *         linkToken:
 *           type: string
 *         expiration:
 *           type: string
 *           format: date-time
 *         publicToken:
 *           type: string
 *         itemId:
 *           type: string
 *         requestId:
 *           type: string
 *     UpdatePlaidAccountInput:
 *       type: object
 *       properties:
 *         buyerId:
 *           type: string
 *           format: uuid
 *         linkToken:
 *           type: string
 *         expiration:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         publicToken:
 *           type: string
 *         itemId:
 *           type: string
 *         requestId:
 *           type: string
 */

router.post("/", authenticateJWT, plaidAccountController.create.bind(plaidAccountController));
router.get("/", authenticateJWT, plaidAccountController.list.bind(plaidAccountController));
router.get(
  "/buyer/:buyerId",
  authenticateJWT,
  plaidAccountController.getByBuyerId.bind(plaidAccountController),
);
router.get(
  "/user/:userId",
  authenticateJWT,
  plaidAccountController.getByUserId.bind(plaidAccountController),
);
router.get("/:id", authenticateJWT, plaidAccountController.getById.bind(plaidAccountController));
router.patch("/:id", authenticateJWT, plaidAccountController.update.bind(plaidAccountController));
router.delete("/:id", authenticateJWT, plaidAccountController.delete.bind(plaidAccountController));

export default router;
