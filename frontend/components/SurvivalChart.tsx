"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { PredictionResponse } from "@/lib/api";

interface Props {
  data: PredictionResponse;
}

export default function SurvivalChart({ data }: Props) {
  const chartData = data.time_points.map((t, i) => ({
    t,
    "Cox PH": +data.cox_ph[i].toFixed(4),
    "Discrete Hazard": +data.discrete_hazard[i].toFixed(4),
    DeepSurv: +data.deepsurv[i].toFixed(4),
  }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="t"
          label={{ value: "months", position: "insideBottomRight", offset: -8 }}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          domain={[0, 1]}
          tickFormatter={(v) => v.toFixed(1)}
          label={{ value: "S(t)", angle: -90, position: "insideLeft", offset: 8 }}
          tick={{ fontSize: 12 }}
        />
        <Tooltip formatter={(v) => (typeof v === "number" ? v.toFixed(4) : v)} />
        <Legend />
        <ReferenceLine x={12} stroke="#94a3b8" strokeDasharray="4 2" label={{ value: "12m", fontSize: 11 }} />
        <ReferenceLine x={24} stroke="#94a3b8" strokeDasharray="4 2" label={{ value: "24m", fontSize: 11 }} />
        <ReferenceLine x={36} stroke="#94a3b8" strokeDasharray="4 2" label={{ value: "36m", fontSize: 11 }} />
        <Line type="monotone" dataKey="Cox PH" stroke="#2563eb" dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="Discrete Hazard" stroke="#16a34a" dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="DeepSurv" stroke="#dc2626" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
