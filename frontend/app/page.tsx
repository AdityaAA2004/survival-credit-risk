"use client";

import { useEffect, useState } from "react";
import BorrowerForm from "@/components/BorrowerForm";
import ResultsPanel from "@/components/ResultsPanel";
import { getFeatureCols, predict, PredictionResponse } from "@/lib/api";

export default function Home() {
  const [featureCols, setFeatureCols] = useState<string[]>([]);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFeatureCols()
      .then(setFeatureCols)
      .catch(() => setError("Backend unavailable — start the Spring Boot server first."));
  }, []);

  async function handleSubmit(features: Record<string, number>) {
    setLoading(true);
    setError(null);
    try {
      const res = await predict(features);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prediction failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Survival Credit Risk</h1>
        <p className="text-sm text-gray-500">Time-to-default prediction — LendingClub loans</p>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            {featureCols.length > 0 ? (
              <BorrowerForm featureCols={featureCols} onSubmit={handleSubmit} loading={loading} />
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : (
              <p className="text-sm text-gray-400">Connecting to backend...</p>
            )}
          </div>
        </div>

        <div className="flex-1">
          {error && !result && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          {result ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Survival probability estimates</h2>
              <ResultsPanel data={result} />
            </div>
          ) : (
            !error && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-400 text-center py-20">
                Fill in borrower details and click Predict survival.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
