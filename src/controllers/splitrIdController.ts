import { Request, Response } from "express";
import { splitrIdService } from "../services/splitrIdService";

/**
 * @openapi
 * /api/v1/splitr-id/generate:
 *   post:
 *     summary: Generate a new splitr ID
 *     tags: [splitr ID]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prefix
 *             properties:
 *               prefix:
 *                 type: string
 *                 description: Prefix for the ID (e.g., LPM, LPB, LPL, LPP)
 *                 example: "LPM"
 *                 minLength: 1
 *                 maxLength: 10
 *     responses:
 *       200:
 *         description: splitr ID generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     splitrId:
 *                       type: string
 *                       description: Generated splitr ID
 *                       example: "LPM-2510-100001"
 *       400:
 *         description: Invalid prefix or generation failed
 *       500:
 *         description: Server error
 */
export const splitrIdController = {
  generatesplitrId: async (req: Request, res: Response) => {
    try {
      const { prefix } = req.body;

      if (!prefix) {
        return res.status(400).json({
          success: false,
          message: "Prefix is required",
        });
      }

      const result = await splitrIdService.generatesplitrId(prefix);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error || "Failed to generate splitr ID",
        });
      }

      res.json({
        success: true,
        message: "splitr ID generated successfully",
        data: {
          splitrId: result.splitrId,
        },
      });
    } catch (error: any) {
      console.error("Error in generatesplitrId:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/splitr-id/validate:
   *   post:
   *     summary: Validate a splitr ID format
   *     tags: [splitr ID]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - splitrId
   *             properties:
   *               splitrId:
   *                 type: string
   *                 description: splitr ID to validate
   *                 example: "LPM-2510-100001"
   *     responses:
   *       200:
   *         description: Validation result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     isValid:
   *                       type: boolean
   *                     parsed:
   *                       type: object
   *                       properties:
   *                         prefix:
   *                           type: string
   *                         yearMonth:
   *                           type: string
   *                         sequence:
   *                           type: number
   *       400:
   *         description: Invalid request
   *       500:
   *         description: Server error
   */
  validatesplitrId: async (req: Request, res: Response) => {
    try {
      const { splitrId } = req.body;

      if (!splitrId) {
        return res.status(400).json({
          success: false,
          message: "splitr ID is required",
        });
      }

      const isValid = splitrIdService.validatesplitrId(splitrId);
      const parsed = isValid
        ? splitrIdService.parsesplitrId(splitrId)
        : null;

      res.json({
        success: true,
        message: isValid ? "splitr ID is valid" : "splitr ID is invalid",
        data: {
          isValid,
          parsed,
        },
      });
    } catch (error: any) {
      console.error("Error in validatesplitrId:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/splitr-id/sequences/{prefix}:
   *   get:
   *     summary: Get sequences for a specific prefix
   *     tags: [splitr ID]
   *     parameters:
   *       - in: path
   *         name: prefix
   *         required: true
   *         schema:
   *           type: string
   *         description: Prefix to query sequences for
   *         example: "LPM"
   *     responses:
   *       200:
   *         description: Sequences retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     prefix:
   *                       type: string
   *                     sequences:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           yearMonth:
   *                             type: string
   *                           seq:
   *                             type: number
   *       400:
   *         description: Invalid prefix
   *       500:
   *         description: Server error
   */
  getSequencesForPrefix: async (req: Request, res: Response) => {
    try {
      const { prefix } = req.params;

      if (!prefix) {
        return res.status(400).json({
          success: false,
          message: "Prefix is required",
        });
      }

      const sequences = await splitrIdService.getSequencesForPrefix(prefix);

      res.json({
        success: true,
        message: "Sequences retrieved successfully",
        data: {
          prefix,
          sequences,
        },
      });
    } catch (error: any) {
      console.error("Error in getSequencesForPrefix:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/splitr-id/statistics:
   *   get:
   *     summary: Get splitr ID generation statistics
   *     tags: [splitr ID]
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalPrefixes:
   *                       type: number
   *                     totalSequences:
   *                       type: number
   *                     prefixes:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           prefix:
   *                             type: string
   *                           count:
   *                             type: number
   *       500:
   *         description: Server error
   */
  getStatistics: async (req: Request, res: Response) => {
    try {
      const statistics = await splitrIdService.getStatistics();

      res.json({
        success: true,
        message: "Statistics retrieved successfully",
        data: statistics,
      });
    } catch (error: any) {
      console.error("Error in getStatistics:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/splitr-id/health:
   *   get:
   *     summary: Check splitr ID service health
   *     tags: [splitr ID]
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  health: async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        message: "splitr ID service is running",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error in splitr ID health check:", error);
      res.status(500).json({
        success: false,
        message: "Service unavailable",
        error: error.message,
      });
    }
  },
};
