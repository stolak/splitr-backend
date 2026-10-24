import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CampaignFunding,
  CampaignInitiatedBy,
  CampaignStatus,
} from "@prisma/client";
import {
  allowedFundingForCreate,
  assertCanCreateWithFunding,
  assertCanPauseOrCancel,
  canActivateCampaign,
  canMerchantPauseOrCancel,
  hasEligibleMerchantAcceptance,
  initialApprovedFlag,
  isAdminActor,
  requireRemark,
} from "./campaignRules";

const merchant = {
  userId: "u-m1",
  userType: "Merchant",
  role: "Merchant",
  merchantId: "m1",
};

const otherMerchant = {
  userId: "u-m2",
  userType: "Merchant",
  role: "Merchant",
  merchantId: "m2",
};

const admin = {
  userId: "u-a1",
  userType: "Admin",
  role: "SuperAdmin",
  merchantId: null,
};

const futureEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const pastStart = new Date(Date.now() - 24 * 60 * 60 * 1000);

describe("campaign create funding permissions", () => {
  it("1. Merchants can create MerchantFunded", () => {
    assert.doesNotThrow(() =>
      assertCanCreateWithFunding(merchant, CampaignFunding.MerchantFunded)
    );
  });

  it("2. Merchants cannot create SplitrFunded", () => {
    assert.throws(
      () => assertCanCreateWithFunding(merchant, CampaignFunding.SplitrFunded),
      /not allowed to create SplitrFunded/
    );
  });

  it("3. Merchants can create MerchantAndSplitrFunded", () => {
    assert.doesNotThrow(() =>
      assertCanCreateWithFunding(merchant, CampaignFunding.MerchantAndSplitrFunded)
    );
  });

  it("4. Admin can create SplitrFunded", () => {
    assert.doesNotThrow(() =>
      assertCanCreateWithFunding(admin, CampaignFunding.SplitrFunded)
    );
  });

  it("5. Admin cannot create MerchantFunded", () => {
    assert.throws(
      () => assertCanCreateWithFunding(admin, CampaignFunding.MerchantFunded),
      /not allowed to create MerchantFunded/
    );
  });

  it("6. Admin can create MerchantAndSplitrFunded", () => {
    assert.doesNotThrow(() =>
      assertCanCreateWithFunding(admin, CampaignFunding.MerchantAndSplitrFunded)
    );
  });

  it("allowed funding lists match matrix", () => {
    assert.deepEqual(allowedFundingForCreate(merchant), [
      CampaignFunding.MerchantFunded,
      CampaignFunding.MerchantAndSplitrFunded,
    ]);
    assert.deepEqual(allowedFundingForCreate(admin), [
      CampaignFunding.SplitrFunded,
      CampaignFunding.MerchantAndSplitrFunded,
    ]);
  });
});

describe("visibility helpers", () => {
  it("7-8. Admin actor is recognized for unrestricted listing", () => {
    assert.equal(isAdminActor(admin), true);
    assert.equal(isAdminActor(merchant), false);
  });
});

describe("activation rules", () => {
  it("9. Merchant-created co-funded stays blocked without admin approval", () => {
    const result = canActivateCampaign({
      status: CampaignStatus.Pending,
      funding: CampaignFunding.MerchantAndSplitrFunded,
      initiatedBy: CampaignInitiatedBy.Merchant,
      approved: false,
      confirm: true,
      startDate: pastStart,
      endDate: futureEnd,
      merchantIds: [{ merchantId: "m1", approved: true }],
    });
    assert.equal(result.ok, false);
    assert.match(result.reason ?? "", /Admin\/Splitr approval/);
  });

  it("10. Merchant acceptance alone cannot activate merchant-created co-funded", () => {
    const result = canActivateCampaign({
      status: CampaignStatus.Pending,
      funding: CampaignFunding.MerchantAndSplitrFunded,
      initiatedBy: CampaignInitiatedBy.Merchant,
      approved: false,
      confirm: true,
      startDate: pastStart,
      endDate: futureEnd,
      merchantIds: [{ merchantId: "m1", approved: true }],
    });
    assert.equal(result.ok, false);
  });

  it("11. Admin-created co-funded stays Pending without merchant acceptance", () => {
    const result = canActivateCampaign({
      status: CampaignStatus.Pending,
      funding: CampaignFunding.MerchantAndSplitrFunded,
      initiatedBy: CampaignInitiatedBy.Splitr,
      approved: true,
      confirm: true,
      startDate: pastStart,
      endDate: futureEnd,
      merchantIds: [{ merchantId: "m1", approved: false }],
    });
    assert.equal(result.ok, false);
    assert.match(result.reason ?? "", /merchant acceptance/);
  });

  it("12. One merchant acceptance unlocks Admin-created co-funded when other gates met", () => {
    const result = canActivateCampaign({
      status: CampaignStatus.Pending,
      funding: CampaignFunding.MerchantAndSplitrFunded,
      initiatedBy: CampaignInitiatedBy.Splitr,
      approved: true,
      confirm: true,
      startDate: pastStart,
      endDate: futureEnd,
      merchantIds: [
        { merchantId: "m1", approved: false },
        { merchantId: "m2", approved: true },
      ],
    });
    assert.equal(result.ok, true);
    assert.equal(hasEligibleMerchantAcceptance([{ merchantId: "m2", approved: true }]), true);
  });

  it("13. MerchantFunded can activate without Admin approval", () => {
    const result = canActivateCampaign({
      status: CampaignStatus.Pending,
      funding: CampaignFunding.MerchantFunded,
      initiatedBy: CampaignInitiatedBy.Merchant,
      approved: true,
      confirm: true,
      startDate: pastStart,
      endDate: futureEnd,
      merchantIds: [],
    });
    assert.equal(result.ok, true);
  });

  it("14. SplitrFunded activates when approved + confirmed (existing workflow)", () => {
    const ok = canActivateCampaign({
      status: CampaignStatus.Pending,
      funding: CampaignFunding.SplitrFunded,
      initiatedBy: CampaignInitiatedBy.Splitr,
      approved: true,
      confirm: true,
      startDate: pastStart,
      endDate: futureEnd,
      merchantIds: [],
    });
    assert.equal(ok.ok, true);

    const blocked = canActivateCampaign({
      status: CampaignStatus.Pending,
      funding: CampaignFunding.SplitrFunded,
      initiatedBy: CampaignInitiatedBy.Splitr,
      approved: false,
      confirm: true,
      startDate: pastStart,
      endDate: futureEnd,
      merchantIds: [],
    });
    assert.equal(blocked.ok, false);
  });

  it("initialApprovedFlag matches funding/initiator rules", () => {
    assert.equal(
      initialApprovedFlag(CampaignFunding.MerchantFunded, CampaignInitiatedBy.Merchant),
      true
    );
    assert.equal(
      initialApprovedFlag(
        CampaignFunding.MerchantAndSplitrFunded,
        CampaignInitiatedBy.Merchant
      ),
      false
    );
    assert.equal(
      initialApprovedFlag(
        CampaignFunding.MerchantAndSplitrFunded,
        CampaignInitiatedBy.Splitr
      ),
      true
    );
    assert.equal(
      initialApprovedFlag(CampaignFunding.SplitrFunded, CampaignInitiatedBy.Splitr),
      true
    );
  });
});

describe("pause / cancel permissions", () => {
  it("15-16. Merchant can pause/cancel own MerchantFunded", () => {
    assert.equal(
      canMerchantPauseOrCancel(merchant, {
        funding: CampaignFunding.MerchantFunded,
        merchantId: "m1",
      }),
      true
    );
    assert.doesNotThrow(() =>
      assertCanPauseOrCancel(merchant, {
        funding: CampaignFunding.MerchantFunded,
        merchantId: "m1",
      })
    );
  });

  it("17. Merchant cannot pause/cancel another merchant's campaign", () => {
    assert.equal(
      canMerchantPauseOrCancel(otherMerchant, {
        funding: CampaignFunding.MerchantFunded,
        merchantId: "m1",
      }),
      false
    );
    assert.throws(
      () =>
        assertCanPauseOrCancel(otherMerchant, {
          funding: CampaignFunding.MerchantFunded,
          merchantId: "m1",
        }),
      /Unauthorized/
    );
  });

  it("18. Merchant cannot pause/cancel SplitrFunded", () => {
    assert.throws(
      () =>
        assertCanPauseOrCancel(merchant, {
          funding: CampaignFunding.SplitrFunded,
          merchantId: "m1",
        }),
      /Unauthorized/
    );
  });

  it("19. Merchant cannot pause/cancel MerchantAndSplitrFunded", () => {
    assert.throws(
      () =>
        assertCanPauseOrCancel(merchant, {
          funding: CampaignFunding.MerchantAndSplitrFunded,
          merchantId: "m1",
        }),
      /Unauthorized/
    );
  });

  it("20-21. Admin can pause/cancel any funding including merchant-created MerchantFunded", () => {
    for (const funding of [
      CampaignFunding.MerchantFunded,
      CampaignFunding.SplitrFunded,
      CampaignFunding.MerchantAndSplitrFunded,
    ]) {
      assert.doesNotThrow(() =>
        assertCanPauseOrCancel(admin, { funding, merchantId: "m1" })
      );
    }
  });

  it("22. Pause/cancel without valid remark is rejected", () => {
    assert.throws(() => requireRemark(""), /remark is required/);
    assert.throws(() => requireRemark("   "), /remark is required/);
    assert.throws(() => requireRemark(null), /remark is required/);
    assert.equal(requireRemark(" Budget cut "), "Budget cut");
  });
});

describe("26. Existing helpers remain coherent", () => {
  it("rejected merchant does not count as acceptance", () => {
    assert.equal(
      hasEligibleMerchantAcceptance([
        { merchantId: "m1", approved: false },
        { merchantId: "m2", approved: false },
      ]),
      false
    );
  });

  it("merchant-created co-funded activates after admin approval", () => {
    const result = canActivateCampaign({
      status: CampaignStatus.Pending,
      funding: CampaignFunding.MerchantAndSplitrFunded,
      initiatedBy: CampaignInitiatedBy.Merchant,
      approved: true,
      confirm: true,
      startDate: pastStart,
      endDate: futureEnd,
      merchantIds: [],
    });
    assert.equal(result.ok, true);
  });
});
