"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { BlurReveal } from "@/components/BlurReveal";
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
      <div className="bg-[#DFD7C9] px-5 py-16 text-sm text-[#5C584F]">
        Memuat ringkasan audit data &amp; hasil evaluasi model...
      </div>
    );
  }

  const { clustering, audit_findings, pest_summary } = audit;

  return (
    <div className="bg-[#DFD7C9] px-5 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <BlurReveal immediate>
          <p className="eyebrow-tag">
            <ShieldCheck className="h-3.5 w-3.5 text-[#20462B]" />
            <span>Transparansi Ilmiah &amp; Audit Dataset</span>
          </p>
          <h1 className="mt-3 font-serif text-4xl font-light uppercase leading-tight text-[#303030] md:text-6xl">
            Metodologi &amp; Batasan Model
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5C584F]">
            Dokumentasi terbuka mengenai hasil audit seluruh 9 sheet dataset
            sumber, alasan pembatasan klaim ML, serta pembanding resmi BPS dan
            Badan Pangan Nasional.
          </p>
        </BlurReveal>

        {/* 3-Column Architectural Grid */}
        <section className="grid grid-cols-1 border-t border-b border-[rgba(48,48,48,0.2)] md:grid-cols-3">
          <div className="border-b border-[rgba(48,48,48,0.2)] py-7 md:border-b-0 md:border-r md:pr-6">
            <p className="eyebrow-tag">1. SEGMENTASI BIOFISIK</p>
            <h2 className="mt-2 font-serif text-3xl font-light text-[#20462B]">
              Silhouette {clustering.silhouette_4feat}
            </h2>
            <p className="mt-3 text-sm text-[#5C584F]">
              Naik +32% dari baseline 5 fitur ({clustering.silhouette_5feat_legacy})
              setelah <code>area_ha</code> dipisahkan ke Kalkulator RAB. Tetap
              berstatus eksploratif.
            </p>
          </div>

          <div className="border-b border-[rgba(48,48,48,0.2)] py-7 md:border-b-0 md:border-r md:px-6">
            <p className="eyebrow-tag">2. PREDIKSI PANEN DITOLAK</p>
            <h2 className="mt-2 font-serif text-3xl font-light text-[#303030]">
              R² {audit_findings.yield_prediction_rejection.linear_regression.r2_test}{" "}
              / {audit_findings.yield_prediction_rejection.random_forest.r2_test}
            </h2>
            <p className="mt-3 text-sm text-[#5C584F]">
              Uji pada {audit_findings.yield_prediction_rejection.ml_rows} baris{" "}
              <code>ML_Dataset</code> lebih buruk dari menebak rata-rata (
              {audit_findings.yield_prediction_rejection.ml_yield_mean_ton_ha}{" "}
              t/ha). Fitur prediksi panen dilarang.
            </p>
          </div>

          <div className="py-7 md:pl-6">
            <p className="eyebrow-tag">3. HARGA SIMULASI DIBLOKIR</p>
            <h2 className="mt-2 font-serif text-3xl font-light text-[#303030]">
              Acuan BPS 2025
            </h2>
            <p className="mt-3 text-sm text-[#5C584F]">
              <code>Price_Data</code> (
              {formatRupiah(audit_findings.price_data_rejection.overall_min_rp_kg)}
              –{formatRupiah(audit_findings.price_data_rejection.overall_max_rp_kg)}
              /kg) tidak dipakai. Pembanding memakai HPP GKP{" "}
              {formatRupiah(audit_findings.official_bps_benchmarks.hpp_gkp_rp_kg)}
              /kg &amp; Gabah{" "}
              {formatRupiah(
                audit_findings.official_bps_benchmarks
                  .rata_rata_harga_gabah_2025_rp_kg
              )}
              /kg.
            </p>
          </div>
        </section>

        {/* Detailed Audit List */}
        <section className="rounded-[6px] border border-[rgba(48,48,48,0.2)] bg-[#F2EADA] p-6 md:p-8">
          <h2 className="font-serif text-2xl font-light text-[#303030] md:text-3xl">
            Temuan Detail Integritas Dataset
          </h2>
          <div className="mt-4 divide-y divide-[rgba(48,48,48,0.16)] text-sm text-[#5C584F]">
            <div className="py-3.5">
              <strong className="text-[#303030]">
                Ketidakcocokan Luas Tanam vs Luas Panen (
                {audit_findings.planting_harvest.total_rows} baris):
              </strong>{" "}
              Ketidakcocokan eksak ditemukan pada{" "}
              <strong>
                {audit_findings.planting_harvest.area_mismatch_exact_count} baris
              </strong>{" "}
              ({audit_findings.planting_harvest.area_mismatch_gt_001_count}{" "}
              baris dengan selisih &gt; 0,01 ha).
            </div>
            <div className="py-3.5">
              <strong className="text-[#303030]">
                Deteksi Anomali Isolation Forest:
              </strong>{" "}
              Menandai{" "}
              <strong>
                {audit_findings.planting_harvest.isolation_forest_anomalies}{" "}
                catatan panen
              </strong>{" "}
              dengan rata-rata yield{" "}
              {audit_findings.planting_harvest.isolation_forest_anom_yield_mean}{" "}
              t/ha vs normal{" "}
              {audit_findings.planting_harvest.isolation_forest_norm_yield_mean}{" "}
              t/ha.
            </div>
            <div className="py-3.5">
              <strong className="text-[#303030]">
                Anomali Pencatatan Hama ({pest_summary.total_records} baris):
              </strong>{" "}
              Terdapat {pest_summary.tidak_ada_total} baris berlabel{" "}
              <code>Tidak Ada</code> hama yang tetap memiliki status severity (
              {Object.entries(pest_summary.tidak_ada_by_severity)
                .map(([k, v]) => `${v} ${k}`)
                .join(", ")}
              ).
            </div>
          </div>
        </section>

        <DisclaimerBanner message={clustering.disclaimer} />
      </div>
    </div>
  );
}
