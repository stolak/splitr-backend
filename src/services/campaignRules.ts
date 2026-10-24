import {
  CampaignFunding,
  CampaignInitiatedBy,
  CampaignStatus,
} from "@prisma/client";

export type CampaignActor = {
  userId: string;
  userType?: string | null;
  role?: string | null;
  merchantId?: string | null;
};

export type MerchantAcceptance = {
  merchantId: string;
  approved: boolean;
};

export type ActivationSnapshot = {
  status: CampaignStatus;
  funding: CampaignFunding;
  initiatedBy: CampaignInitiatedBy;
  approved: boolean;
  confirm: boolean;
  startDate: Date;
  endDate: Date;
  merchantIds: MerchantAcceptance[];
  now?: Date;
};

export function isAdminActor(actor: CampaignActor): boolean {
  const userType = (actor.userType ?? "").toUpperCase();
  const role = actor.role ?? "";
  return userType === "ADMIN" || role === "SuperAdmin" || role === "Admin";
}

export function isMerchantActor(actor: CampaignActor): boolean {
  return (actor.userType ?? "").toUpperCase() === "MERCHANT";
}

export function allowedFundingForCreate(actor: CampaignActor): CampaignFunding[] {
  if (isAdminActor(actor)) {
    return [CampaignFunding.SplitrFunded, CampaignFunding.MerchantAndSplitrFunded];
  }
  if (isMerchantActor(actor)) {
    return [CampaignFunding.MerchantFunded, CampaignFunding.MerchantAndSplitrFunded];
  }
  return [];
}

export function assertCanCreateWithFunding(actor: CampaignActor, funding: CampaignFunding) {
  const allowed = allowedFundingForCreate(actor);
  if (!allowed.includes(funding)) {
    if (isMerchantActor(actor) && funding === CampaignFunding.SplitrFunded) {
      throw new Error("Merchants are not allowed to create SplitrFunded campaigns");
    }
    if (isAdminActor(actor) && funding === CampaignFunding.MerchantFunded) {
      throw new Error("Admin/Splitr are not allowed to create MerchantFunded campaigns");
    }
    throw new Error("Unauthorized to create a campaign with this funding type");
  }
}

export function assertCanChangeFunding(actor: CampaignActor, funding: CampaignFunding) {
  assertCanCreateWithFunding(actor, funding);
}

export function canMerchantPauseOrCancel(
  actor: CampaignActor,
  campaign: { funding: CampaignFunding; merchantId?: string | null }
): boolean {
  if (!isMerchantActor(actor)) return false;
  if (campaign.funding !== CampaignFunding.MerchantFunded) return false;
  if (!actor.merchantId || !campaign.merchantId) return false;
  return actor.merchantId === campaign.merchantId;
}

export function canAdminPauseOrCancel(actor: CampaignActor): boolean {
  return isAdminActor(actor);
}

export function assertCanPauseOrCancel(
  actor: CampaignActor,
  campaign: { funding: CampaignFunding; merchantId?: string | null }
) {
  if (canAdminPauseOrCancel(actor)) return;
  if (canMerchantPauseOrCancel(actor, campaign)) return;
  throw new Error("Unauthorized to pause or cancel this campaign");
}

export function assertCanResume(actor: CampaignActor) {
  if (!isAdminActor(actor) && !isMerchantActor(actor)) {
    throw new Error("Unauthorized to resume this campaign");
  }
}

export function assertMerchantCanResumeOwn(
  actor: CampaignActor,
  campaign: { funding: CampaignFunding; merchantId?: string | null }
) {
  if (isAdminActor(actor)) return;
  if (!canMerchantPauseOrCancel(actor, campaign)) {
    throw new Error("Unauthorized to resume this campaign");
  }
}

/** Initial campaign.approved flag after create (Admin campaign-level approval). */
export function initialApprovedFlag(
  funding: CampaignFunding,
  initiatedBy: CampaignInitiatedBy
): boolean {
  if (funding === CampaignFunding.MerchantFunded) return true;
  if (funding === CampaignFunding.SplitrFunded) return true;
  if (funding === CampaignFunding.MerchantAndSplitrFunded) {
    // Admin/Splitr-created co-funded: campaign itself is approved; still needs merchant acceptance.
    // Merchant-created co-funded: requires explicit Admin/Splitr approval later.
    return initiatedBy === CampaignInitiatedBy.Splitr;
  }
  return false;
}

export function hasEligibleMerchantAcceptance(merchantIds: MerchantAcceptance[]): boolean {
  return merchantIds.some((entry) => entry.approved === true);
}

/**
 * Whether funding/approval/acceptance gates are satisfied for activation.
 * Does not check status transition legality.
 */
export function fundingActivationGatesMet(snapshot: ActivationSnapshot): {
  ok: boolean;
  reason?: string;
} {
  const { funding, initiatedBy, approved, merchantIds } = snapshot;

  if (funding === CampaignFunding.MerchantFunded) {
    return { ok: true };
  }

  if (funding === CampaignFunding.SplitrFunded) {
    // Preserve existing: no extra merchant acceptance; campaign approved at create for admin.
    return approved
      ? { ok: true }
      : { ok: false, reason: "SplitrFunded campaign requires Admin/Splitr approval" };
  }

  if (funding === CampaignFunding.MerchantAndSplitrFunded) {
    if (initiatedBy === CampaignInitiatedBy.Merchant) {
      if (!approved) {
        return {
          ok: false,
          reason:
            "Merchant-created MerchantAndSplitrFunded campaign requires Admin/Splitr approval before activation",
        };
      }
      return { ok: true };
    }

    // Admin/Splitr-created: at least one participating merchant must accept
    if (!hasEligibleMerchantAcceptance(merchantIds)) {
      return {
        ok: false,
        reason:
          "Admin/Splitr-created MerchantAndSplitrFunded campaign requires at least one merchant acceptance before activation",
      };
    }
    return { ok: true };
  }

  return { ok: false, reason: "Unknown funding type" };
}

export function commonActivationRequirementsMet(snapshot: ActivationSnapshot): {
  ok: boolean;
  reason?: string;
} {
  if (!snapshot.confirm) {
    return { ok: false, reason: "Campaign must be confirmed before activation" };
  }
  const now = snapshot.now ?? new Date();
  if (snapshot.endDate.getTime() < now.getTime()) {
    return { ok: false, reason: "Campaign endDate has passed" };
  }
  return { ok: true };
}

export function canActivateCampaign(snapshot: ActivationSnapshot): {
  ok: boolean;
  reason?: string;
} {
  if (
    snapshot.status !== CampaignStatus.Pending &&
    snapshot.status !== CampaignStatus.Paused
  ) {
    return { ok: false, reason: `Cannot activate from status ${snapshot.status}` };
  }

  const common = commonActivationRequirementsMet(snapshot);
  if (!common.ok) return common;

  return fundingActivationGatesMet(snapshot);
}

export function assertValidPauseTransition(status: CampaignStatus) {
  if (status !== CampaignStatus.Active) {
    throw new Error(`Cannot pause campaign from status ${status}`);
  }
}

export function assertValidCancelTransition(status: CampaignStatus) {
  if (status !== CampaignStatus.Active && status !== CampaignStatus.Paused) {
    throw new Error(`Cannot cancel campaign from status ${status}`);
  }
}

export function assertValidResumeTransition(status: CampaignStatus) {
  if (status !== CampaignStatus.Paused) {
    throw new Error(`Cannot resume campaign from status ${status}`);
  }
}

export function requireRemark(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("remark is required");
  }
  return value.trim();
}

/** Normalize Cancelled → Cancel for API inputs. */
export function normalizeCampaignStatus(value: string): CampaignStatus | null {
  const raw = value.trim();
  if (raw === "Cancelled" || raw === "Cancel") return CampaignStatus.Cancel;
  if ((Object.values(CampaignStatus) as string[]).includes(raw)) {
    return raw as CampaignStatus;
  }
  return null;
}
