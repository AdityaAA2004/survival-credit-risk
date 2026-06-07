"use client";

import {
  Area,
  ComposedChart,
  Legend,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
    <ResponsiveContainer width="100%" height={380}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="survivalArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4d83bf" stopOpacity={0.16} />
            <stop offset="100%" stopColor="#4d83bf" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 6" stroke="rgba(148,163,184,0.35)" vertical={false} />
        <XAxis
          dataKey="t"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#627282" }}
          label={{ value: "months", position: "insideBottomRight", offset: -8, fill: "#627282" }}
        />
        <YAxis
          domain={[0, 1]}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          label={{ value: "survival", angle: -90, position: "insideLeft", offset: 8, fill: "#627282" }}
          tick={{ fontSize: 12, fill: "#627282" }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "10px",
            border: "1px solid #d8e0e8",
            background: "#ffffff",
            boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
          }}
          labelFormatter={(value) => `Month ${value}`}
          formatter={(value, name) => {
            if (typeof value !== "number") return value;
            return [`${(value * 100).toFixed(1)}%`, name];
          }}
        />
        <Legend
          verticalAlign="top"
          align="left"
          iconType="circle"
          wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }}
        />
        <ReferenceLine x={12} stroke="rgba(100,116,139,0.55)" strokeDasharray="4 4" label={{ value: "12m", fontSize: 11, fill: "#627282" }} />
        <ReferenceLine x={24} stroke="rgba(100,116,139,0.55)" strokeDasharray="4 4" label={{ value: "24m", fontSize: 11, fill: "#627282" }} />
        <ReferenceLine x={36} stroke="rgba(100,116,139,0.55)" strokeDasharray="4 4" label={{ value: "36m", fontSize: 11, fill: "#627282" }} />
        <Area type="monotone" dataKey="Cox PH" fill="url(#survivalArea)" stroke="none" />
        <Line type="monotone" dataKey="Cox PH" stroke="#225ea8" dot={false} strokeWidth={2.4} />
        <Line type="monotone" dataKey="Discrete Hazard" stroke="#117864" dot={false} strokeWidth={2.4} />
        <Line type="monotone" dataKey="DeepSurv" stroke="#7a5c1b" dot={false} strokeWidth={2.4} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
