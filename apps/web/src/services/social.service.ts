import { WaterTechnicianClient, WaterTechnicianInfo, ReferralInfo } from "@azable/sdk";

/**
 * Service for interacting with the water technician referral system.
 */
export class SocialService {
  private technicianClient: WaterTechnicianClient | null = null;

  /**
   * Initialize the social service with the water technician contract client.
   * @param contractId The deployed water technician contract ID
   * @param networkPassphrase The network passphrase
   * @param rpcUrl The RPC URL for Soroban
   */
  initialize(
    contractId: string,
    networkPassphrase: string,
    rpcUrl: string
  ) {
    this.technicianClient = new WaterTechnicianClient({
      contractId,
      networkPassphrase,
      rpcUrl,
    });
  }

  /**
   * Register a new water technician with an optional referrer.
   * @param technicianAddress The technician's address
   * @param referrerAddress Optional referrer's address
   */
  async registerTechnician(
    technicianAddress: string,
    referrerAddress?: string
  ): Promise<void> {
    if (!this.technicianClient) {
      throw new Error("SocialService not initialized");
    }

    const tx = await this.technicianClient.registerTechnician({
      technician: technicianAddress,
      referrer: referrerAddress,
    });

    // Sign and send the transaction (implementation depends on wallet integration)
    // This is a placeholder - actual signing would be done by the wallet
    await tx.signAndSend();
  }

  /**
   * Record a job completion for a water technician.
   * @param technicianAddress The technician's address
   */
  async completeJob(technicianAddress: string): Promise<void> {
    if (!this.technicianClient) {
      throw new Error("SocialService not initialized");
    }

    const tx = await this.technicianClient.completeJob({
      technician: technicianAddress,
    });

    await tx.signAndSend();
  }

  /**
   * Claim referral reward for a referred water technician's first job completion.
   * @param referrerAddress The referrer's address
   * @param referredTechnicianAddress The referred technician's address
   */
  async claimReferralReward(
    referrerAddress: string,
    referredTechnicianAddress: string
  ): Promise<void> {
    if (!this.technicianClient) {
      throw new Error("SocialService not initialized");
    }

    const tx = await this.technicianClient.claimReferralReward({
      referrer: referrerAddress,
      referredTechnician: referredTechnicianAddress,
    });

    await tx.signAndSend();
  }

  /**
   * Get water technician information.
   * @param technicianAddress The technician's address
   * @returns Water technician information
   */
  async getTechnician(technicianAddress: string): Promise<WaterTechnicianInfo> {
    if (!this.technicianClient) {
      throw new Error("SocialService not initialized");
    }

    return await this.technicianClient.getTechnician({
      technician: technicianAddress,
    });
  }

  /**
   * Get referral information for a referrer.
   * @param referrerAddress The referrer's address
   * @returns Referral information
   */
  async getReferralInfo(referrerAddress: string): Promise<ReferralInfo> {
    if (!this.technicianClient) {
      throw new Error("SocialService not initialized");
    }

    return await this.technicianClient.getReferralInfo({
      referrer: referrerAddress,
    });
  }

  /**
   * Get current reward amount.
   * @returns Current reward amount in stroops
   */
  async getRewardAmount(): Promise<bigint> {
    if (!this.technicianClient) {
      throw new Error("SocialService not initialized");
    }

    return await this.technicianClient.getRewardAmount();
  }

  /**
   * Update reward amount (admin only).
   * @param newAmount New reward amount in stroops
   */
  async setRewardAmount(newAmount: bigint): Promise<void> {
    if (!this.technicianClient) {
      throw new Error("SocialService not initialized");
    }

    const tx = await this.technicianClient.setRewardAmount({
      newAmount,
    });

    await tx.signAndSend();
  }
}

// Export singleton instance
export const socialService = new SocialService();
export const REFERRAL_REWARD_STROOPS = 10_000_000n; // 1 XLM
export const MONTHLY_REFERRAL_CAP = 10;

export type TeamMember = {
  address: string;
  role: "owner" | "member";
  joinedAt: string;
};

export type SponsorTeam = {
  id: string;
  name: string;
  owner: string;
  members: TeamMember[];
  sponsoredWaterProjects: string[];
  totalImpact: number;
  createdAt: string;
};

export type ReferralReward = {
  referrer: string;
  referredSponsor: string;
  rewardStroops: string;
  month: string;
  createdAt: string;
};

export interface SocialStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const TEAMS_KEY = "azable:sponsor-teams";
const REWARDS_KEY = "azable:referral-rewards";

const browserStore: SocialStore = {
  getItem: (key) => (typeof window === "undefined" ? null : window.localStorage.getItem(key)),
  setItem: (key, value) => {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  },
};

function read<T>(store: SocialStore, key: string, fallback: T): T {
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(store: SocialStore, key: string, value: T): void {
  store.setItem(key, JSON.stringify(value));
}

function monthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function listSponsorTeams(store: SocialStore = browserStore): SponsorTeam[] {
  return read<SponsorTeam[]>(store, TEAMS_KEY, []);
}

export function createSponsorTeam(
  owner: string,
  name: string,
  store: SocialStore = browserStore,
  now = new Date(),
): SponsorTeam {
  const trimmedName = name.trim();
  if (!owner || !trimmedName) throw new Error("Team owner and name are required");
  const team: SponsorTeam = {
    id: `team_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    name: trimmedName,
    owner,
    members: [{ address: owner, role: "owner", joinedAt: now.toISOString() }],
    sponsoredWaterProjects: [],
    totalImpact: 0,
    createdAt: now.toISOString(),
  };
  write(store, TEAMS_KEY, [...listSponsorTeams(store), team]);
  return team;
}

export function inviteSponsorToTeam(
  teamId: string,
  owner: string,
  memberAddress: string,
  store: SocialStore = browserStore,
  now = new Date(),
): SponsorTeam {
  const teams = listSponsorTeams(store);
  const team = teams.find((candidate) => candidate.id === teamId);
  if (!team) throw new Error("Team not found");
  if (team.owner !== owner) throw new Error("Only the team owner can invite sponsors");
  if (!memberAddress || team.members.some((member) => member.address === memberAddress)) return team;
  team.members.push({ address: memberAddress, role: "member", joinedAt: now.toISOString() });
  write(store, TEAMS_KEY, teams);
  return team;
}

export function recordTeamWaterProjectSponsorship(
  teamId: string,
  sponsorAddress: string,
  projectId: string,
  impact = 1,
  store: SocialStore = browserStore,
): SponsorTeam {
  const teams = listSponsorTeams(store);
  const team = teams.find((candidate) => candidate.id === teamId);
  if (!team) throw new Error("Team not found");
  if (!team.members.some((member) => member.address === sponsorAddress)) throw new Error("Sponsor is not a team member");
  if (!projectId || team.sponsoredWaterProjects.includes(projectId)) return team;
  team.sponsoredWaterProjects.push(projectId);
  team.totalImpact += Math.max(0, impact);
  write(store, TEAMS_KEY, teams);
  return team;
}

export function listReferralRewards(store: SocialStore = browserStore): ReferralReward[] {
  return read<ReferralReward[]>(store, REWARDS_KEY, []);
}

/** Record the first completed water project for a referred sponsor, capped at 10 rewards/month. */
export function recordReferralCompletion(
  referrer: string,
  referredSponsor: string,
  completedProjectId: string,
  store: SocialStore = browserStore,
  now = new Date(),
): ReferralReward | null {
  if (!referrer || !referredSponsor || !completedProjectId || referrer === referredSponsor) return null;
  const month = monthKey(now);
  const rewards = listReferralRewards(store);
  if (rewards.some((reward) => reward.referredSponsor === referredSponsor)) return null;
  if (rewards.filter((reward) => reward.referrer === referrer && reward.month === month).length >= MONTHLY_REFERRAL_CAP) return null;
  const reward: ReferralReward = {
    referrer,
    referredSponsor,
    rewardStroops: REFERRAL_REWARD_STROOPS.toString(),
    month,
    createdAt: now.toISOString(),
  };
  write(store, REWARDS_KEY, [...rewards, reward]);
  return reward;
}
