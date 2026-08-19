import { Request, Response } from "express";
import { flinksService } from "../services/flinksService";

/**
 * @openapi
 * /api/v1/flinks/authorize-token:
 *   post:
 *     summary: Generate a Flinks authorize token
 *     description: Calls Flinks BankingServices/GenerateAuthorizeToken for the configured customer.
 *     tags: [Flinks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authorize token generated
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation or Flinks error
 */
export async function generateAuthorizeToken(req: Request, res: Response) {
  try {
    const result = await flinksService.generateAuthorizeToken();
    return res.status(200).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to generate Flinks authorize token";
    return res.status(400).json({ message });
  }
}
