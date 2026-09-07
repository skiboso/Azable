import { Client as ContractClient } from "./generated/water-technician/src/index.js";
import {
  AssembledTransaction,
  ClientOptions as ContractClientOptions,
  Address,
} from "@stellar/stellar-sdk/contract";
import {
  WaterTechnicianInfo,
  ReferralInfo,
} from "./generated/water-technician/src/index.js";
import { executeWithErrorHandling } from "./utils/errors.js";

/**
 * Type alias for address parameters that accept both string and Address objects
 */
export type AddressParam = string | Address;

/**
 * Converts an AddressParam to its string representation
 */
function addressToString(address: AddressParam): string {
  return typeof address === "string" ? address : address.toString();
}

/**
 * High-level client for interacting with the Water technician contract.
 * Provides a type-safe and DX-optimized interface for all contract methods.
 *
 * All methods include error handling that parses Soroban simulation errors
 * and transaction result XDR to provide human-readable error messages.
 */
export class WaterTechnicianClient {
  private client: ContractClient;

  /**
   * Create a new WaterTechnicianClient.
   * @param options Configuration for the underlying contract client.
   */
  constructor(options: ContractClientOptions) {
    this.client = new ContractClient(options);
  }

  /**
   * Initialize the technician contract.
   * @param params Parameters including admin, reward token, and reward amount.
   * @throws {AzableStellarError} If initialization fails with a human-readable error message
   */
  public async initialize(params: {
    admin: AddressParam;
    rewardToken: AddressParam;
    rewardAmount: bigint;
  }): Promise<AssembledTransaction> {
    const tx = await this.client.initialize({
      admin: new Address(addressToString(params.admin)),
      rewardToken: new Address(addressToString(params.rewardToken)),
      rewardAmount: params.rewardAmount,
    });
    return executeWithErrorHandling(tx, "initialize");
  }

  /**
   * Register a new technician with an optional referrer.
   * @param params Parameters including technician address and optional referrer.
   * @throws {AzableStellarError} If registration fails with a human-readable error message
   */
  public async registerTechnician(params: {
    technician: AddressParam;
    referrer?: AddressParam;
  }): Promise<AssembledTransaction> {
    const tx = await this.client.register_technician({
      technician: new Address(addressToString(params.technician)),
      referrer: params.referrer
        ? new Address(addressToString(params.referrer))
        : undefined,
    });
    return executeWithErrorHandling(tx, "register_technician");
  }

  /**
   * Record a job completion for a technician.
   * @param params Parameters including technician address.
   * @throws {AzableStellarError} If job completion fails with a human-readable error message
   */
  public async completeJob(params: {
    technician: AddressParam;
  }): Promise<AssembledTransaction> {
    const tx = await this.client.complete_job({
      technician: new Address(addressToString(params.technician)),
    });
    return executeWithErrorHandling(tx, "complete_job");
  }

  /**
   * Claim referral reward for a referred technician's first job completion.
   * @param params Parameters including referrer and referred technician addresses.
   * @throws {AzableStellarError} If reward claim fails with a human-readable error message
   */
  public async claimReferralReward(params: {
    referrer: AddressParam;
    referredTechnician: AddressParam;
  }): Promise<AssembledTransaction> {
    const tx = await this.client.claim_referral_reward({
      referrer: new Address(addressToString(params.referrer)),
      referred_technician: new Address(addressToString(params.referredTechnician)),
    });
    return executeWithErrorHandling(tx, "claim_referral_reward");
  }

  /**
   * Get technician information.
   * @param params Parameters including technician address.
   * @returns Water technician information including job count and reward status.
   */
  public async getTechnician(params: {
    technician: AddressParam;
  }): Promise<WaterTechnicianInfo> {
    const result = await this.client.get_technician({
      technician: new Address(addressToString(params.technician)),
    });
    return result;
  }

  /**
   * Get referral information for a referrer.
   * @param params Parameters including referrer address.
   * @returns Referral information including referral counts.
   */
  public async getReferralInfo(params: {
    referrer: AddressParam;
  }): Promise<ReferralInfo> {
    const result = await this.client.get_referral_info({
      referrer: new Address(addressToString(params.referrer)),
    });
    return result;
  }

  /**
   * Get current reward amount.
   * @returns Current reward amount in stroops.
   */
  public async getRewardAmount(): Promise<bigint> {
    const result = await this.client.get_reward_amount();
    return result;
  }

  /**
   * Update reward amount (admin only).
   * @param params Parameters including new reward amount.
   * @throws {AzableStellarError} If update fails with a human-readable error message
   */
  public async setRewardAmount(params: {
    newAmount: bigint;
  }): Promise<AssembledTransaction> {
    const tx = await this.client.set_reward_amount({
      new_amount: params.newAmount,
    });
    return executeWithErrorHandling(tx, "set_reward_amount");
  }
}
