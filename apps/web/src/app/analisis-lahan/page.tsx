"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Share2, Sprout } from "lucide-react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { api } from "@/lib/api";
import type { IrrigationType, LandAnalyzeResponse } from "@/lib/types";
import { formatRupiah, openWhatsappShare } from "@/lib/whatsapp";

const PRESETS: Array<{
  label: string;
  elevation_m: number;
  soil_ph: number;
  organic_carbon: number;
  ndvi: number;
  area_ha: number;
  irrigation: IrrigationType;
}> = [
  {
    label: "Lereng Atas (Kepuharjo)",
    elevation_m: 760,
    soil_ph: 5.9,
    organic_carbon: 2.66,
    ndvi: 0.77,
    area_ha: 1.0,
    irrigation: "Semi Teknis",
  },
  {
    label: "Zona Netral (Argomulyo)",
    elevation_m: 655,
    soil_ph: 6.55,
    organic_carbon: 2.4,
    ndvi: 0.7,
    area_ha: 0.8,
    irrigation: "Teknis",
  },
  {
    label: "Lereng Bawah (Glagaharjo)",
    elevation_m: 550,
    soil_ph: 5.95,
    organic_carbon: 2.4,
    ndvi: 0.56,
    area_ha: 0.5,
    irrigation: "Tadah Hujan",
  },
];

export default function AnalisisLahanPage() {
  const [elevation, setElevation] = useState("760");
  const [ph, setPh] = useState("5.9");
  const [oc, setOc] = useState("2.6");
  const [ndvi, setNdvi] = useState("0.77");
  const [areaHa, setAreaHa] = useState("0.8");
  const [irrigation, setIrrigation] = useState<IrrigationType | "">("Semi Teknis");

  const [result, setResult] = useState<LandAnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.analyzeLand({
        elevation_m: Number(elevation),
        soil_ph: Number(ph),
        organic_carbon: Number(oc),
        ndvi: Number(ndvi),
        area_ha: Number(areaHa),
        irrigation: irrigation ? irrigation : null,
      });
      setResult(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menganalisis lahan."
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
        <h1 className="text-xl font-bold text-ink md:text-2xl">
          Cek Segmen &amp; Diagnosis Lahan
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Masukkan kondisi biofisik lahan untuk mendapatkan segmen eksploratif
          (4 fitur), diagnosis kesehatan tanah, dan skor kecocokan 6 komoditas.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setElevation(String(p.elevation_m));
                setPh(String(p.soil_ph));
                setOc(String(p.organic_carbon));
                setNdvi(String(p.ndvi));
                setAreaHa(String(p.area_ha));
                setIrrigation(p.irrigation);
              }}
              className="min-h-[44px] rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-semibold text-ink hover:border-leaf hover:bg-leaf-soft"
            >
              Isi Contoh: {p.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Elevasi Lahan (meter dpl)
              </span>
              <input
                type="number"
                step="any"
                required
                value={elevation}
                onChange={(e) => setElevation(e.target.value)}
                placeholder="Contoh: 760 (Cangkringan 451-899)"
                className="mt-1 min-h-[48px] w-full rounded-xl border border-line bg-canvas px-3.5 text-base focus:border-leaf focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-ink">
                pH Tanah (0 - 14)
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                placeholder="Contoh: 5.9 (Cangkringan 5.54-6.80)"
                className="mt-1 min-h-[48px] w-full rounded-xl border border-line bg-canvas px-3.5 text-base focus:border-leaf focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Karbon Organik Tanah (%)
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={oc}
                onChange={(e) => setOc(e.target.value)}
                placeholder="Contoh: 2.6 (Cangkringan 1.51-3.48)"
                className="mt-1 min-h-[48px] w-full rounded-xl border border-line bg-canvas px-3.5 text-base focus:border-leaf focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Indeks Vegetasi NDVI (-1 s.d. 1)
              </span>
              <input
                type="number"
                step="0.001"
                required
                value={ndvi}
                onChange={(e) => setNdvi(e.target.value)}
                placeholder="Contoh: 0.77 (Cangkringan 0.459-0.887)"
                className="mt-1 min-h-[48px] w-full rounded-xl border border-line bg-canvas px-3.5 text-base focus:border-leaf focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Luas Lahan (hektar, untuk hitung RAB)
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={areaHa}
                onChange={(e) => setAreaHa(e.target.value)}
                placeholder="Contoh: 0.8"
                className="mt-1 min-h-[48px] w-full rounded-xl border border-line bg-canvas px-3.5 text-base focus:border-leaf focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Sumber Irigasi Lahan
              </span>
              <select
                value={irrigation}
                onChange={(e) =>
                  setIrrigation(e.target.value as IrrigationType | "")
                }
                className="mt-1 min-h-[48px] w-full rounded-xl border border-line bg-canvas px-3.5 text-base focus:border-leaf focus:outline-none"
              >
                <option value="Teknis">Irigasi Teknis</option>
                <option value="Semi Teknis">Irigasi Semi Teknis</option>
                <option value="Tadah Hujan">Tadah Hujan</option>
                <option value="">Belum Diketahui</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-leaf px-6 py-3 text-base font-bold text-white transition-colors hover:bg-leaf-dark disabled:opacity-50"
          >
            <Sprout className="h-5 w-5" />
            <span>{loading ? "Menganalisis..." : "Analisis Lahan Sekarang"}</span>
          </button>
        </form>
      </section>

      {result && (
        <div className="space-y-5">
          {result.ood_warnings.length > 0 && (
            <DisclaimerBanner
              title="Peringatan Input di Luar Sebaran Cangkringan"
              message={result.ood_warnings.join(" ")}
            />
          )}

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-leaf-soft px-3 py-1 text-xs font-bold text-leaf-dark">
                Segmen Eksploratif {result.exploratory_segment.id}
              </span>
              <span className="text-xs text-ink-muted">
                Silhouette {result.exploratory_segment.silhouette_score} | Jarak{" "}
                {result.exploratory_segment.standardized_distance}
              </span>
            </div>

            <h2 className="mt-2 text-lg font-bold text-ink">
              {result.exploratory_segment.name}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {result.exploratory_segment.description}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-canvas p-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-ink-muted">Elevasi Pusat</p>
                <p className="font-bold">
                  {result.exploratory_segment.nearest_centroid.elevation_m} m
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">pH Pusat</p>
                <p className="font-bold">
                  {result.exploratory_segment.nearest_centroid.soil_ph}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">C-Organik Pusat</p>
                <p className="font-bold">
                  {result.exploratory_segment.nearest_centroid.organic_carbon}%
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">NDVI Pusat</p>
                <p className="font-bold">
                  {result.exploratory_segment.nearest_centroid.ndvi}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-bold text-ink">
                3 Rekomendasi Pengelolaan Awal:
              </h3>
              <ul className="mt-2 space-y-2 text-sm text-ink">
                {result.exploratory_segment.focus_recommendations.map((rec) => (
                  <li key={rec} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => openWhatsappShare(result.whatsapp_summary)}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-leaf bg-white px-4 py-2.5 text-sm font-bold text-leaf hover:bg-leaf-soft"
              >
                <Share2 className="h-4 w-4" />
                <span>Bagikan Ringkasan ke WhatsApp</span>
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-ink">
              Diagnosis Kesehatan Tanah
            </h2>
            <div className="mt-3 space-y-3">
              {result.soil_diagnosis.map((diag) => (
                <div
                  key={diag.parameter}
                  className="rounded-xl border border-line bg-canvas p-3.5 text-sm"
                >
                  <p className="font-bold text-ink">{diag.status}</p>
                  <p className="mt-1 text-ink-muted">{diag.recommendation}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-ink">
              Peringkat Kesesuaian 6 Komoditas ({result.input.area_ha} ha)
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {result.commodity_suitability.map((crop) => (
                <div
                  key={crop.commodity}
                  className="flex flex-col justify-between rounded-xl border border-line bg-canvas p-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-base font-bold text-ink">
                          {crop.commodity}
                        </p>
                        <p className="text-xs text-ink-muted">
                          Varietas: {crop.variety}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          crop.tier === "Sangat Cocok"
                            ? "bg-leaf-soft text-leaf-dark"
                            : crop.tier === "Cukup Cocok"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-stone-200 text-stone-700"
                        }`}
                      >
                        {crop.score}/100 · {crop.tier}
                      </span>
                    </div>

                    <ul className="mt-2.5 space-y-1 text-xs text-ink-muted">
                      {crop.reasons.map((r) => (
                        <li key={r}>• {r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <div>
                      <p className="text-xs text-ink-muted">Estimasi Modal</p>
                      <p className="text-sm font-bold text-ink">
                        {formatRupiah(crop.estimated_cost_for_area)}
                      </p>
                    </div>
                    <Link
                      href={`/kalkulator-biaya?komoditas=${encodeURIComponent(
                        crop.commodity
                      )}&luas=${result.input.area_ha}`}
                      className="inline-flex min-h-[44px] items-center rounded-xl bg-leaf px-3 py-2 text-xs font-bold text-white hover:bg-leaf-dark"
                    >
                      Rinci RAB
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <DisclaimerBanner message={result.exploratory_segment.disclaimer} />
        </div>
      )}
    </div>
  );
}
