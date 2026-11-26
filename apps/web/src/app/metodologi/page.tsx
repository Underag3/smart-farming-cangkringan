"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { api } from "@/lib/api";
import type { AuditResponse } from "@/lib/types";
import { formatRupiah } from "@/lib/whatsapp";

export default function MetodologiPage() {
  const [audit, setAudit] = useState<AuditResponse | null>(null);

  useEffect(() => {
    api.getAudit().then(setAudit).catch(() => {});
  }, []);

  if (!audit) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-muted">
        Memuat ringkasan audit data &amp; hasil evaluasi model...
      </div>
    );
  }

  const { clustering, audit_findings, pest_summary } = audit;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-leaf-dark">
          <ShieldCheck className="h-6 w-6" />
          <h1 className="text-xl font-bold text-ink md:text-2xl">
            Audit Data, Metodologi Model &amp; Batasan
          </h1>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          Halaman ini menyajikan bukti empiris mengapa sebagian fitur diaktifkan
          dan sebagian klaim (prediksi hasil panen serta hitungan pendapatan
          dari Price_Data) ditolak secara transparan.
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-ink">
          1. Peningkatan Segmentasi Biofisik (4 Fitur vs 5 Fitur)
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Pada prototipe awal, luas lahan (<code>area_ha</code>) ikut dimasukkan
          ke K-Means sehingga mengaburkan kemiripan biofisik tanah. Setelah{" "}
          <code>area_ha</code> dipisahkan ke Kalkulator RAB, kualitas klaster
          meningkat:
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-canvas p-3.5 text-sm">
            <p className="text-xs text-ink-muted">Model Lama (5 Fitur + Luas)</p>
            <p className="mt-1 text-xl font-bold text-ink-muted">
              Silhouette {clustering.silhouette_5feat_legacy}
            </p>
          </div>
          <div className="rounded-xl border border-green-200 bg-leaf-soft p-3.5 text-sm">
            <p className="text-xs text-leaf-dark">
              Model v2.0 (4 Fitur Biofisik Murni)
            </p>
            <p className="mt-1 text-xl font-bold text-leaf-dark">
              Silhouette {clustering.silhouette_4feat}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-ink">
          2. Mengapa Prediksi Hasil Panen Ditolak?
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Evaluasi pada <code>ML_Dataset</code> (
          {audit_findings.yield_prediction_rejection.ml_rows} baris,{" "}
          {audit_findings.yield_prediction_rejection.date_min} s.d.{" "}
          {audit_findings.yield_prediction_rejection.date_max}, rata-rata yield{" "}
          {audit_findings.yield_prediction_rejection.ml_yield_mean_ton_ha} t/ha)
          menunjukkan R² negatif:
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-xl border border-line bg-canvas p-3.5">
            <p className="font-bold">Linear Regression</p>
            <p className="text-ink-muted">
              R² Uji:{" "}
              <strong>
                {audit_findings.yield_prediction_rejection.linear_regression.r2_test}
              </strong>{" "}
              · RMSE:{" "}
              {audit_findings.yield_prediction_rejection.linear_regression.rmse_test}{" "}
              t/ha
            </p>
          </div>
          <div className="rounded-xl border border-line bg-canvas p-3.5">
            <p className="font-bold">Random Forest Regressor</p>
            <p className="text-ink-muted">
              R² Uji:{" "}
              <strong>
                {audit_findings.yield_prediction_rejection.random_forest.r2_test}
              </strong>{" "}
              · RMSE:{" "}
              {audit_findings.yield_prediction_rejection.random_forest.rmse_test}{" "}
              t/ha
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-ink">
          3. Temuan Integritas Dataset Sumber
        </h2>
        <ul className="mt-2 space-y-2 text-sm text-ink-muted">
          <li>
            • <strong>Price_Data ({audit_findings.price_data_rejection.total_rows} baris):</strong>{" "}
            Rentang harga{" "}
            {formatRupiah(audit_findings.price_data_rejection.overall_min_rp_kg)}–
            {formatRupiah(audit_findings.price_data_rejection.overall_max_rp_kg)}
            /kg (rata-rata Rp 41.827–Rp 52.082/kg), tidak realistis untuk komoditas
            pangan sehingga diganti acuan resmi BPS/Bapanas (HPP GKP{" "}
            {formatRupiah(audit_findings.official_bps_benchmarks.hpp_gkp_rp_kg)}/kg,
            harga gabah 2025{" "}
            {formatRupiah(
              audit_findings.official_bps_benchmarks.rata_rata_harga_gabah_2025_rp_kg
            )}
            /kg).
          </li>
          <li>
            • <strong>Planting vs Harvest ({audit_findings.planting_harvest.total_rows} baris):</strong>{" "}
            Ketidakcocokan eksak luas tanam dan luas panen ditemukan pada{" "}
            <strong>
              {audit_findings.planting_harvest.area_mismatch_exact_count} baris
            </strong>{" "}
            ({audit_findings.planting_harvest.area_mismatch_gt_001_count} baris
            dengan toleransi &gt; 0,01 ha). Isolation Forest menandai{" "}
            <strong>
              {audit_findings.planting_harvest.isolation_forest_anomalies} anomali
            </strong>{" "}
            panen (rata-rata yield{" "}
            {audit_findings.planting_harvest.isolation_forest_anom_yield_mean}{" "}
            t/ha vs normal{" "}
            {audit_findings.planting_harvest.isolation_forest_norm_yield_mean}{" "}
            t/ha).
          </li>
          <li>
            • <strong>Pest_Disease_Data ({pest_summary.total_records} baris):</strong>{" "}
            Terdapat {pest_summary.tidak_ada_total} baris berlabel{" "}
            <code>Tidak Ada</code> yang tetap mencatat severity (
            {Object.entries(pest_summary.tidak_ada_by_severity)
              .map(([k, v]) => `${v} ${k}`)
              .join(", ")}
            ).
          </li>
        </ul>
      </section>

      <DisclaimerBanner message={clustering.disclaimer} />
    </div>
  );
}
