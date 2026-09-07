"use client";

import React, { type ReactNode } from "react";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWallet } from "@/providers/StellarWalletProvider";

interface ConnectWalletPromptProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  containerClassName?: string;
  cardClassName?: string;
}

export function ConnectWalletPrompt({
  title = "Connect your wallet to continue",
  description = "You'll need a Stellar wallet connected to use this feature.",
  actionLabel = "Connect Wallet",
  containerClassName,
  cardClassName,
}: ConnectWalletPromptProps) {
  const { openModal } = useWallet();

  return (
    <div
      className={cn(
        "flex min-h-[60vh] items-center justify-center px-4 py-10",
        containerClassName,
      )}
    >
      <div
        className={cn(
          "relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-azable-mid-dark p-10 text-center shadow-[0_0_40px_rgba(130,86,255,0.12)]",
          cardClassName,
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-azable-purple-2/10" />
        <div className="relative z-10 space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Wallet className="h-7 w-7 text-azable-purple-2" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
            <p className="text-azable-light-grey">{description}</p>
          </div>
          <Button variant="gradient" size="lg" onClick={openModal}>
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ProtectedRouteProps extends ConnectWalletPromptProps {
  children: ReactNode;
}

export default function ProtectedRoute({
  children,
  title,
  description,
  actionLabel,
  containerClassName,
  cardClassName,
}: ProtectedRouteProps) {
  const { address } = useWallet();

  if (!address) {
    return (
      <ConnectWalletPrompt
        title={title}
        description={description}
        actionLabel={actionLabel}
        containerClassName={containerClassName}
        cardClassName={cardClassName}
      />
    );
  }

  return <>{children}</>;
}
