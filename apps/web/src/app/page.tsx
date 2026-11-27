"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { BlurReveal } from "@/components/BlurReveal";
import { ChatAtelier } from "@/components/ChatAtelier";
import { formatRupiah } from "@/lib/whatsapp";

const SPACE_TABS = [
  {
    id: "seg-a",
    label: "SEGMEN A · NETRAL",
    subtitle: "42 Lahan · Zona Menengah-Netral",
    description:
      "Elevasi rata-rata 654,2 m dengan pH paling mendekati netral (6,56), C-organik 2,36%, dan NDVI 0,694. Mendukung rotasi padi-palawija atau hortikultura saat air tersedia.",
    metrics: [
      { k: "Elevasi Pusat", v: "654,2 m" },
      { k: "pH Tanah Pusat", v: "6,56" },
      { k: "C-Organik", v: "2,36%" },
      { k: "NDVI Rata-rata", v: "0,694" },
    ],
    ctaHref: "/analisis-lahan",
    ctaLabel: "Uji Profil Lahan Anda",
  },
  {
    id: "seg-b",
    label: "SEGMEN B · LERENG ATAS",
    subtitle: "36 Lahan · Subur & Vegetasi Rapat",
    description:
      "Elevasi rata-rata 763,9 m dengan karbon organik tertinggi (2,66%) dan kanopi terapat (NDVI 0,774), namun pH cenderung agak asam (5,94). Cocok untuk Salak Pondoh dan konservasi lereng.",
    metrics: [
      { k: "Elevasi Pusat", v: "763,9 m" },
      { k: "pH Tanah Pusat", v: "5,94" },
      { k: "C-Organik", v: "2,66%" },
      { k: "NDVI Rata-rata", v: "0,774" },
    ],
    ctaHref: "/analisis-lahan",
    ctaLabel: "Analisis Lereng Atas",
  },
  {
    id: "seg-c",
    label: "SEGMEN C · VEGETASI JARANG",
    subtitle: "22 Lahan · Lereng Bawah",
    description:
      "Elevasi rata-rata 553,3 m dengan NDVI terendah (0,577) dan pH 5,97. Prioritaskan kompos matang/probiotik hayati dan sesuaikan komoditas dengan tipe irigasi.",
    metrics: [
      { k: "Elevasi Pusat", v: "553,3 m" },
      { k: "pH Tanah Pusat", v: "5,97" },
      { k: "C-Organik", v: "2,43%" },
      { k: "NDVI Rata-rata", v: "0,577" },
    ],
    ctaHref: "/analisis-lahan",
    ctaLabel: "Cek Kebutuhan Tanah",
  },
  {
    id: "kalurahan",
    label: "5 KALURAHAN MERAPI",
    subtitle: "100 Lahan · Total 108,7 Hektar",
    description:
      "Mencakup Umbulharjo (26), Argomulyo (24), Wukirsari (18), Glagaharjo (17 — NDVI terendah 0,621), dan Kepuharjo (15 — NDVI tertinggi 0,743). Seluruhnya tanah Regosol Vulkanik Merapi.",
    metrics: [
      { k: "Rentang Elevasi", v: "451–899 m" },
      { k: "Irigasi Teknis", v: "35 Lahan" },
      { k: "Semi Teknis", v: "32 Lahan" },
      { k: "Tadah Hujan", v: "33 Lahan" },
    ],
    ctaHref: "/peta-kalurahan",
    ctaLabel: "Buka Peta Kalurahan",
  },
];

const FEATURED_CROPS = [
  {
    name: "Padi Sawah",
    variety: "IR64",
    costPerHa: 14318434,
    summary:
      "Menyerap porsi tenaga kerja terbesar (51,9% dari modal per ha). Memerlukan irigasi teknis/semi teknis dan pengendalian preventif hama Wereng (12 dari 30 catatan hama).",
  },
  {
    name: "Salak Pondoh",
    variety: "Pondoh Sleman",
    costPerHa: 9398454,
    summary:
      "Komoditas unggulan lereng Merapi dengan biaya per hektar paling efisien di dataset. Sangat adaptif pada pH agak asam (5,5–6,5) dengan pupuk kandang/kompos dan probiotik.",
  },
  {
    name: "Jagung & Hortikultura",
    variety: "Bisi 18 / Keriting Lokal / Servo / Tajuk",
    costPerHa: 11009217,
    summary:
      "Alternatif rotasi palawija dan hortikultura (Jagung Rp 11,01 jt, Bawang Merah Rp 10,31 jt, Cabai Merah Rp 10,28 jt, Tomat Rp 9,85 jt per ha) sesuai elevasi dan ketersediaan air.",
  },
];

export default function HomePage() {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const currentTab = SPACE_TABS[activeTabIdx];

  return (
    <div>
      {/* 1. Full-Viewport Hero */}
      <section className="relative flex min-h-[calc(100vh-56px)] flex-col justify-between overflow-hidden bg-[#112617] text-[#F2EADA]">
        {/* Atmospheric Volcanic Slope SVG & Radial Gradient Background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 65% 28%, rgba(47, 89, 58, 0.72) 0%, rgba(26, 56, 34, 0.88) 48%, rgba(17, 38, 23, 0.98) 100%)",
          }}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 760"
          preserveAspectRatio="xMidYMax slice"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
        >
          <path
            d="M0,620 Q320,420 680,520 T1440,460 L1440,760 L0,760 Z"
            fill="#20462B"
          />
          <path
            d="M0,690 Q480,530 920,610 T1440,560 L1440,760 L0,760 Z"
            fill="#17321E"
          />
          <path
            d="M220,490 L520,250 L820,490 Z"
            fill="rgba(242, 234, 218, 0.06)"
          />
        </svg>

        {/* Top-left giant serif & right-edge vertical display */}
        <div className="relative z-10 flex items-start justify-between px-5 pt-7 md:px-10 md:pt-8">
          <BlurReveal immediate y={16}>
            <h1 className="font-serif text-[44px] font-light uppercase leading-none tracking-[-0.02em] text-[#F2EADA] sm:text-6xl md:text-[78px]">
              TANICERDAS
            </h1>
          </BlurReveal>
          <p className="vertical-display font-serif text-[26px] font-light uppercase leading-none tracking-[0.06em] text-[#F2EADA]/90 sm:text-4xl md:text-[56px]">
            CANGKRINGAN
          </p>
        </div>

        {/* Lower hero editorial statement + dual CTA + scroll indicator */}
        <div className="relative z-10 flex flex-col justify-between gap-8 px-5 pb-8 md:flex-row md:items-end md:px-10 md:pb-10">
          <BlurReveal immediate delay={0.12} className="md:ml-[24%] max-w-md">
            <p className="font-serif text-3xl font-light leading-[1.15] text-[#F2EADA] md:text-[42px]">
              Memahami Lahan Merapi, Menanam Lebih Terukur
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <Link href="/analisis-lahan" className="btn-drs-primary">
                Cek Lahan Anda
              </Link>
              <a href="#tanya-tani" className="btn-drs-dashed-light">
                Tanya Asisten AI
              </a>
            </div>
          </BlurReveal>

          <a
            href="#cerita-lahan"
            className="inline-flex items-center gap-3 self-end text-xs tracking-wide text-[#F2EADA]/85 hover:text-[#F2EADA]"
          >
            <span>Gulir untuk jelajahi</span>
            <ArrowDown className="h-4 w-4 arrows-bounce" />
          </a>
        </div>
      </section>

      {/* 2. The Story / Konteks Wilayah (#DFD7C9) */}
      <section id="cerita-lahan" className="bg-[#DFD7C9] px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="md:ml-[24%] max-w-2xl">
            <BlurReveal>
              <p className="eyebrow-tag">
                <span className="h-1.5 w-1.5 rounded-full bg-[#303030]" />
                <span>Konteks Wilayah</span>
              </p>
              <p className="mt-6 font-serif text-3xl font-light leading-[1.22] text-[#303030] md:text-[42px]">
                Berawal dari kebutuhan petani lereng Merapi akan satu tempat
                bertanya yang ringkas — memadukan data 100 lahan Cangkringan,
                rincian modal nyata, dan batasan ilmiah yang jujur.
              </p>
              <div className="mt-8">
                <Link href="/metodologi" className="btn-drs-dashed">
                  Pelajari Audit Data
                </Link>
              </div>
            </BlurReveal>
          </div>
        </div>
      </section>

      {/* 3. Interactive 50/50 Split Panel ("How the Space Is Lived In") */}
      <section className="bg-[#DFD7C9] px-4 pb-20 md:px-8 md:pb-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2">
          {/* Left Dark Forest Green Tab Selector */}
          <div className="flex min-h-[480px] flex-col justify-between rounded-[6px] bg-[#20462B] p-6 text-[#F2EADA] md:min-h-[580px] md:p-10">
            <div>
              <h2 className="font-serif text-3xl font-light leading-tight md:text-4xl">
                Bagaimana Lahan
                <br />
                Cangkringan Dipetakan
              </h2>

              <div className="mt-10 flex flex-col gap-2.5" role="tablist">
                {SPACE_TABS.map((tab, idx) => {
                  const active = idx === activeTabIdx;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTabIdx(idx)}
                      className={`flex min-h-[44px] items-center gap-3 text-left font-serif text-2xl font-light tracking-wide transition-all duration-300 md:text-[32px] ${
                        active
                          ? "translate-x-2 text-[#F2EADA]"
                          : "text-[#ADB19F]/60 hover:text-[#F2EADA]/85"
                      }`}
                    >
                      {active && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F2EADA] text-[#20462B]">
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      )}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-8 max-w-md text-sm leading-relaxed text-[#F2EADA]/90">
              {currentTab.description}
            </p>
          </div>

          {/* Right Soft Ivory Detail Panel with Blur Crossfade */}
          <div
            key={currentTab.id}
            className="media-blur-enter flex min-h-[420px] flex-col justify-between rounded-[6px] border border-[rgba(48,48,48,0.18)] bg-[#F2EADA] p-6 md:min-h-[580px] md:p-10"
          >
            <div>
              <p className="eyebrow-tag">
                <span className="h-1.5 w-1.5 rounded-full bg-[#20462B]" />
                <span>Profil Terverifikasi</span>
              </p>
              <h3 className="mt-4 font-serif text-3xl font-light text-[#303030] md:text-4xl">
                {currentTab.subtitle}
              </h3>

              <div className="mt-8 grid grid-cols-2 border-t border-[rgba(48,48,48,0.18)]">
                {currentTab.metrics.map((m, i) => (
                  <div
                    key={m.k}
                    className={`border-b border-[rgba(48,48,48,0.18)] py-5 ${
                      i % 2 === 0
                        ? "pr-4 border-r border-[rgba(48,48,48,0.18)]"
                        : "pl-5"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.1em] text-[#5C584F]">
                      {m.k}
                    </p>
                    <p className="mt-1.5 font-serif text-2xl font-normal text-[#20462B] md:text-3xl">
                      {m.v}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(48,48,48,0.16)] pt-6">
              <p className="max-w-xs text-xs text-[#5C584F]">
                Segmentasi K-Means 4 fitur biofisik memiliki silhouette 0,2233
                dan bersifat eksploratif.
              </p>
              <Link href={currentTab.ctaHref} className="btn-drs-primary">
                {currentTab.ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Consultation Atelier (#tanya-tani) */}
      <section
        id="tanya-tani"
        className="border-t border-[rgba(48,48,48,0.18)] bg-[#DFD7C9] px-5 py-20 md:px-10 md:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <BlurReveal>
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="eyebrow-tag">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#20462B]" />
                  <span>Asisten Hibrida RAG &amp; Tool-Calling</span>
                </p>
                <h2 className="mt-3 font-serif text-4xl font-light uppercase tracking-tight text-[#303030] md:text-5xl">
                  Tanya Tani Cangkringan
                </h2>
              </div>
              <p className="max-w-md text-sm text-[#5C584F]">
                Setiap angka biaya, profil lahan, dan acuan BPS dihitung oleh
                modul deterministik sehingga tidak mengarang angka.
              </p>
            </div>
          </BlurReveal>

          <Suspense
            fallback={
              <div className="rounded-[6px] border border-[rgba(48,48,48,0.2)] bg-[#F2EADA] p-6 text-sm text-[#5C584F]">
                Memuat ruang konsultasi...
              </div>
            }
          >
            <ChatAtelier />
          </Suspense>
        </div>
      </section>

      {/* 5. Editorial Crop Rows ("Retreats Within These Walls") */}
      <section className="border-t border-[rgba(48,48,48,0.18)] bg-[#DFD7C9] px-5 py-20 md:px-10">
        <div className="mx-auto max-w-7xl">
          <BlurReveal className="text-center">
            <p className="eyebrow-tag">
              <span className="h-1.5 w-1.5 rounded-full bg-[#303030]" />
              <span>Referensi Biaya &amp; Varietas Lokal</span>
            </p>
            <h2 className="mt-3 font-serif text-4xl font-light uppercase leading-tight text-[#303030] md:text-5xl">
              Komoditas Di Lereng Merapi
            </h2>
          </BlurReveal>

          <div className="mt-14 border-t border-[rgba(48,48,48,0.2)]">
            {FEATURED_CROPS.map((crop) => (
              <BlurReveal
                key={crop.name}
                className="grid grid-cols-1 gap-8 border-b border-[rgba(48,48,48,0.2)] py-10 md:grid-cols-12 md:items-center"
              >
                <div className="md:col-span-7">
                  <h3 className="font-serif text-3xl font-light text-[#303030] md:text-4xl">
                    {crop.name}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5C584F]">
                    {crop.summary}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/kalkulator-biaya?komoditas=${encodeURIComponent(
                        crop.name === "Padi Sawah"
                          ? "Padi"
                          : crop.name === "Jagung & Hortikultura"
                            ? "Jagung"
                            : crop.name
                      )}&luas=1`}
                      className="btn-drs-primary"
                    >
                      Hitung RAB
                    </Link>
                    <Link href="/analisis-lahan" className="btn-drs-dashed">
                      Cek Kecocokan
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 border-t border-[rgba(48,48,48,0.18)] pt-4 text-sm md:col-span-5">
                  <div className="pr-4">
                    <p className="text-xs text-[#5C584F]">Varietas Data</p>
                    <p className="mt-1 font-medium text-[#303030]">
                      {crop.variety}
                    </p>
                  </div>
                  <div className="border-l border-[rgba(48,48,48,0.18)] pl-4">
                    <p className="text-xs text-[#5C584F]">Modal / Hektar</p>
                    <p className="mt-1 font-medium text-[#20462B]">
                      {formatRupiah(crop.costPerHa)}
                    </p>
                  </div>
                </div>
              </BlurReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Three-Column Architectural Pillars */}
      <section className="bg-[#DFD7C9]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 border-t border-[rgba(48,48,48,0.2)] md:grid-cols-3">
          {[
            {
              eyebrow: "INTEGRITAS MODEL",
              title: "Jujur Terhadap Batas Data",
              text: "Prediksi hasil panen dinonaktifkan karena R² regresi bernilai negatif (-0,130 dan -0,076), dan Price_Data acak tidak pernah dipakai menghitung laba.",
            },
            {
              eyebrow: "ZONA BIOFISIK",
              title: "Berakar pada Karakter Tanah",
              text: "Memisahkan luas petak dari pengelompokan tanah menaikkan kualitas klaster (+32%) untuk tanah Regosol Vulkanik Merapi di 5 kalurahan.",
            },
            {
              eyebrow: "SIAP LAPANGAN",
              title: "RAB & Titik Impas Nyata",
              text: "Setiap analisis lahan terhubung langsung dengan kalkulator biaya proporsional, acuan resmi BPS/Bapanas, dan ringkasan siap kirim ke WhatsApp.",
            },
          ].map((col, idx) => (
            <BlurReveal
              key={col.eyebrow}
              delay={idx * 0.08}
              className={`flex flex-col justify-between p-8 md:min-h-[260px] ${
                idx < 2
                  ? "border-b border-[rgba(48,48,48,0.2)] md:border-b-0 md:border-r"
                  : ""
              }`}
            >
              <div>
                <p className="eyebrow-tag">{col.eyebrow}</p>
                <h3 className="mt-2 font-serif text-2xl font-light text-[#303030]">
                  {col.title}
                </h3>
              </div>
              <p className="mt-8 text-sm leading-relaxed text-[#5C584F]">
                {col.text}
              </p>
            </BlurReveal>
          ))}
        </div>
      </section>

      {/* 7. Dark Atmospheric Scrollytelling Band (Lotus-Temple Inspired) */}
      <section
        className="relative overflow-hidden bg-[#112617] px-5 py-28 text-[#F2EADA] md:px-10 md:py-36"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 24%, rgba(164, 122, 58, 0.28) 0%, rgba(26, 56, 34, 0.45) 38%, #112617 75%)",
        }}
      >
        <div className="mx-auto max-w-5xl">
          <BlurReveal className="text-center">
            <p className="eyebrow-tag-light">Transparansi Ilmiah</p>
            <h2 className="mt-4 font-serif text-4xl font-light uppercase leading-tight text-[#F2EADA] md:text-6xl">
              Terbuka Dalam Angka,
              <br />
              Hati-Hati Dalam Klaim
            </h2>
          </BlurReveal>

          <div className="mt-20 space-y-16">
            {[
              {
                align: "left",
                eyebrow: "KLUSTERING 4 FITUR",
                title: "Silhouette 0,2233",
                text: "Pengelompokan eksploratif tanpa melibatkan luas lahan memberi profil tanah yang lebih konsisten, lengkap dengan peringatan otomatis untuk input di luar sebaran Cangkringan.",
              },
              {
                align: "right",
                eyebrow: "KETERBATASAN HAMA",
                title: "30 Catatan Lapangan",
                text: "Wereng mendominasi 12 dari 30 catatan hama. Karena sampelnya tipis dan terdapat anomali pencatatan, sistem menolak klaim peringatan dini otomatis.",
              },
              {
                align: "left",
                eyebrow: "ACUAN RESMI",
                title: "Pembanding BPS & Bapanas",
                text: "Harga gabah 2025 Rp 7.081/kg, HPP GKP Rp 6.500/kg, HPP jagung Rp 5.500/kg, serta produktivitas padi 4,635 ton/ha dipakai sebagai tolok ukur yang terverifikasi.",
              },
            ].map((beat) => (
              <BlurReveal
                key={beat.eyebrow}
                className={`max-w-md ${
                  beat.align === "right" ? "md:ml-auto" : ""
                }`}
              >
                <p className="eyebrow-tag-light">{beat.eyebrow}</p>
                <h3 className="mt-2 font-serif text-3xl font-light text-[#F2EADA]">
                  {beat.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#ADB19F]">
                  {beat.text}
                </p>
              </BlurReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Closing Editorial CTA */}
      <section className="bg-[#DFD7C9] px-5 py-24 text-center md:px-10 md:py-32">
        <BlurReveal className="mx-auto max-w-xl">
          <h2 className="font-serif text-4xl font-light uppercase leading-[1.08] text-[#303030] md:text-6xl">
            Rencanakan Musim Tanam Dengan Tenang
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-[#5C584F]">
            Periksa kesesuaian pH, elevasi, dan vegetasi lahan Anda atau hitung
            estimasi modal tanam sebelum turun ke sawah.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/analisis-lahan" className="btn-drs-primary">
              Analisis Lahan Sekarang
            </Link>
            <Link href="/kalkulator-biaya" className="btn-drs-dashed">
              Buka Kalkulator RAB
            </Link>
          </div>
        </BlurReveal>
      </section>
    </div>
  );
}
