"use client";

import React, { useEffect, useState } from "react";
import { Droplets, Sparkles, Waves } from "lucide-react";

interface LiveWaterCounterProps {
  waterSourcesCompleted: number;
  targetWaterSources: number;
  costPerWaterSource?: number;
  waterSourceType?: string;
  className?: string;
}

export const LiveWaterCounter: React.FC<LiveWaterCounterProps> = ({
  waterSourcesCompleted,
  targetWaterSources,
  costPerWaterSource = 10,
  waterSourceType = "Borehole",
  className = "",
}) => {
  const [animatedCount, setAnimatedCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1500; // 1.5 second smooth animation
    const startValue = 0;
    const endValue = waterSourcesCompleted;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(startValue + easedProgress * (endValue - startValue));
      setAnimatedCount(currentCount);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [waterSourcesCompleted]);

  const percentage = Math.min(100, Math.round((waterSourcesCompleted / Math.max(1, targetWaterSources)) * 100));

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-950/80 via-slate-900/90 to-zinc-950 p-6 border border-cyan-500/20 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-cyan-500/40 ${className}`}
    >
      {/* Background glow & particle grid */}
      <div className="absolute -top-24 -right-24 size-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 size-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Waves className="size-3.5 animate-pulse" />
            <span>Live Impact Ticker</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium bg-zinc-800/60 px-2.5 py-1 rounded-lg border border-zinc-700/50">
            <Sparkles className="size-3.5 text-amber-400" />
            <span>{waterSourceType}</span>
          </div>
        </div>

        {/* Animated Counter Display */}
        <div className="flex items-baseline justify-between pt-2">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">Water Sources Completed</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-400 font-mono tracking-tight">
                {animatedCount.toLocaleString()}
              </span>
              <span className="text-base font-semibold text-zinc-400">
                / {targetWaterSources.toLocaleString()} goal
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 shadow-inner">
            <Droplets className="size-8 text-cyan-400 animate-bounce" style={{ animationDuration: "3s" }} />
          </div>
        </div>

        {/* Impact Subtext */}
        <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-zinc-800/80">
          <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-zinc-500 block">Unit Cost</span>
            <span className="text-zinc-200 font-semibold">{costPerWaterSource} XLM / Source</span>
          </div>
          <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-zinc-500 block">Target Achieved</span>
            <span className="text-cyan-400 font-bold">{percentage}% Complete</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveWaterCounter;
