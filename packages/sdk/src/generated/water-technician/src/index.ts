/**
 * TEMPORARY LOCAL-ONLY STUB — not real generated bindings.
 *
 * `payment-stream` and `distributor` have real generated bindings (produced by
 * `stellar contract bindings typescript` against a built contract WASM — see
 * packages/sdk/scripts/regenerate-types-from-wasm.js). `water-technician`
 * never got this treatment: it isn't deployed anywhere
 * (deployments/testnet.json has "water_technician": null) and generating
 * real bindings needs stellar-cli, which isn't available in this environment.
 *
 * This file exists only so `apps/web` can resolve `@azable/sdk`'s import
 * graph and boot locally for a preview — every method is a stub that throws
 * if actually called. Delete this directory and run
 * `pnpm --filter @azable/sdk generate:wasm --contract water-technician` once
 * a real water-technician contract is built, or generate against a deployed
 * one with `generate:testnet`/`generate:mainnet`.
 */
import type { ClientOptions as ContractClientOptions } from "@stellar/stellar-sdk/contract";

export interface WaterTechnicianInfo {
  address: string;
  referrer: string | undefined;
  jobs_completed: bigint;
  first_job_reward_claimed: boolean;
}

export interface ReferralInfo {
  referral_count: bigint;
  successful_referrals: bigint;
}

function notImplemented(method: string): never {
  throw new Error(
    `[@azable/sdk] WaterTechnician.${method}: stub bindings only — see packages/sdk/src/generated/water-technician/src/index.ts`
  );
}

/** Stub contract client — see file header. Not a real Soroban contract binding. */
export class Client {
  constructor(public readonly options: ContractClientOptions) {}
  initialize(..._args: unknown[]): never { return notImplemented("initialize"); }
  register_technician(..._args: unknown[]): never { return notImplemented("register_technician"); }
  complete_job(..._args: unknown[]): never { return notImplemented("complete_job"); }
  claim_referral_reward(..._args: unknown[]): never { return notImplemented("claim_referral_reward"); }
  get_technician(..._args: unknown[]): never { return notImplemented("get_technician"); }
  get_referral_info(..._args: unknown[]): never { return notImplemented("get_referral_info"); }
  get_reward_amount(..._args: unknown[]): never { return notImplemented("get_reward_amount"); }
  set_reward_amount(..._args: unknown[]): never { return notImplemented("set_reward_amount"); }
}
