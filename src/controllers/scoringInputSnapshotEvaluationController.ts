import { Request, Response } from 'express';
import { scoringInputSnapshotEvaluationService } from '../services/scoringInputSnapshotEvaluationService';

/**
 * @swagger
 * /api/v1/scoring-input-snapshot-evaluations:
 *   post:
 *     summary: Evaluate scoring input snapshots into loan eligibility responses
 *     description: |
 *       Fetches scoring input snapshots (optionally filtered by buyerId), computes scoring for each snapshot,
 *       then runs loan eligibility evaluation (`eligibilityAndScoreNew`) to produce possible loan responses per snapshot.
 *     tags: [ScoringInputSnapshotEvaluation]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EvaluateScoringSnapshotsRequest'
 *     responses:
 *       200:
 *         description: Evaluated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EvaluatedScoringSnapshotResult'
 *       400:
 *         description: Validation error
 *
 * components:
 *   schemas:
 *     EvaluateScoringSnapshotsRequest:
 *       type: object
 *       required:
 *         - months
 *         - purchaseAmount
 *         - downPaymentAmount
 *       properties:
 *         buyerId:
 *           type: string
 *           description: Optional buyerId filter for snapshots
 *         months:
 *           type: number
 *           example: 6
 *         purchaseAmount:
 *           type: number
 *           example: 250000
 *         downPaymentAmount:
 *           type: number
 *           example: 50000
 *         isLive:
 *           type: boolean
 *           description: Optional flag to bypass scoring and return fixed live eligibility
 *           example: false
 *     EvaluatedScoringSnapshotResult:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         snapshot:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             buyerId:
 *               type: string
 *               nullable: true
 *             buyerName:
 *               type: string
 *               nullable: true
 *             liftpayId:
 *               type: string
 *               nullable: true
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 *             scoringInput:
 *               $ref: '#/components/schemas/ScoringInput'
 *         scoring:
 *           type: object
 *           nullable: true
 *           description: Output of scoringService.scoring(...)
 *         loanSetting:
 *           type: object
 *           nullable: true
 *           description: Output of loanSettingService.eligibilityAndScoreNew(...)
 *         error:
 *           type: string
 *           nullable: true
 */
export class ScoringInputSnapshotEvaluationController {
  async evaluate(req: Request, res: Response) {
    try {
      const { buyerId, months, purchaseAmount, downPaymentAmount, isLive } = req.body ?? {};

      if (buyerId !== undefined && typeof buyerId !== 'string') {
        return res.status(400).json({ success: false, message: 'buyerId must be a string' });
      }
      if (typeof months !== 'number' || months <= 0) {
        return res
          .status(400)
          .json({ success: false, message: 'months is required and must be > 0' });
      }
      // if (typeof purchaseAmount !== "number" || purchaseAmount <= 0) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "purchaseAmount is required and must be > 0",
      //   });
      // }
      // if (typeof downPaymentAmount !== "number" || downPaymentAmount < 0) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "downPaymentAmount is required and must be >= 0",
      //   });
      // }
      if (isLive !== undefined && typeof isLive !== 'boolean') {
        return res.status(400).json({ success: false, message: 'isLive must be a boolean' });
      }

      const result = await scoringInputSnapshotEvaluationService.evaluateSnapshots({
        buyerId,
        months,
        purchaseAmount,
        downPaymentAmount,
        isLive,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error evaluating scoring input snapshots:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to evaluate scoring input snapshots',
      });
    }
  }
}

export const scoringInputSnapshotEvaluationController =
  new ScoringInputSnapshotEvaluationController();
