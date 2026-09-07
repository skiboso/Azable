"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/providers/StellarWalletProvider";
import { socialService } from "@/services/social.service";
import { useCallback } from "react";

const SOCIAL_QUERY_KEY = "social";

/**
 * Hook to fetch the current user's water-technician info and referral info.
 * Returns technician registration status, referral stats, and reward info.
 */
export function useReferrals() {
  const { address } = useWallet();
  const queryClient = useQueryClient();

  // Fetch technician info
  const {
    data: technicianInfo,
    isLoading: isLoadingTechnician,
    error: technicianError,
  } = useQuery({
    queryKey: [SOCIAL_QUERY_KEY, "technician", address],
    queryFn: () => socialService.getTechnician(address!),
    enabled: !!address,
  });

  // Fetch referral info
  const {
    data: referralInfo,
    isLoading: isLoadingReferrals,
    error: referralError,
  } = useQuery({
    queryKey: [SOCIAL_QUERY_KEY, "referrals", address],
    queryFn: () => socialService.getReferralInfo(address!),
    enabled: !!address,
  });

  // Fetch reward amount
  const {
    data: rewardAmount,
    isLoading: isLoadingReward,
  } = useQuery({
    queryKey: [SOCIAL_QUERY_KEY, "rewardAmount"],
    queryFn: () => socialService.getRewardAmount(),
    enabled: !!address,
  });

  const isLoading = isLoadingTechnician || isLoadingReferrals || isLoadingReward;
  const error = technicianError || referralError;

  return {
    technicianInfo,
    referralInfo,
    rewardAmount,
    isLoading,
    error,
    isRegistered: !!technicianInfo,
    pendingRewards:
      referralInfo
        ? Number(referralInfo.referral_count - referralInfo.successful_referrals)
        : 0,
  };
}

/**
 * Hook to register as a water technician.
 */
export function useRegisterTechnician() {
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (referrerAddress?: string) =>
      socialService.registerTechnician(address!, referrerAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SOCIAL_QUERY_KEY] });
    },
  });

  return {
    register: mutation.mutate,
    isRegistering: mutation.isPending,
    registrationError: mutation.error,
    registrationSuccess: mutation.isSuccess,
  };
}

/**
 * Hook to claim a referral reward.
 */
export function useReferralRewardClaim() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      referrerAddress,
      referredTechnicianAddress,
    }: {
      referrerAddress: string;
      referredTechnicianAddress: string;
    }) => socialService.claimReferralReward(referrerAddress, referredTechnicianAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SOCIAL_QUERY_KEY] });
    },
  });

  return {
    claimReward: mutation.mutate,
    isClaiming: mutation.isPending,
    claimError: mutation.error,
    claimSuccess: mutation.isSuccess,
  };
}

/**
 * Build the referral URL for sharing.
 */
export function useReferralUrl() {
  const { address } = useWallet();

  const getReferralUrl = useCallback(
    (baseOrigin?: string) => {
      if (!address) return "";
      const origin = baseOrigin || (typeof window !== "undefined" ? window.location.origin : "");
      return `${origin}?referrer=${address}`;
    },
    [address],
  );

  return { referralUrl: address ? getReferralUrl() : "", getReferralUrl };
}
