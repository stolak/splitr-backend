import { scoringInputSnapshotService } from './scoringInputSnapshotService';
import { loanSettingService, type LiveDataNew } from './loanSettingService';
import { ScoringService } from './scoringService';
import prisma from '../utils/prisma';

const scoringService = new ScoringService();

export interface EvaluateScoringSnapshotsInput {
  buyerId?: string;
  months: number;
  purchaseAmount: number;
  downPaymentAmount: number;
  isLive?: boolean;
}

export class ScoringInputSnapshotEvaluationService {
  async evaluateSnapshots(input: EvaluateScoringSnapshotsInput) {
    const { buyerId, months, purchaseAmount, downPaymentAmount, isLive } = input;

    const snapshotsResult = await scoringInputSnapshotService.list(buyerId);
    const snapshots = snapshotsResult.data ?? [];

    const buyerIds = Array.from(
      new Set(snapshots.map((s) => s.buyerId).filter((id): id is string => typeof id === 'string')),
    );
    const buyers = buyerIds.length
      ? await prisma.buyer.findMany({
          where: { id: { in: buyerIds } },
          select: { id: true, firstName: true, lastName: true, liftpayId: true },
        })
      : [];
    const buyerById = new Map(buyers.map((b) => [b.id, b]));

    const results = await Promise.all(
      snapshots.map(async (snapshot) => {
        const buyer = snapshot.buyerId ? buyerById.get(snapshot.buyerId) : undefined;
        const buyerName = buyer
          ? [buyer.firstName, buyer.lastName].filter(Boolean).join(' ')
          : null;
        const liftpayId = buyer?.liftpayId ?? null;

        try {
          const scoringResult = await scoringService.scoring(snapshot.scoringInput);

          const liveDataNew: LiveDataNew = {
            ...snapshot.scoringInput,
            months,
            purchaseAmount,
            downPaymentAmount,
            isLive,
          };

          const loanSettingResult = await loanSettingService.eligibilityAndScoreNew(liveDataNew);

          return {
            success: true as const,
            snapshot: {
              id: snapshot.id,
              buyerId: snapshot.buyerId,
              buyerName,
              liftpayId,
              createdAt: snapshot.createdAt,
              updatedAt: snapshot.updatedAt,
              scoringInput: snapshot.scoringInput,
            },
            scoring: scoringResult,
            loanSetting: loanSettingResult,
          };
        } catch (error: any) {
          return {
            success: false as const,
            snapshot: {
              id: snapshot.id,
              buyerId: snapshot.buyerId,
              buyerName,
              liftpayId,
              createdAt: snapshot.createdAt,
              updatedAt: snapshot.updatedAt,
              scoringInput: snapshot.scoringInput,
            },
            error: error?.message || 'Failed to evaluate snapshot',
          };
        }
      }),
    );

    return {
      success: true,
      message: 'Scoring input snapshots evaluated successfully',
      data: results,
    };
  }
}

export const scoringInputSnapshotEvaluationService = new ScoringInputSnapshotEvaluationService();
