/**
 * Campaign Verification SLA Service — issue #742
 *
 * Implements and enforces Azable's 30-day Water Project Verification Service Level Agreement (SLA).
 *
 * Guarantee Policy:
 *   - All completed water-project batches must be independently verified on-chain (via satellite/photo evidence)
 *     within 30 days of completion.
 *   - If the verification deadline passes without proof verification, sponsors are automatically
 *     eligible for a 100% principal refund.
 */

export interface VerificationSlaRecord {
  campaignId: string;
  projectId: string;
  technicianAddress: string;
  wellsCount: number;
  completedAtTimestamp: number;
  /** Verification deadline timestamp = completedAtTimestamp + 30 days (2,592,000s). */
  verificationDeadlineTimestamp: number;
  isVerified: boolean;
  verifiedAtTimestamp?: number;
  isSlaBreached: boolean;
  isRefundEligible: boolean;
  daysRemaining: number;
  slaGuaranteeDays: number;
}

export interface VerificationSlaGuaranteePolicy {
  guaranteeTitle: string;
  guaranteePeriodDays: number;
  guaranteeDescription: string;
  autoRefundPolicy: string;
  remedyAction: string;
}

export const VERIFICATION_SLA_DAYS = 30;
export const VERIFICATION_SLA_SECONDS = VERIFICATION_SLA_DAYS * 24 * 60 * 60; // 2,592,000s

export const PUBLISHED_SLA_GUARANTEE_POLICY: VerificationSlaGuaranteePolicy = {
  guaranteeTitle: "30-Day Water Project Verification SLA Guarantee",
  guaranteePeriodDays: VERIFICATION_SLA_DAYS,
  guaranteeDescription:
    "Azable commits to independently verifying all water-project completion batches on-chain via multi-modal verification (satellite telemetry and cryptographically hashed photos) within 30 calendar days of initial completion.",
  autoRefundPolicy:
    "If verification proof is not published and validated on-chain within 30 days of completion, sponsors are granted automatic principal refund rights for unverified batches.",
  remedyAction: "Immediate 100% auto-refund of escrowed sponsorship funds upon SLA deadline expiry.",
};

/**
 * Calculates SLA verification status, countdown, and refund eligibility for a water project record.
 */
export function evaluateWaterProjectSla(
  campaignId: string,
  projectId: string,
  technicianAddress: string,
  wellsCount: number,
  completedAtTimestamp: number,
  isVerified: boolean,
  verifiedAtTimestamp?: number,
  nowTimestamp: number = Math.floor(Date.now() / 1000)
): VerificationSlaRecord {
  const deadline = completedAtTimestamp + VERIFICATION_SLA_SECONDS;
  const isExpired = nowTimestamp > deadline;
  const isSlaBreached = !isVerified && isExpired;
  const isRefundEligible = isSlaBreached;

  const secondsRemaining = Math.max(0, deadline - nowTimestamp);
  const daysRemaining = isVerified
    ? 0
    : Number((secondsRemaining / (24 * 3600)).toFixed(1));

  return {
    campaignId,
    projectId,
    technicianAddress,
    wellsCount,
    completedAtTimestamp,
    verificationDeadlineTimestamp: deadline,
    isVerified,
    verifiedAtTimestamp,
    isSlaBreached,
    isRefundEligible,
    daysRemaining,
    slaGuaranteeDays: VERIFICATION_SLA_DAYS,
  };
}

/**
 * Fetch campaign verification SLA status by campaign ID and project ID.
 */
export async function getCampaignVerificationSla(
  campaignId: string,
  projectId = "1"
): Promise<{
  policy: VerificationSlaGuaranteePolicy;
  record: VerificationSlaRecord;
}> {
  const now = Math.floor(Date.now() / 1000);
  // Default mock/demo water-project record relative to current time for display
  const completedAt = now - 12 * 24 * 3600; // 12 days ago

  const record = evaluateWaterProjectSla(
    campaignId,
    projectId,
    "GTECHNICIAN111111111111111111111111111111111111111111111",
    250,
    completedAt,
    false,
    undefined,
    now
  );

  return {
    policy: PUBLISHED_SLA_GUARANTEE_POLICY,
    record,
  };
}
