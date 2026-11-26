---
sumber: Land_Data & GIS_Data — Model K-Means Biofisik (4 Fitur)
cakupan: Profil 3 segmen eksploratif lahan Cangkringan
---

# Profil Segmen Biofisik Lahan Cangkringan

Segmentasi lahan menggunakan algoritma K-Means (`k = 3`, `StandardScaler`, `random_state = 42`) pada **4 fitur biofisik murni**: elevasi (m), pH tanah, karbon organik (%), dan NDVI. Luas lahan (`area_ha`) dipisahkan untuk perhitungan RAB agar tidak mendistorsi kemiripan kondisi tanah dan vegetasi.

- **Skor Silhouette:** **0,2233** (meningkat dibanding model 5 fitur awal sebesar 0,1689).
- **Status Ilmiah:** Karena skor silhouette masih moderat, seluruh segmen bersifat **eksploratif** dan rekomendasinya adalah **panduan awal**, bukan keputusan agronomi mutlak.

## Tiga Segmen Lahan

### Segmen A — Zona Menengah-Netral (42 lahan)
- **Rata-rata profil:** Elevasi 654,17 m | pH 6,56 | Karbon organik 2,36% | NDVI 0,694.
- **Karakteristik:** Tanah paling mendekati netral di antara seluruh klaster dengan tutupan vegetasi sedang-rapat.
- **Rekomendasi awal:** Pertahankan pH netral melalui pemupukan berimbang, tambahkan kompos saat olah tanah jika C-organik di bawah 2,5%, dan manfaatkan untuk rotasi padi-palawija atau hortikultura (cabai/tomat) bila air irigasi mencukupi.

### Segmen B — Zona Lereng Atas Subur & Vegetasi Rapat (36 lahan)
- **Rata-rata profil:** Elevasi 763,89 m | pH 5,94 | Karbon organik 2,66% | NDVI 0,774.
- **Karakteristik:** Berada di dataran lebih tinggi dengan karbon organik dan kerapatan vegetasi tertinggi, tetapi pH cenderung agak asam.
- **Rekomendasi awal:** Lakukan pengapuran dolomit ringan bila menanam hortikultura sensitif asam (pH < 6,0), manfaatkan C-organik tinggi untuk Salak Pondoh atau hortikultura dataran menengah-atas, serta jaga konservasi lereng (terasering/mulsa).

### Segmen C — Zona Lereng Bawah Vegetasi Jarang (22 lahan)
- **Rata-rata profil:** Elevasi 553,27 m | pH 5,97 | Karbon organik 2,43% | NDVI 0,577.
- **Karakteristik:** Berada di elevasi lebih rendah dengan nilai NDVI terendah (tutupan hijau paling jarang) dan pH agak asam.
- **Rekomendasi awal:** Fokus pada pembenahan tanah dengan kompos matang/pupuk organik + probiotik hayati untuk menjaga kelembapan, pastikan tipe irigasi sebelum menanam padi (pertimbangkan jagung jika tadah hujan), dan terapkan tanaman penutup tanah/mulsa.
