"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Calculator, Share2 } from "lucide-react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { api } from "@/lib/api";
import type { CostEstimateResponse, CostItem } from "@/lib/types";
import {
  buildCostWhatsappText,
  formatRupiah,
  openWhatsappShare,
} from "@/lib/whatsapp";

function KalkulatorBiayaContent() {
  const params = useSearchParams();
  const initialCrop = params.get("komoditas") || "Padi";
  const initialArea = params.get("luas") || "1";

  const [costs, setCosts] = useState<CostItem[]>([]);
  const [commodity, setCommodity] = useState(initialCrop);
  const [unit, setUnit] = useState<"ha" | "m2">("ha");
  const [areaInput, setAreaInput] = useState(initialArea);
  const [targetYield, setTargetYield] = useState("4.635");
  const [useBep, setUseBep] = useState(true);

  const [estimate, setEstimate] = useState<CostEstimateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getCosts()
      .then((d) => setCosts(d.costs))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const rawNum = Number(areaInput);
    const areaHa = unit === "ha" ? rawNum : rawNum / 10000;
    if (!Number.isFinite(areaHa) || areaHa <= 0 || areaHa > 100) {
      setError("Luas lahan harus > 0 dan maksimal 100 hektar (1.000.000 m²).");
      return;
    }

    const yieldNum = useBep && Number(targetYield) > 0 ? Number(targetYield) : null;
    setError(null);
    api
      .estimateCost({
        commodity,
        area_ha: areaHa,
        target_yield_ton_per_ha: yieldNum,
      })
      .then(setEstimate)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Gagal menghitung biaya.")
      );
  }, [commodity, areaInput, unit, targetYield, useBep]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
        <h1 className="text-xl font-bold text-ink md:text-2xl">
          Kalkulator RAB &amp; Titik Impas Usaha Tani
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Hitung rincian modal benih, pupuk, pestisida, dan tenaga kerja sesuai
          luas lahan aktual dari Cost_Data terverifikasi.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-ink">Pilih Komoditas</span>
            <select
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-line bg-canvas px-3.5 text-base focus:border-leaf focus:outline-none"
            >
              {(costs.length > 0
                ? costs.map((c) => `${c.commodity}`)
                : ["Padi", "Jagung", "Bawang Merah", "Cabai Merah", "Tomat", "Salak Pondoh"]
              ).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Luas Lahan</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (unit === "m2") {
                      setAreaInput(String(Number(areaInput || 1000) / 10000));
                      setUnit("ha");
                    }
                  }}
                  className={`min-h-[32px] rounded-lg px-2.5 text-xs font-bold ${
                    unit === "ha"
                      ? "bg-leaf text-white"
                      : "border border-line bg-canvas text-ink-muted"
                  }`}
                >
                  Hektar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (unit === "ha") {
                      setAreaInput(String(Math.round(Number(areaInput || 1) * 10000)));
                      setUnit("m2");
                    }
                  }}
                  className={`min-h-[32px] rounded-lg px-2.5 text-xs font-bold ${
                    unit === "m2"
                      ? "bg-leaf text-white"
                      : "border border-line bg-canvas text-ink-muted"
                  }`}
                >
                  m²
                </button>
              </div>
            </div>
            <input
              type="number"
              step="any"
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-line bg-canvas px-3.5 text-base focus:border-leaf focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-line bg-canvas p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={useBep}
                onChange={(e) => setUseBep(e.target.checked)}
                className="h-5 w-5 accent-[#2E7D32]"
              />
              <span>Hitung Simulasi Harga Titik Impas (BEP)</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setUseBep(true);
                setTargetYield("4.635");
              }}
              className="min-h-[36px] rounded-lg border border-line bg-white px-2.5 text-xs font-semibold text-leaf hover:bg-leaf-soft"
            >
              Preset Padi BPS (4,635 t/ha)
            </button>
          </div>
          {useBep && (
            <label className="mt-2 block">
              <span className="text-xs text-ink-muted">
                Asumsi Produktivitas Anda Sendiri (ton/ha):
              </span>
              <input
                type="number"
                step="0.01"
                value={targetYield}
                onChange={(e) => setTargetYield(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-line bg-white px-3 text-base focus:border-leaf focus:outline-none sm:max-w-xs"
              />
            </label>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
      </section>

      {estimate && (
        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-leaf">
                Varietas {estimate.variety} · {estimate.area_ha} ha
              </p>
              <h2 className="mt-1 text-2xl font-bold text-ink md:text-3xl">
                {formatRupiah(estimate.scaled_cost.total)}
              </h2>
              <p className="text-xs text-ink-muted">
                Acuan 1 ha: {formatRupiah(estimate.cost_per_ha.total)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openWhatsappShare(buildCostWhatsappText(estimate))}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-leaf px-4 py-2.5 text-sm font-bold text-white hover:bg-leaf-dark"
            >
              <Share2 className="h-4 w-4" />
              <span>Bagikan RAB ke WhatsApp</span>
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {[
              { label: "Benih", val: estimate.scaled_cost.seed, pct: estimate.component_shares_pct.seed },
              { label: "Pupuk", val: estimate.scaled_cost.fertilizer, pct: estimate.component_shares_pct.fertilizer },
              { label: "Pestisida", val: estimate.scaled_cost.pesticide, pct: estimate.component_shares_pct.pesticide },
              { label: "Tenaga Kerja", val: estimate.scaled_cost.labor, pct: estimate.component_shares_pct.labor },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-ink">{row.label}</span>
                  <span className="font-bold text-ink">
                    {formatRupiah(row.val)} ({row.pct}%)
                  </span>
                </div>
                <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-canvas">
                  <div
                    className="h-full rounded-full bg-leaf"
                    style={{ width: `${Math.min(100, row.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {estimate.break_even && (
            <div className="mt-5 rounded-xl border border-green-200 bg-leaf-soft p-4">
              <div className="flex items-center gap-2 font-bold text-leaf-dark">
                <Calculator className="h-4 w-4" />
                <span>Simulasi Harga Titik Impas (Break-Even)</span>
              </div>
              <p className="mt-1 text-xl font-bold text-ink">
                {formatRupiah(estimate.break_even.break_even_price_rp_per_kg)} / kg
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Asumsi total panen {estimate.break_even.expected_total_kg.toLocaleString("id-ID")} kg.{" "}
                {estimate.break_even.note}
              </p>
            </div>
          )}

          {estimate.official_benchmarks.length > 0 && (
            <div className="mt-4 rounded-xl border border-line bg-canvas p-3.5 text-sm">
              <p className="font-bold text-ink">Pembanding Resmi BPS &amp; Bapanas:</p>
              <ul className="mt-1.5 space-y-1 text-ink-muted">
                {estimate.official_benchmarks.map((bm) => (
                  <li key={bm.label}>
                    • {bm.label}:{" "}
                    <strong className="text-ink">
                      {bm.value_rp_kg
                        ? `${formatRupiah(bm.value_rp_kg)} / kg`
                        : `${bm.value_ton_ha} ton / ha`}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {costs.length > 0 && (
        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-ink">
            Referensi Biaya 6 Komoditas per 1 Hektar
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {costs.map((item) => (
              <div
                key={item.commodity}
                className="rounded-xl border border-line bg-canvas p-3.5"
              >
                <div className="flex items-baseline justify-between">
                  <p className="font-bold text-ink">{item.commodity}</p>
                  <p className="text-xs text-ink-muted">{item.variety}</p>
                </div>
                <p className="mt-1 text-lg font-bold text-leaf-dark">
                  {formatRupiah(item.total_cost_per_ha)}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  Benih {formatRupiah(item.seed_cost)} · Pupuk{" "}
                  {formatRupiah(item.fertilizer_cost)} · Tenaga{" "}
                  {formatRupiah(item.labor_cost)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <DisclaimerBanner
        title="Mengapa Laba Kotor Tidak Dihitung Otomatis?"
        message="Price_Data di dataset Vinix memiliki harga acak Rp 41.827-Rp 52.082/kg sehingga dilarang dipakai menghitung pendapatan. Gunakan harga pasar lokal Anda sendiri atau acuan BPS/Bapanas di atas."
      />
    </div>
  );
}

export default function KalkulatorBiayaPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-muted">
          Memuat kalkulator RAB...
        </div>
      }
    >
      <KalkulatorBiayaContent />
    </Suspense>
  );
}
