const BASE = "http://localhost:8080/api";

export interface PredictionResponse {
  cox_ph: number[];
  discrete_hazard: number[];
  deepsurv: number[];
  time_points: number[];
}

export async function getFeatureCols(): Promise<string[]> {
  const res = await fetch(`${BASE}/features`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function predict(input: Record<string, number>): Promise<PredictionResponse> {
  const res = await fetch(`${BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
