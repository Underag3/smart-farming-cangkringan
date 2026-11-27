"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Share2, Sprout } from "lucide-react";
import { BlurReveal } from "@/components/BlurReveal";
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
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menganalisis lahan."
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#DFD7C9] px-5 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Editorial Page Header */}
        <BlurReveal immediate>
          <p className="eyebrow-tag">
            <span className="h-1.5 w-1.5 rounded-full bg-[#20462B]" />
            <span>Mesin Evaluasi Lahan Hibrida</span>
          </p>
          <h1 className="mt-3 font-serif text-4xl font-light uppercase leading-tight text-[#303030] md:text-6xl">
            Cek Segmen &amp; Diagnosis Lahan
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5C584F]">
            Masukkan 4 parameter biofisik (elevasi, pH, karbon organik, NDVI)
            bersama luas lahan dan irigasi untuk memetakan segmen eksploratif
            serta skor kesesuaian 6 komoditas lokal.
          </p>
        </BlurReveal>

        {/* Form Container (#F2EADA hairline) */}
        <section className="rounded-[6px] border border-[rgba(48,48,48,0.2)] bg-[#F2EADA] p-6 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(48,48,48,0.16)] pb-5">
            <p className="text-xs uppercase tracking-[0.12em] text-[#5C584F]">
              Isi Cepat Sampel Cangkringan:
            </p>
            <div className="flex flex-wrap gap-2">
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
                  className="btn-drs-dashed min-h-[40px] px-3 py-1.5 text-xs"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#5C584F]">
                  Elevasi (meter dpl)
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  value={elevation}
                  onChange={(e) => setElevation(e.target.value)}
                  className="mt-1.5 min-h-[48px] w-full rounded-[4px] border border-[rgba(48,48,48,0.24)] bg-[#DFD7C9]/45 px-3.5 text-base text-[#303030] focus:border-[#20462B] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#5C584F]">
                  pH Tanah (0 – 14)
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={ph}
                  onChange={(e) => setPh(e.target.value)}
                  className="mt-1.5 min-h-[48px] w-full rounded-[4px] border border-[rgba(48,48,48,0.24)] bg-[#DFD7C9]/45 px-3.5 text-base text-[#303030] focus:border-[#20462B] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#5C584F]">
                  Karbon Organik (%)
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={oc}
                  onChange={(e) => setOc(e.target.value)}
                  className="mt-1.5 min-h-[48px] w-full rounded-[4px] border border-[rgba(48,48,48,0.24)] bg-[#DFD7C9]/45 px-3.5 text-base text-[#303030] focus:border-[#20462B] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#5C584F]">
                  Indeks Vegetasi NDVI (-1 s.d. 1)
                </span>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={ndvi}
                  onChange={(e) => setNdvi(e.target.value)}
                  className="mt-1.5 min-h-[48px] w-full rounded-[4px] border border-[rgba(48,48,48,0.24)] bg-[#DFD7C9]/45 px-3.5 text-base text-[#303030] focus:border-[#20462B] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#5C584F]">
                  Luas Lahan (hektar, untuk RAB)
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={areaHa}
                  onChange={(e) => setAreaHa(e.target.value)}
                  className="mt-1.5 min-h-[48px] w-full rounded-[4px] border border-[rgba(48,48,48,0.24)] bg-[#DFD7C9]/45 px-3.5 text-base text-[#303030] focus:border-[#20462B] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#5C584F]">
                  Sumber Irigasi
                </span>
                <select
                  value={irrigation}
                  onChange={(e) =>
                    setIrrigation(e.target.value as IrrigationType | "")
                  }
                  className="mt-1.5 min-h-[48px] w-full rounded-[4px] border border-[rgba(48,48,48,0.24)] bg-[#DFD7C9]/45 px-3.5 text-base text-[#303030] focus:border-[#20462B] focus:outline-none"
                >
                  <option value="Teknis">Irigasi Teknis</option>
                  <option value="Semi Teknis">Irigasi Semi Teknis</option>
                  <option value="Tadah Hujan">Tadah Hujan</option>
                  <option value="">Belum Diketahui</option>
                </select>
              </label>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-[4px] border border-red-400 bg-red-50 p-3.5 text-sm text-red-900">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-drs-primary w-full sm:w-auto sm:px-8"
            >
              <Sprout className="h-4 w-4" />
              <span>{loading ? "Menganalisis..." : "Analisis Lahan Sekarang"}</span>
            </button>
          </form>
        </section>

        {result && (
          <div className="media-blur-enter space-y-10">
            {result.ood_warnings.length > 0 && (
              <DisclaimerBanner
                title="Peringatan Input di Luar Sebaran Cangkringan"
                message={result.ood_warnings.join(" ")}
              />
            )}

            {/* 50/50 Split Segment Card (#20462B + #F2EADA) */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col justify-between rounded-[6px] bg-[#20462B] p-6 text-[#F2EADA] md:p-8">
                <div>
                  <p className="eyebrow-tag-light">
                    Segmen Eksploratif {result.exploratory_segment.id} ·
                    Silhouette {result.exploratory_segment.silhouette_score}
                  </p>
                  <h2 className="mt-3 font-serif text-3xl font-light text-[#F2EADA]">
                    {result.exploratory_segment.name}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#ADB19F]">
                    {result.exploratory_segment.description}
                  </p>

                  <ul className="mt-6 space-y-2.5 border-t border-[#F2EADA]/15 pt-5 text-sm">
                    {result.exploratory_segment.focus_recommendations.map((rec) => (
                      <li key={rec} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ADB19F]" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4">
                  <button
                    type="button"
                    onClick={() => openWhatsappShare(result.whatsapp_summary)}
                    className="btn-drs-dashed-light w-full sm:w-auto"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Bagikan Ringkasan ke WhatsApp</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-[6px] border border-[rgba(48,48,48,0.2)] bg-[#F2EADA] p-6 md:p-8">
                <div>
                  <p className="eyebrow-tag">Pusat Klaster &amp; Diagnosis Tanah</p>
                  <div className="mt-4 grid grid-cols-2 border-t border-[rgba(48,48,48,0.18)]">
                    {[
                      ["Elevasi Pusat", `${result.exploratory_segment.nearest_centroid.elevation_m} m`],
                      ["pH Pusat", `${result.exploratory_segment.nearest_centroid.soil_ph}`],
                      ["C-Organik Pusat", `${result.exploratory_segment.nearest_centroid.organic_carbon}%`],
                      ["NDVI Pusat", `${result.exploratory_segment.nearest_centroid.ndvi}`],
                    ].map(([k, v], i) => (
                      <div
                        key={k}
                        className={`border-b border-[rgba(48,48,48,0.18)] py-4 ${
                          i % 2 === 0
                            ? "border-r border-[rgba(48,48,48,0.18)] pr-3"
                            : "pl-4"
                        }`}
                      >
                        <p className="text-xs text-[#5C584F]">{k}</p>
                        <p className="mt-1 font-serif text-2xl text-[#20462B]">
                          {v}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {result.soil_diagnosis.map((diag) => (
                    <div
                      key={diag.parameter}
                      className="border-b border-[rgba(48,48,48,0.14)] pb-3 text-sm last:border-b-0"
                    >
                      <p className="font-semibold text-[#303030]">
                        {diag.status}
                      </p>
                      <p className="mt-0.5 text-[#5C584F]">
                        {diag.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Editorial Commodity Suitability Rows */}
            <section>
              <p className="eyebrow-tag">
                Peringkat Kesesuaian 6 Komoditas ({result.input.area_ha} ha)
              </p>
              <div className="mt-4 border-t border-[rgba(48,48,48,0.2)]">
                {result.commodity_suitability.map((crop) => (
                  <div
                    key={crop.commodity}
                    className="grid grid-cols-1 gap-6 border-b border-[rgba(48,48,48,0.2)] py-7 md:grid-cols-12 md:items-center"
                  >
                    <div className="md:col-span-7">
                      <div className="flex flex-wrap items-baseline gap-3">
                        <h3 className="font-serif text-3xl font-light text-[#303030]">
                          {crop.commodity}
                        </h3>
                        <span className="rounded-[3px] border border-[rgba(48,48,48,0.2)] bg-[#F2EADA] px-2.5 py-0.5 text-xs font-medium text-[#20462B]">
                          Skor {crop.score}/100 · {crop.tier}
                        </span>
                      </div>
                      <ul className="mt-3 space-y-1 text-sm text-[#5C584F]">
                        {crop.reasons.map((r) => (
                          <li key={r}>• {r}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col justify-between gap-4 border-t border-[rgba(48,48,48,0.16)] pt-4 md:col-span-5 md:border-t-0 md:pt-0">
                      <div className="grid grid-cols-2 border-t border-[rgba(48,48,48,0.16)] pt-3 text-sm">
                        <div className="pr-3">
                          <p className="text-xs text-[#5C584F]">Varietas</p>
                          <p className="mt-0.5 font-medium text-[#303030]">
                            {crop.variety}
                          </p>
                        </div>
                        <div className="border-l border-[rgba(48,48,48,0.16)] pl-3">
                          <p className="text-xs text-[#5C584F]">
                            Estimasi Modal
                          </p>
                          <p className="mt-0.5 font-medium text-[#20462B]">
                            {formatRupiah(crop.estimated_cost_for_area)}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/kalkulator-biaya?komoditas=${encodeURIComponent(
                          crop.commodity
                        )}&luas=${result.input.area_ha}`}
                        className="btn-drs-primary w-full sm:w-auto"
                      >
                        Rinci RAB Komoditas Ini
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
    </div>
  );
}
