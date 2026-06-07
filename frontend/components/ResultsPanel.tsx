"use client";

import { PredictionResponse } from "@/lib/api";
import SurvivalChart from "./SurvivalChart";

interface Props {
  data: PredictionResponse;
}

const HORIZONS = [12, 24, 36];

const MODEL_DETAILS = [
  { key: "cox_ph", label: "Cox PH", tone: "text-[#8f4d1c]", accent: "bg-[rgba(179,106,54,0.12)]" },
  { key: "discrete_hazard", label: "Discrete Hazard", tone: "text-[#2f6a56]", accent: "bg-[rgba(47,106,86,0.12)]" },
  { key: "deepsurv", label: "DeepSurv", tone: "text-[#7c4a41]", accent: "bg-[rgba(124,74,65,0.12)]" },
] as const;

function survivalAt(survival: number[], timePoints: number[], t: number): number | null {
  const idx = timePoints.indexOf(t);
  if (idx === -1) return null;
  return survival[idx];
}

function defaultProb(survival: number[], timePoints: number[], t: number): number | null {
  const value = survivalAt(survival, timePoints, t);
  if (value === null) return null;
  return 1 - value;
}

function formatPercent(value: number | null, digits = 1): string {
  if (value === null) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

function getRiskBand(value: number): { label: string; tone: string; detail: string } {
  if (value < 0.15) {
    return { label: "Contained", tone: "text-[#2f6a56]", detail: "Lower projected default pressure by 36 months." };
  }
  if (value < 0.3) {
    return { label: "Watchlist", tone: "text-[#8f651d]", detail: "Moderate risk. Small shifts in assumptions matter." };
  }
  if (value < 0.45) {
    return { label: "Elevated", tone: "text-[#a65b27]", detail: "Default probability becomes material within the modeled horizon." };
  }
  return { label: "High Stress", tone: "text-[#9c4935]", detail: "Multiple models converge on a materially weaker survival path." };
}

export default function ResultsPanel({ data }: Props) {
  const horizonSummary = HORIZONS.map((horizon) => {
    const values = [
      defaultProb(data.cox_ph, data.time_points, horizon),
      defaultProb(data.discrete_hazard, data.time_points, horizon),
      defaultProb(data.deepsurv, data.time_points, horizon),
    ].filter((value): value is number => value !== null);

    const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    const spread = values.length ? Math.max(...values) - Math.min(...values) : null;

    return { horizon, average, spread };
  });

  const consensus36 = horizonSummary.find((entry) => entry.horizon === 36)?.average ?? 0;
  const riskBand = getRiskBand(consensus36);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[0.95rem] border border-[var(--surface-border)] bg-[var(--foreground)] p-5 text-[rgba(255,255,255,0.94)]">
          <p className="soft-caption text-[10px] text-[rgba(255,255,255,0.58)]">Consensus read</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-semibold tracking-[-0.05em]">{formatPercent(consensus36, 1)}</p>
              <p className="mt-2 text-sm text-[rgba(255,255,255,0.72)]">Average projected default probability by month 36</p>
            </div>
            <div className={`rounded-md px-3 py-2 text-sm font-semibold ${riskBand.tone} bg-white/12`}>
              {riskBand.label}
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[rgba(255,255,255,0.76)]">{riskBand.detail}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {horizonSummary.map((entry) => (
            <div
              key={entry.horizon}
              className="rounded-[0.9rem] border border-[var(--surface-border)] bg-[#f8fafc] p-4"
            >
              <p className="soft-caption text-[10px]">By month {entry.horizon}</p>
              <p className="mt-3 text-xl font-semibold tracking-[-0.04em]">{formatPercent(entry.average, 1)}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                Model spread {formatPercent(entry.spread, 1)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {MODEL_DETAILS.map((model) => {
          const values = data[model.key];
          const by36 = defaultProb(values, data.time_points, 36);
          const by24 = defaultProb(values, data.time_points, 24);

          return (
            <article
              key={model.label}
              className="rounded-[0.9rem] border border-[var(--surface-border)] bg-white p-4"
            >
              <div className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${model.tone} ${model.accent}`}>
                {model.label}
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{formatPercent(by36, 1)}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Projected default by 36 months</p>
              <div className="mt-4 flex items-center justify-between rounded-[1rem] bg-[rgba(24,23,19,0.04)] px-3 py-3 text-sm">
                <span className="text-[var(--muted-strong)]">24m</span>
                <span className="font-medium tabular-nums">{formatPercent(by24, 1)}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="rounded-[0.95rem] border border-[var(--surface-border)] bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="editorial-kicker text-[10px]">Survival curve</p>
            <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">
              Probability of remaining current over time
            </p>
          </div>
          <div className="soft-caption rounded-full border border-[rgba(94,78,56,0.12)] bg-[rgba(24,23,19,0.03)] px-3 py-2 text-[10px]">
            Horizons highlighted at 12, 24, and 36 months
          </div>
        </div>
        <SurvivalChart data={data} />
      </div>
    </div>
  );
}
