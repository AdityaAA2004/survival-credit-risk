"use client";

import { startTransition, useEffect, useState } from "react";
import BorrowerForm from "@/components/BorrowerForm";
import ResultsPanel from "@/components/ResultsPanel";
import { getFeatureCols, predict, PredictionResponse } from "@/lib/api";

const MODEL_STATS = [
  { label: "Temporal split", value: "2007-2018", detail: "Train before 2015, then validate and test forward in time." },
  { label: "Borrowers", value: "2.25M", detail: "Accepted LendingClub loans with right-censoring retained." },
  { label: "Baseline", value: "0.6931", detail: "Test C-statistic from the Cox PH baseline." },
];

const MODEL_STACK = [
  {
    name: "Cox PH",
    detail: "Interpretable linear baseline with a partial likelihood objective.",
  },
  {
    name: "Discrete Hazard",
    detail: "Monthly person-period expansion removes the proportional hazards constraint.",
  },
  {
    name: "DeepSurv",
    detail: "A neural survival model for non-linear borrower risk interactions.",
  },
];

type ConnectionState = "connecting" | "ready" | "error";

export default function RiskWorkbench() {
  const [featureCols, setFeatureCols] = useState<string[]>([]);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    let cancelled = false;

    getFeatureCols()
      .then((cols) => {
        if (cancelled) return;
        setFeatureCols(cols);
        setConnectionState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setConnectionState("error");
        setError("Backend unavailable. Start the Spring Boot server to load the scoring API.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(features: Record<string, number>) {
    setLoading(true);
    setError(null);

    try {
      const response = await predict(features);
      startTransition(() => setResult(response));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prediction failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="panel-surface rounded-[1.25rem] px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="editorial-kicker text-[11px]">Credit risk workspace</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--foreground)] sm:text-3xl">
                  Borrower survival forecast
                </h1>
                <p className="muted-copy mt-3 max-w-2xl text-sm leading-6 sm:text-base">
                  Evaluate a borrower using origination-time features and compare how Cox PH,
                  discrete hazard, and DeepSurv estimate default timing over the first 36 months.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-md px-3 py-2 text-xs font-medium ${
                    connectionState === "ready"
                      ? "bg-[rgba(17,120,100,0.1)] text-[var(--emerald)]"
                      : connectionState === "error"
                        ? "bg-[rgba(166,61,64,0.1)] text-[var(--danger)]"
                        : "bg-[#eef3f7] text-[var(--muted-strong)]"
                  }`}
                >
                  {connectionState === "ready"
                    ? "API connected"
                    : connectionState === "error"
                      ? "API unavailable"
                      : "Checking API"}
                </span>
                <span className="rounded-md border border-[var(--surface-border)] bg-[#f8fafc] px-3 py-2 text-xs text-[var(--muted-strong)]">
                  Right-censored loan outcomes
                </span>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-3 sm:grid-cols-3">
                {MODEL_STATS.map((stat) => (
                  <article key={stat.label} className="stat-pill rounded-[0.9rem] p-4">
                    <p className="soft-caption text-[10px]">{stat.label}</p>
                    <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                      {stat.value}
                    </p>
                    <p className="muted-copy mt-2 text-sm leading-5">{stat.detail}</p>
                  </article>
                ))}
              </div>

              <div className="rounded-[0.9rem] border border-[var(--surface-border)] bg-[#f8fafc] p-4">
                <p className="soft-caption text-[10px]">Model stack</p>
                <div className="mt-3 grid gap-2">
                  {MODEL_STACK.map((model) => (
                    <div key={model.name} className="flex items-start justify-between gap-4 rounded-md bg-white px-3 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">{model.name}</p>
                        <p className="muted-copy mt-1 text-sm leading-5">{model.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <div className="panel-surface rounded-[1.1rem] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <p className="editorial-kicker text-[11px]">Borrower inputs</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                    Enter origination-time borrower features
                  </h2>
                  <p className="muted-copy mt-2 text-sm leading-6">
                    The form matches the model pipeline: ordinal grades, one-hot encoded categoricals,
                    and no post-issuance leakage fields.
                  </p>
                </div>
                <div className="stat-pill rounded-[0.85rem] px-4 py-3">
                  <p className="soft-caption text-[10px]">Feature count</p>
                  <p className="mt-1 text-lg font-semibold">{featureCols.length || "..."}</p>
                </div>
              </div>

              <div className="mt-6">
                {featureCols.length > 0 ? (
                  <BorrowerForm featureCols={featureCols} onSubmit={handleSubmit} loading={loading} />
                ) : (
                  <div className="rounded-[1rem] border border-dashed border-[var(--surface-border)] bg-[#fbfcfd] px-4 py-10 text-center">
                    <p className="soft-caption text-[10px]">
                      {connectionState === "error" ? "Connection error" : "Preparing form"}
                    </p>
                    <p className="muted-copy mx-auto mt-3 max-w-md text-sm leading-6">
                      {error ?? "Loading feature columns from the backend so the frontend submits in model order."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="panel-surface rounded-[1.1rem] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="editorial-kicker text-[11px]">Model output</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                    Compare projected survival paths
                  </h2>
                </div>
                {result && (
                  <div className="rounded-md bg-[rgba(17,120,100,0.1)] px-3 py-2 text-sm font-medium text-[var(--emerald)]">
                    Prediction ready
                  </div>
                )}
              </div>

              <div className="mt-6">
                {error && !result ? (
                  <div className="rounded-[1rem] border border-[rgba(166,61,64,0.18)] bg-[rgba(166,61,64,0.06)] p-5 text-sm text-[var(--danger)]">
                    {error}
                  </div>
                ) : result ? (
                  <ResultsPanel data={result} />
                ) : (
                  <div className="rounded-[1rem] border border-dashed border-[var(--surface-border)] bg-[#fbfcfd] px-6 py-16 text-center">
                    <p className="text-xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">Run a borrower scenario to view forecast output.</p>
                    <p className="muted-copy mx-auto mt-4 max-w-xl text-sm leading-7">
                      Results will show default probability by horizon, cross-model differences,
                      and the full survival curve month by month.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
