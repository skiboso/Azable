"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import type { OfframpFormState, OfframpToken, OfframpCountry } from "@/types/offramp";
import { SUPPORTED_COUNTRIES, SUPPORTED_OFFRAMP_TOKENS } from "@/types/offramp";

interface OfframpFormProps {
    formState: OfframpFormState;
    onChange: (field: keyof OfframpFormState, value: string) => void;
    maxBalance?: string;
    onMaxClick?: () => void;
    minimumAmount: number;
    isLoadingMinimum?: boolean;
}

export function OfframpForm({
    formState,
    onChange,
    maxBalance,
    onMaxClick,
    minimumAmount,
    isLoadingMinimum = false,
}: OfframpFormProps) {
    const [isKycNoticeVisible, setIsKycNoticeVisible] = useState(true);

    return (
        <div className="bg-azable-mid-dark rounded-2xl p-6 border border-gray-800">
            {/* KYC Notice Banner */}
            {isKycNoticeVisible && (
                <div className="mb-6 flex items-start gap-3 rounded-xl bg-azable-dark border border-azable-purple/30 p-4">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white">KYC Verification Required</p>
                        <p className="mt-1 text-xs text-azable-light-grey">
                            To comply with regulatory requirements, you must complete KYC verification
                            before proceeding with offramp transactions. Your information is securely
                            processed and encrypted.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsKycNoticeVisible(false)}
                        className="shrink-0 rounded-full p-1 text-azable-light-grey hover:bg-white/10 hover:text-white transition-colors"
                        aria-label="Dismiss KYC notice"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            <h2 className="text-xl font-syne font-semibold text-white mb-6">
                Crypto Token
            </h2>

            {/* Token Selector */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="token" className="text-azable-light-grey text-sm">Select Token</Label>
                    <Select
                        value={formState.token}
                        onValueChange={(value) => onChange("token", value as OfframpToken)}
                    >
                        <SelectTrigger id="token" className="bg-azable-dark border-gray-700 text-white h-12">
                            <SelectValue placeholder="Select token" />
                        </SelectTrigger>
                        <SelectContent className="bg-azable-dark border-gray-700">
                            {SUPPORTED_OFFRAMP_TOKENS.map((token) => (
                                <SelectItem
                                    key={token.symbol}
                                    value={token.symbol}
                                    className="text-white hover:bg-azable-violet focus:bg-azable-violet"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{token.symbol}</span>
                                        <span className="text-azable-light-grey text-sm">
                                            ({token.name})
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                    <Label htmlFor="amount" className="text-azable-light-grey text-sm">
                        Amount
                        {isLoadingMinimum
                            ? " (Loading provider minimum...)"
                            : ` (Minimum: ${minimumAmount} ${formState.token})`}
                    </Label>
                    <div className="relative">
                        <Input
                            id="amount"
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={formState.amount}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, "");
                                if (val.split(".").length <= 2) onChange("amount", val);
                            }}
                            className="bg-azable-dark border-gray-700 text-white h-12 pr-16"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm("Are you sure you want to offramp your entire balance?")) {
                                    onMaxClick?.();
                                }
                            }}
                            disabled={!maxBalance || !onMaxClick}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-azable-purple text-sm font-medium hover:text-azable-violet disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Max
                        </button>
                    </div>
                </div>

                {/* Destination Country */}
                <div className="space-y-2">
                    <Label htmlFor="country" className="text-azable-light-grey text-sm">
                        Destination Country
                    </Label>
                    <Select
                        value={formState.country}
                        onValueChange={(value) => onChange("country", value as OfframpCountry)}
                    >
                        <SelectTrigger id="country" className="bg-azable-dark border-gray-700 text-white h-12">
                            <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent className="bg-azable-dark border-gray-700">
                            {SUPPORTED_COUNTRIES.map((country) => (
                                <SelectItem
                                    key={country.code}
                                    value={country.code}
                                    className="text-white hover:bg-azable-violet focus:bg-azable-violet"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{country.flag}</span>
                                        <span>{country.name}</span>
                                        <span className="text-azable-light-grey">
                                            ({country.currency})
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
