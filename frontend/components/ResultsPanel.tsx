"use client";

import { PredictionResponse } from "@/lib/api";
import SurvivalChart from "./SurvivalChart";

interface Props {
  data: PredictionResponse;
}

const HORIZONS = [12, 24, 36];

function defaultProb(survival: number[], timePoints: number[], t: number): string {
  const idx = timePoints.indexOf(t);
  if (idx === -1) return "—";
  return ((1 - survival[idx]) * 100).toFixed(2) + "%";
}

export default function ResultsPanel({ data }: Props) {
  return (
    <div className="space-y-6">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-4 font-medium text-gray-600">Horizon</th>
            <th className="text-right py-2 px-4 font-medium text-gray-600">Cox PH</th>
            <th className="text-right py-2 px-4 font-medium text-gray-600">Discrete Hazard</th>
            <th className="text-right py-2 pl-4 font-medium text-gray-600">DeepSurv</th>
          </tr>
        </thead>
        <tbody>
          {HORIZONS.map((t) => (
            <tr key={t} className="border-b border-gray-100">
              <td className="py-2 pr-4 text-gray-500">P(default by {t}m)</td>
              <td className="text-right py-2 px-4 tabular-nums">
                {defaultProb(data.cox_ph, data.time_points, t)}
              </td>
              <td className="text-right py-2 px-4 tabular-nums">
                {defaultProb(data.discrete_hazard, data.time_points, t)}
              </td>
              <td className="text-right py-2 pl-4 tabular-nums">
                {defaultProb(data.deepsurv, data.time_points, t)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <SurvivalChart data={data} />
    </div>
  );
}
