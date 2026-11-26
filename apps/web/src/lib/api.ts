import type {
  AuditResponse,
  CostEstimateResponse,
  CostItem,
  HealthResponse,
  LandAnalyzeRequest,
  LandAnalyzeResponse,
  RegionsResponse,
  ChatResponse,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `Permintaan gagal (${res.status})`;
    try {
      const errBody = await res.json();
      if (typeof errBody.detail === "string") {
        message = errBody.detail;
      } else if (Array.isArray(errBody.detail) && errBody.detail[0]?.msg) {
        message = errBody.detail.map((d: { loc?: string[]; msg: string }) => `${d.loc?.slice(-1)[0] ?? "input"}: ${d.msg}`).join("; ");
      }
    } catch {
      // keep default error text
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => apiFetch<HealthResponse>("/api/v1/health"),
  analyzeLand: (payload: LandAnalyzeRequest) =>
    apiFetch<LandAnalyzeResponse>("/api/v1/land/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getCosts: () =>
    apiFetch<{
      costs: CostItem[];
      official_bps_benchmarks: Record<string, number | string>;
      price_rejection_note: string;
    }>("/api/v1/costs"),
  estimateCost: (payload: {
    commodity: string;
    area_ha: number;
    target_yield_ton_per_ha?: number | null;
  }) =>
    apiFetch<CostEstimateResponse>("/api/v1/cost/estimate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getRegions: () => apiFetch<RegionsResponse>("/api/v1/regions"),
  getAudit: () => apiFetch<AuditResponse>("/api/v1/audit"),
  chat: (payload: {
    question: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    land_context?: Record<string, unknown> | null;
  }) =>
    apiFetch<ChatResponse>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendFeedback: (payload: { message_id: string; rating: 1 | -1; comment?: string }) =>
    apiFetch<{ status: string }>("/api/v1/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
