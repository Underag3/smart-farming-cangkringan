# Panduan Demo & Pengujian Lapangan — TaniCerdas Cangkringan

Dokumen ini disiapkan untuk pendampingan oleh penyuluh pertanian (PPL) dan evaluasi oleh tim penguji Vinix7.

## Alur Demo 5 Menit

1. **Buka `/metodologi` (1 menit):**
   - Tunjukkan ringkasan audit dataset (`100` lahan, `108,7 ha`, `Regosol Vulkanik Merapi`).
   - Jelaskan mengapa prediksi hasil panen tidak diaktifkan ($R^2 < 0$ pada `ML_Dataset`) dan mengapa `Price_Data` tidak dipakai menghitung pendapatan.
   - Tunjukkan peningkatan clustering 4 fitur biofisik (`silhouette 0,2233`) vs 5 fitur (`0,1689`).

2. **Buka `/analisis-lahan` (1,5 menit):**
   - Tekan tombol **Isi Contoh: Lereng Atas (Kepuharjo)** lalu jalankan **Analisis Lahan Sekarang**.
   - Tunjukkan 3 lapis keluaran: Segmen Eksploratif `B`, Diagnosis Kesehatan Tanah (pH & C-organik), dan Skor Kesesuaian 6 Komoditas beserta tombol **Bagikan Ringkasan ke WhatsApp**.
   - Uji input ekstrem (mis. `pH = 99`) untuk memverifikasi penolakan validasi HTTP `422`, serta input luar sebaran (mis. `area_ha = 15`) untuk memverifikasi banner peringatan *Out-of-Distribution*.

3. **Buka `/kalkulator-biaya` (1 menit):**
   - Klik **Rinci RAB** dari hasil komoditas, atau pilih `Salak Pondoh` dengan luas `0,4 ha`.
   - Aktifkan simulasi titik impas dan tunjukkan pembanding resmi BPS/Bapanas (HPP GKP Rp 6.500/kg, harga gabah 2025 Rp 7.081/kg).

4. **Buka `/peta-kalurahan` (45 detik):**
   - Ketuk beberapa titik koordinat lahan pada peta SVG dan ganti mode warna antara Kalurahan vs Segmen ML.
   - Tunjukkan pola curah hujan 60 bulan dan catatan hama Wereng (12/30 baris) beserta disclaimer sampel tipis.

5. **Buka `/` — Tanya Asisten (45 detik):**
   - Klik 4–5 tombol pertanyaan cepat:
     1. Biaya tanam padi per hektar (`Rp 14.318.434`)
     2. Modal salak pondoh `0,4 ha` (`Rp 3.759.381`)
     3. Hama terbanyak & alasan tidak ada peringatan dini (`Wereng 12/30`)
     4. Input parsial (`elevasi 800 m, pH 5,8, NDVI 0,75`) -> Segmen `B` indikatif
     5. Kalurahan tadah hujan terbanyak (`Wukirsari`) & NDVI terendah (`Glagaharjo 0,621`)
   - Ajukan pertanyaan di luar topik (mis. resep masakan) untuk memastikan sistem menjawab tidak tahu secara jujur.
