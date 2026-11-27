"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Calculator, Share2 } from "lucide-react";
import { BlurReveal } from "@/components/BlurReveal";
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

    const yieldNum =
      useBep && Number(targetYield) > 0 ? Number(targetYield) : null;
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

  const cropImage =
    commodity === "Padi"
      ? "/images/segmen-a-padi.jpg"
      : commodity === "Salak Pondoh"
        ? "/images/segmen-b-salak.jpg"
        : "/images/crop-hortikultura.jpg";

  return (
    <div className="bg-[#DFD7C9] px-5 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <BlurReveal immediate>
          <p className="eyebrow-tag">
            <span className="h-1.5 w-1.5 rounded-full bg-[#20462B]" />
            <span>Perencanaan Modal &amp; Titik Impas</span>
          </p>
          <h1 className="mt-3 font-serif text-4xl font-light uppercase leading-tight text-[#303030] md:text-6xl">
            Kalkulator RAB Usaha Tani
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5C584F]">
            Menghitung proporsi benih, pupuk, pestisida, dan tenaga kerja
            sesuai luas lahan aktual dari <code>Cost_Data</code>, tanpa
            menggunakan harga jual simulasi.
          </p>
        </BlurReveal>

        {/* Controls (#F2EADA) */}
        <section className="rounded-[6px] border border-[rgba(48,48,48,0.2)] bg-[#F2EADA] p-6 md:p-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#5C584F]">
                Komoditas
              </span>
              <select
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-[4px] border border-[rgba(48,48,48,0.24)] bg-[#DFD7C9]/45 px-3.5 text-base text-[#303030] focus:border-[#20462B] focus:outline-none"
              >
                {(costs.length > 0
                  ? costs.map((c) => c.commodity)
                  : [
                      "Padi",
                      "Jagung",
                      "Bawang Merah",
                      "Cabai Merah",
                      "Tomat",
                      "Salak Pondoh",
                    ]
                ).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#5C584F]">
                  Luas Lahan
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (unit === "m2") {
                        setAreaInput(String(Number(areaInput || 1000) / 10000));
                        setUnit("ha");
                      }
                    }}
                    className={`min-h-[30px] rounded-[3px] px-2.5 text-xs font-medium ${
                      unit === "ha"
                        ? "bg-[#20462B] text-[#F2EADA]"
                        : "border border-dashed border-[rgba(48,48,48,0.4)] text-[#5C584F]"
                    }`}
                  >
                    Hektar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (unit === "ha") {
                        setAreaInput(
                          String(Math.round(Number(areaInput || 1) * 10000))
                        );
                        setUnit("m2");
                      }
                    }}
                    className={`min-h-[30px] rounded-[3px] px-2.5 text-xs font-medium ${
                      unit === "m2"
                        ? "bg-[#20462B] text-[#F2EADA]"
                        : "border border-dashed border-[rgba(48,48,48,0.4)] text-[#5C584F]"
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
                className="mt-1.5 min-h-[48px] w-full rounded-[4px] border border-[rgba(48,48,48,0.24)] bg-[#DFD7C9]/45 px-3.5 text-base text-[#303030] focus:border-[#20462B] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-4 border-t border-[rgba(48,48,48,0.16)] pt-5 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <label className="inline-flex min-h-[32px] items-center gap-2.5 text-sm font-medium text-[#303030]">
                <input
                  type="checkbox"
                  checked={useBep}
                  onChange={(e) => setUseBep(e.target.checked)}
                  className="h-4 w-4 accent-[#20462B]"
                />
                <span>Hitung Simulasi Harga Titik Impas (Break-Even)</span>
              </label>
              {useBep && (
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    value={targetYield}
                    onChange={(e) => setTargetYield(e.target.value)}
                    aria-label="Asumsi produktivitas ton per hektar"
                    className="min-h-[44px] w-44 rounded-[4px] border border-[rgba(48,48,48,0.24)] bg-[#DFD7C9]/45 px-3 text-base"
                  />
                  <span className="text-xs text-[#5C584F]">ton / ha</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setUseBep(true);
                setTargetYield("4.635");
              }}
              className="btn-drs-dashed min-h-[40px] px-3.5 py-2 text-xs"
            >
              Gunakan Acuan Padi BPS (4,635 t/ha)
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-[4px] border border-red-400 bg-red-50 p-3 text-sm text-red-900">
              {error}
            </p>
          )}
        </section>

        {/* Split Output (#20462B Left + #F2EADA Right) */}
        {estimate && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col justify-between overflow-hidden rounded-[6px] bg-[#20462B] text-[#F2EADA]">
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={cropImage}
                  alt={estimate.commodity}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#20462B] via-[#20462B]/20 to-transparent" />
              </div>
              <div className="flex flex-1 flex-col justify-between p-6 pt-2 md:p-8 md:pt-2">
              <div>
                <p className="eyebrow-tag-light">
                  {estimate.commodity} · Varietas {estimate.variety} ·{" "}
                  {estimate.area_ha} ha
                </p>
                <p className="mt-5 font-serif text-4xl font-light text-[#F2EADA] md:text-5xl">
                  {formatRupiah(estimate.scaled_cost.total)}
                </p>
                <p className="mt-2 text-xs text-[#ADB19F]">
                  Acuan per 1 ha: {formatRupiah(estimate.cost_per_ha.total)}
                </p>

                {estimate.break_even && (
                  <div className="mt-8 border-t border-[#F2EADA]/15 pt-5">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-[#ADB19F]">
                      <Calculator className="h-3.5 w-3.5" />
                      <span>Harga Titik Impas (BEP)</span>
                    </div>
                    <p className="mt-2 font-serif text-3xl font-light text-[#F2EADA]">
                      {formatRupiah(
                        estimate.break_even.break_even_price_rp_per_kg
                      )}{" "}
                      / kg
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#ADB19F]">
                      Asumsi panen{" "}
                      {estimate.break_even.expected_total_kg.toLocaleString(
                        "id-ID"
                      )}{" "}
                      kg. {estimate.break_even.note}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => openWhatsappShare(buildCostWhatsappText(estimate))}
                  className="btn-drs-dashed-light w-full sm:w-auto"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Bagikan RAB ke WhatsApp</span>
                </button>
              </div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[6px] border border-[rgba(48,48,48,0.2)] bg-[#F2EADA] p-6 md:p-8">
              <div>
                <p className="eyebrow-tag">Rincian 4 Komponen Biaya</p>
                <div className="mt-5 space-y-4">
                  {[
                    {
                      label: "Benih",
                      val: estimate.scaled_cost.seed,
                      pct: estimate.component_shares_pct.seed,
                    },
                    {
                      label: "Pupuk",
                      val: estimate.scaled_cost.fertilizer,
                      pct: estimate.component_shares_pct.fertilizer,
                    },
                    {
                      label: "Pestisida",
                      val: estimate.scaled_cost.pesticide,
                      pct: estimate.component_shares_pct.pesticide,
                    },
                    {
                      label: "Tenaga Kerja",
                      val: estimate.scaled_cost.labor,
                      pct: estimate.component_shares_pct.labor,
                    },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#5C584F]">{row.label}</span>
                        <span className="font-medium text-[#303030]">
                          {formatRupiah(row.val)} ({row.pct}%)
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full bg-[#DFD7C9]">
                        <div
                          className="h-full bg-[#20462B]"
                          style={{ width: `${Math.min(100, row.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {estimate.official_benchmarks.length > 0 && (
                <div className="mt-8 border-t border-[rgba(48,48,48,0.18)] pt-4 text-sm">
                  <p className="eyebrow-tag">Acuan Resmi BPS &amp; Bapanas</p>
                  <ul className="mt-2.5 space-y-1.5 text-[#5C584F]">
                    {estimate.official_benchmarks.map((bm) => (
                      <li key={bm.label} className="flex justify-between">
                        <span>{bm.label}</span>
                        <strong className="text-[#303030]">
                          {bm.value_rp_kg
                            ? `${formatRupiah(bm.value_rp_kg)} / kg`
                            : `${bm.value_ton_ha} ton / ha`}
                        </strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 6-Commodity Architectural Grid */}
        {costs.length > 0 && (
          <section>
            <p className="eyebrow-tag">Referensi 6 Komoditas per 1 Hektar</p>
            <div className="mt-4 grid grid-cols-1 border-t border-[rgba(48,48,48,0.2)] sm:grid-cols-2 lg:grid-cols-3">
              {costs.map((item) => (
                <div
                  key={item.commodity}
                  className="border-b border-[rgba(48,48,48,0.2)] p-5 sm:border-r"
                >
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-serif text-2xl font-light text-[#303030]">
                      {item.commodity}
                    </h2>
                    <span className="text-xs text-[#5C584F]">
                      {item.variety}
                    </span>
                  </div>
                  <p className="mt-2 font-serif text-2xl text-[#20462B]">
                    {formatRupiah(item.total_cost_per_ha)}
                  </p>
                  <p className="mt-2 text-xs text-[#5C584F]">
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
          title="Mengapa Proyeksi Pendapatan Tidak Ditampilkan?"
          message="Price_Data di dataset Vinix memiliki harga acak Rp 41.827-Rp 52.082/kg sehingga dilarang dipakai menghitung laba. Gunakan harga jual pasar lokal atau acuan resmi BPS/Bapanas."
        />
      </div>
    </div>
  );
}

export default function KalkulatorBiayaPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#DFD7C9] px-5 py-16 text-sm text-[#5C584F]">
          Memuat kalkulator RAB...
        </div>
      }
    >
      <KalkulatorBiayaContent />
    </Suspense>
  );
}
