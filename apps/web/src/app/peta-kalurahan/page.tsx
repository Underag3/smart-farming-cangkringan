"use client";

import { useEffect, useState } from "react";
import { CloudRain, Bug, MapPin } from "lucide-react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { api } from "@/lib/api";
import type { RegionsResponse, SamplePlot } from "@/lib/types";

const DESA_COLORS: Record<string, string> = {
  Umbulharjo: "#2E7D32",
  Argomulyo: "#0284C7",
  Wukirsari: "#D97706",
  Glagaharjo: "#DC2626",
  Kepuharjo: "#7C3AED",
};

const SEGMENT_COLORS: Record<string, string> = {
  A: "#0284C7",
  B: "#2E7D32",
  C: "#D97706",
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
        setError(err instanceof Error ? err.message : "Gagal memuat data kalurahan.")
      );
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-muted">
        Memuat profil 5 kalurahan, koordinat lahan, dan data iklim...
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

  const maxRainfall = Math.max(
    ...data.weather_summary.monthly.map((m) => m.mean_rainfall_mm),
    1
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-ink md:text-2xl">
              Peta Mikro-Zonasi 5 Kalurahan Cangkringan
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              100 titik sampel ({data.dataset_meta.total_area_ha} ha, elevasi{" "}
              {data.dataset_meta.elevation_min_m}–{data.dataset_meta.elevation_max_m} m,{" "}
              {data.dataset_meta.soil_type}). Ketuk titik untuk melihat profil lahan.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={selectedDesa}
            onChange={(e) => setSelectedDesa(e.target.value)}
            aria-label="Filter kalurahan"
            className="min-h-[44px] rounded-xl border border-line bg-canvas px-3 text-sm font-semibold"
          >
            <option value="Semua">Semua Kalurahan (100)</option>
            {data.regions.map((r) => (
              <option key={r.desa} value={r.desa}>
                {r.desa} ({r.farm_count})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setColorBy("desa")}
            className={`min-h-[44px] rounded-xl px-3.5 text-xs font-bold ${
              colorBy === "desa"
                ? "bg-leaf text-white"
                : "border border-line bg-canvas text-ink-muted"
            }`}
          >
            Warna: Kalurahan
          </button>
          <button
            type="button"
            onClick={() => setColorBy("segment")}
            className={`min-h-[44px] rounded-xl px-3.5 text-xs font-bold ${
              colorBy === "segment"
                ? "bg-leaf text-white"
                : "border border-line bg-canvas text-ink-muted"
            }`}
          >
            Warna: Segmen ML
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-line bg-canvas p-3 md:col-span-2">
            <div className="mb-1 flex justify-between text-xs text-ink-muted">
              <span>Utara (Arah Lereng Merapi ↑)</span>
              <span>Koordinat GPS Riil Sampel</span>
            </div>
            <svg
              viewBox="0 0 400 280"
              className="h-64 w-full rounded-lg bg-white border border-line"
              role="img"
              aria-label="Peta sebaran 100 titik lahan sampel Cangkringan"
            >
              {filteredPlots.map((plot) => {
                const x =
                  ((plot.longitude - (lonMin - padLon)) /
                    (lonMax - lonMin + 2 * padLon)) *
                  380 +
                  10;
                const y =
                  (1 -
                    (plot.latitude - (latMin - padLat)) /
                      (latMax - latMin + 2 * padLat)) *
                    260 +
                  10;
                const fill =
                  colorBy === "desa"
                    ? DESA_COLORS[plot.desa] || "#2E7D32"
                    : SEGMENT_COLORS[plot.segment_id] || "#2E7D32";
                const isSelected = activePlot?.farm_id === plot.farm_id;
                return (
                  <circle
                    key={plot.farm_id}
                    cx={x}
                    cy={y}
                    r={isSelected ? 7.5 : 5}
                    fill={fill}
                    stroke={isSelected ? "#1C2B1A" : "#FFFFFF"}
                    strokeWidth={isSelected ? 2.5 : 1}
                    className="cursor-pointer"
                    onClick={() => setActivePlot(plot)}
                  />
                );
              })}
            </svg>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-muted">
              {colorBy === "desa"
                ? Object.entries(DESA_COLORS).map(([name, color]) => (
                    <span key={name} className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {name}
                    </span>
                  ))
                : [
                    ["Segmen A (Netral)", SEGMENT_COLORS.A],
                    ["Segmen B (Lereng Atas)", SEGMENT_COLORS.B],
                    ["Segmen C (NDVI Rendah)", SEGMENT_COLORS.C],
                  ].map(([name, color]) => (
                    <span key={name} className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {name}
                    </span>
                  ))}
            </div>
          </div>

          {activePlot && (
            <div className="flex flex-col justify-between rounded-xl border border-line bg-canvas p-4 text-sm">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-leaf-dark">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {activePlot.farm_id} · {activePlot.desa}
                  </span>
                </div>
                <dl className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Segmen Eksploratif</dt>
                    <dd className="font-bold">Segmen {activePlot.segment_id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Elevasi</dt>
                    <dd className="font-bold">{activePlot.elevation_m} m</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Luas</dt>
                    <dd className="font-bold">{activePlot.area_ha} ha</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">pH / C-Organik</dt>
                    <dd className="font-bold">
                      {activePlot.soil_ph} / {activePlot.organic_carbon}%
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">NDVI</dt>
                    <dd className="font-bold">{activePlot.ndvi}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Irigasi</dt>
                    <dd className="font-bold">{activePlot.irrigation}</dd>
                  </div>
                </dl>
              </div>
              <a
                href={`https://www.openstreetmap.org/?mlat=${activePlot.latitude}&mlon=${activePlot.longitude}#map=15/${activePlot.latitude}/${activePlot.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-leaf bg-white px-3 py-2 text-xs font-bold text-leaf hover:bg-leaf-soft"
              >
                Buka Koordinat di OpenStreetMap
              </a>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.regions.map((r) => (
          <div
            key={r.desa}
            className="rounded-2xl border border-line bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-ink">{r.desa}</h2>
              <span className="rounded-full bg-leaf-soft px-2.5 py-0.5 text-xs font-bold text-leaf-dark">
                {r.farm_count} lahan ({r.total_area_ha} ha)
              </span>
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              Elevasi mean <strong>{r.mean_elevation_m} m</strong> · pH{" "}
              <strong>{r.mean_soil_ph}</strong> · NDVI{" "}
              <strong>{r.mean_ndvi}</strong>
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Irigasi: Teknis {r.irrigation_counts["Teknis"] ?? 0}, Semi Teknis{" "}
              {r.irrigation_counts["Semi Teknis"] ?? 0}, Tadah Hujan{" "}
              {r.irrigation_counts["Tadah Hujan"] ?? 0}
            </p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-ink">
            <CloudRain className="h-5 w-5 text-leaf" />
            <h2>Pola Curah Hujan 60 Bulan (mm/bulan)</h2>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Rata-rata {data.weather_summary.rainfall_mean_mm} mm/bulan · Suhu{" "}
            {data.weather_summary.temperature_min_c}–
            {data.weather_summary.temperature_max_c}°C · Kelembapan{" "}
            {data.weather_summary.humidity_min_pct}–
            {data.weather_summary.humidity_max_pct}%
          </p>
          <div className="mt-4 flex h-36 items-end gap-1.5">
            {data.weather_summary.monthly.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center">
                <span className="mb-1 text-[10px] font-semibold text-ink-muted">
                  {Math.round(m.mean_rainfall_mm)}
                </span>
                <div
                  className="w-full rounded-t bg-leaf/85"
                  style={{
                    height: `${Math.max(
                      12,
                      Math.round((m.mean_rainfall_mm / maxRainfall) * 90)
                    )}px`,
                  }}
                />
                <span className="mt-1 text-[11px] font-medium text-ink">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-ink">
            <Bug className="h-5 w-5 text-soil" />
            <h2>Catatan Hama ({data.pest_summary.total_records} Baris)</h2>
          </div>
          <p className="mt-1 text-xs text-ink-muted">{data.pest_summary.note}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(data.pest_summary.counts_by_pest).map(
              ([pest, count]) => (
                <li
                  key={pest}
                  className="flex items-center justify-between rounded-xl bg-canvas px-3 py-2"
                >
                  <span className="font-medium text-ink">{pest}</span>
                  <span className="font-bold text-ink-muted">
                    {count} kejadian
                  </span>
                </li>
              )
            )}
          </ul>
        </div>
      </section>

      <DisclaimerBanner
        title="Catatan Konteks Spasial & Hama"
        message="Data hama hanya 30 baris sehingga tidak dipakai sebagai sistem peringatan dini otomatis. Selalu verifikasi kondisi petak di lapangan bersama penyuluh kalurahan."
      />
    </div>
  );
}
