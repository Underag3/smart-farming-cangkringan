"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Bug, CloudRain, MapPin } from "lucide-react";
import { BlurReveal } from "@/components/BlurReveal";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { api } from "@/lib/api";
import type { RegionsResponse, SamplePlot } from "@/lib/types";

const DESA_COLORS: Record<string, string> = {
  Umbulharjo: "#20462B",
  Argomulyo: "#3B6E52",
  Wukirsari: "#B45309",
  Glagaharjo: "#991B1B",
  Kepuharjo: "#5C584F",
};

const SEGMENT_COLORS: Record<string, string> = {
  A: "#3B6E52",
  B: "#20462B",
  C: "#B45309",
};

export default function PetaKalurahanPage() {
  const [data, setData] = useState<RegionsResponse | null>(null);
  const [selectedDesa, setSelectedDesa] = useState<string>("Semua");
  const [colorBy, setColorBy] = useState<"desa" | "segment">("desa");
  const [activePlot, setActivePlot] = useState<SamplePlot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getRegions()
      .then((res) => {
        setData(res);
        setActivePlot(res.sample_plots[0] ?? null);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Gagal memuat data kalurahan."
        )
      );
  }, []);

  if (error) {
    return (
      <div className="bg-[#DFD7C9] px-5 py-16">
        <div className="mx-auto max-w-4xl rounded-[4px] border border-red-400 bg-red-50 p-5 text-sm text-red-900">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#DFD7C9] px-5 py-16 text-sm text-[#5C584F]">
        Memuat profil 5 kalurahan, koordinat lahan, dan klimatologi...
      </div>
    );
  }

  const [latMin, latMax] = data.dataset_meta.lat_bounds;
  const [lonMin, lonMax] = data.dataset_meta.lon_bounds;
  const padLat = (latMax - latMin) * 0.08 || 0.01;
  const padLon = (lonMax - lonMin) * 0.08 || 0.01;

  const filteredPlots =
    selectedDesa === "Semua"
      ? data.sample_plots
      : data.sample_plots.filter((p) => p.desa === selectedDesa);

  const selectedRegionSummary =
    selectedDesa === "Semua"
      ? null
      : data.regions.find((r) => r.desa === selectedDesa) ?? null;

  const maxRainfall = Math.max(
    ...data.weather_summary.monthly.map((m) => m.mean_rainfall_mm),
    1
  );

  return (
    <div className="bg-[#DFD7C9] px-5 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <BlurReveal immediate>
          <p className="eyebrow-tag">
            <span className="h-1.5 w-1.5 rounded-full bg-[#20462B]" />
            <span>Konteks Spasial &amp; Iklim Wilayah</span>
          </p>
          <h1 className="mt-3 font-serif text-4xl font-light uppercase leading-tight text-[#303030] md:text-6xl">
            5 Kalurahan Cangkringan
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5C584F]">
            Sebaran {data.dataset_meta.total_farms} titik sampel (
            {data.dataset_meta.total_area_ha} ha, elevasi{" "}
            {data.dataset_meta.elevation_min_m}–
            {data.dataset_meta.elevation_max_m} m, {data.dataset_meta.soil_type}
            ). Ketuk kalurahan di panel kiri atau ketuk titik koordinat di peta.
          </p>
        </BlurReveal>

        <div className="overflow-hidden rounded-[6px] border border-[rgba(48,48,48,0.18)]">
          <img
            src="/images/hero-merapi.jpg"
            alt="Lanskap Kecamatan Cangkringan berlatar Gunung Merapi"
            className="h-48 w-full object-cover md:h-64"
          />
        </div>

        {/* Split Panel Interactive Region + SVG Map */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Left Dark Forest Green Region Selector */}
          <div className="flex flex-col justify-between rounded-[6px] bg-[#20462B] p-6 text-[#F2EADA] md:col-span-5 md:p-8">
            <div>
              <h2 className="font-serif text-2xl font-light md:text-3xl">
                Pilih Kalurahan
              </h2>
              <div className="mt-6 flex flex-col gap-2">
                {["Semua", ...data.regions.map((r) => r.desa)].map((name) => {
                  const active = selectedDesa === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setSelectedDesa(name);
                        const match =
                          name === "Semua"
                            ? data.sample_plots[0]
                            : data.sample_plots.find((p) => p.desa === name);
                        if (match) setActivePlot(match);
                      }}
                      className={`flex min-h-[42px] items-center gap-3 text-left font-serif text-2xl font-light uppercase transition-all ${
                        active
                          ? "translate-x-2 text-[#F2EADA]"
                          : "text-[#ADB19F]/60 hover:text-[#F2EADA]/90"
                      }`}
                    >
                      {active && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F2EADA] text-[#20462B]">
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      )}
                      <span>
                        {name === "Semua" ? "SEMUA (100 LAHAN)" : name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 border-t border-[#F2EADA]/15 pt-5 text-sm text-[#ADB19F]">
              {selectedRegionSummary ? (
                <div className="space-y-1">
                  <p className="font-medium text-[#F2EADA]">
                    {selectedRegionSummary.desa} ·{" "}
                    {selectedRegionSummary.farm_count} lahan (
                    {selectedRegionSummary.total_area_ha} ha)
                  </p>
                  <p>
                    Elevasi mean {selectedRegionSummary.mean_elevation_m} m · pH{" "}
                    {selectedRegionSummary.mean_soil_ph} · NDVI{" "}
                    {selectedRegionSummary.mean_ndvi}
                  </p>
                  <p>
                    Irigasi: Teknis{" "}
                    {selectedRegionSummary.irrigation_counts["Teknis"] ?? 0},
                    Semi{" "}
                    {selectedRegionSummary.irrigation_counts["Semi Teknis"] ??
                      0}
                    , Tadah Hujan{" "}
                    {selectedRegionSummary.irrigation_counts["Tadah Hujan"] ??
                      0}
                  </p>
                </div>
              ) : (
                <p>
                  Kepuharjo memiliki NDVI rata-rata tertinggi (0,743), sedangkan
                  Glagaharjo terendah (0,621). Wukirsari memiliki porsi tadah
                  hujan terbesar (9/18 lahan).
                </p>
              )}
            </div>
          </div>

          {/* Right Ivory Interactive SVG Plot & Inspector */}
          <div className="flex flex-col justify-between rounded-[6px] border border-[rgba(48,48,48,0.2)] bg-[#F2EADA] p-5 md:col-span-7 md:p-7">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                <span className="text-xs uppercase tracking-[0.1em] text-[#5C584F]">
                  Koordinat GPS Sampel (Utara ↑ Lereng Merapi)
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setColorBy("desa")}
                    className={`min-h-[34px] rounded-[3px] px-3 text-xs font-medium ${
                      colorBy === "desa"
                        ? "bg-[#20462B] text-[#F2EADA]"
                        : "border border-dashed border-[rgba(48,48,48,0.4)] text-[#5C584F]"
                    }`}
                  >
                    Warna: Kalurahan
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorBy("segment")}
                    className={`min-h-[34px] rounded-[3px] px-3 text-xs font-medium ${
                      colorBy === "segment"
                        ? "bg-[#20462B] text-[#F2EADA]"
                        : "border border-dashed border-[rgba(48,48,48,0.4)] text-[#5C584F]"
                    }`}
                  >
                    Warna: Segmen ML
                  </button>
                </div>
              </div>

              <svg
                viewBox="0 0 420 260"
                className="h-64 w-full rounded-[4px] border border-[rgba(48,48,48,0.18)] bg-[#DFD7C9]/45"
                role="img"
                aria-label="Peta titik sampel lahan Cangkringan"
              >
                {filteredPlots.map((plot) => {
                  const x =
                    ((plot.longitude - (lonMin - padLon)) /
                      (lonMax - lonMin + 2 * padLon)) *
                      396 +
                    12;
                  const y =
                    (1 -
                      (plot.latitude - (latMin - padLat)) /
                        (latMax - latMin + 2 * padLat)) *
                      236 +
                    12;
                  const fill =
                    colorBy === "desa"
                      ? DESA_COLORS[plot.desa] || "#20462B"
                      : SEGMENT_COLORS[plot.segment_id] || "#20462B";
                  const isSelected = activePlot?.farm_id === plot.farm_id;
                  return (
                    <circle
                      key={plot.farm_id}
                      cx={x}
                      cy={y}
                      r={isSelected ? 7.5 : 5}
                      fill={fill}
                      stroke={isSelected ? "#112617" : "#F2EADA"}
                      strokeWidth={isSelected ? 2.5 : 1}
                      className="cursor-pointer"
                      onClick={() => setActivePlot(plot)}
                    />
                  );
                })}
              </svg>
            </div>

            {activePlot && (
              <div className="mt-4 flex flex-col justify-between gap-4 border-t border-[rgba(48,48,48,0.18)] pt-4 sm:flex-row sm:items-center">
                <div className="text-xs text-[#5C584F]">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-[#303030]">
                    <MapPin className="h-4 w-4 text-[#20462B]" />
                    <span>
                      {activePlot.farm_id} · {activePlot.desa} (Segmen{" "}
                      {activePlot.segment_id})
                    </span>
                  </p>
                  <p className="mt-1">
                    Elevasi {activePlot.elevation_m} m · Luas{" "}
                    {activePlot.area_ha} ha · pH {activePlot.soil_ph} ·
                    C-Organik {activePlot.organic_carbon}% · NDVI{" "}
                    {activePlot.ndvi} · {activePlot.irrigation}
                  </p>
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${activePlot.latitude}&mlon=${activePlot.longitude}#map=15/${activePlot.latitude}/${activePlot.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-drs-dashed min-h-[40px] shrink-0 px-3 py-1.5 text-xs"
                >
                  Lihat di Peta OSM
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Weather & Pest Hairline Split */}
        <section className="grid grid-cols-1 border-t border-[rgba(48,48,48,0.2)] md:grid-cols-2">
          <div className="border-b border-[rgba(48,48,48,0.2)] py-8 md:border-b-0 md:border-r md:pr-8">
            <div className="flex items-center gap-2 text-[#303030]">
              <CloudRain className="h-5 w-5 text-[#20462B]" />
              <h2 className="font-serif text-2xl font-light">
                Curah Hujan 60 Bulan (mm/bulan)
              </h2>
            </div>
            <p className="mt-1 text-xs text-[#5C584F]">
              Rata-rata {data.weather_summary.rainfall_mean_mm} mm · Suhu{" "}
              {data.weather_summary.temperature_min_c}–
              {data.weather_summary.temperature_max_c}°C · Kelembapan{" "}
              {data.weather_summary.humidity_min_pct}–
              {data.weather_summary.humidity_max_pct}%
            </p>
            <div className="mt-6 flex h-36 items-end gap-1.5">
              {data.weather_summary.monthly.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center">
                  <span className="mb-1 text-[10px] text-[#5C584F]">
                    {Math.round(m.mean_rainfall_mm)}
                  </span>
                  <div
                    className="w-full bg-[#20462B]"
                    style={{
                      height: `${Math.max(
                        12,
                        Math.round((m.mean_rainfall_mm / maxRainfall) * 88)
                      )}px`,
                    }}
                  />
                  <span className="mt-1.5 text-[11px] text-[#303030]">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="py-8 md:pl-8">
            <div className="flex items-center gap-2 text-[#303030]">
              <Bug className="h-5 w-5 text-[#8D6E63]" />
              <h2 className="font-serif text-2xl font-light">
                Catatan Hama ({data.pest_summary.total_records} Baris)
              </h2>
            </div>
            <p className="mt-1 text-xs text-[#5C584F]">
              {data.pest_summary.note}
            </p>
            <div className="mt-5 border-t border-[rgba(48,48,48,0.16)]">
              {Object.entries(data.pest_summary.counts_by_pest).map(
                ([pest, count]) => (
                  <div
                    key={pest}
                    className="flex justify-between border-b border-[rgba(48,48,48,0.16)] py-2.5 text-sm"
                  >
                    <span className="text-[#303030]">{pest}</span>
                    <span className="font-medium text-[#20462B]">
                      {count} kejadian
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <DisclaimerBanner
          title="Catatan Batasan Spasial & Hama"
          message="Sampel hama hanya 30 baris sehingga tidak dipakai untuk peringatan dini otomatis. Koordinat dan ringkasan lahan dipakai sebagai konteks awal pendampingan PPL."
        />
      </div>
    </div>
  );
}
