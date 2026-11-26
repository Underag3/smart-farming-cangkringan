# PRD v2.0 — TaniCerdas Cangkringan

- **Versi:** 2.0 (Perombakan & Pengembangan Menyeluruh dari v1.0)
- **Tanggal:** 27 November 2026
- **Penyusun:** Mohammad Tyas Subianto — Divisi Python Machine Learning & AI Engineer
- **Program:** Studi Independen Vinix7 — Project Berdampak Kecamatan Cangkringan, Sleman, Yogyakarta
- **Repositori Target:** `smart-farming-cangkringan-ml`
- **Status Dokumen:** Dokumen hidup (*living specification*) — acuan arsitektur, desain produk, aturan data, dan rencana implementasi.

---

## 1. Ringkasan Eksekutif & Visi Produk

**TaniCerdas Cangkringan v2.0** adalah platform asisten agronomi berbasis AI (*mobile-first web application*) yang membantu petani, kelompok tani (Poktan), dan penyuluh pertanian di Kecamatan Cangkringan, Sleman untuk:

1. **Berkonsultasi budidaya & usaha tani lewat chat AI** yang menjawab singkat dalam Bahasa Indonesia menggunakan *Hybrid RAG + Tool-Calling* berbasis data terkurasi lokal dan acuan resmi (BPS/Bapanas/Kementan).
2. **Menganalisis kondisi biofisik lahan** menggunakan kombinasi mesin evaluasi agronomi deterministik (status pH, C-organik, elevasi, NDVI, irigasi) dan segmentasi ML eksploratif untuk menghasilkan skor kecocokan 6 komoditas unggulan serta rekomendasi perbaikan tanah/pupuk organik.
3. **Menghitung Rencana Anggaran Biaya (RAB) usaha tani proporsional** sesuai luas lahan aktual petani dan melihat simulasi harga titik impas (*break-even*) berbasis acuan produktivitas & harga riil BPS/Bapanas.
4. **Menjelajahi profil mikro-zonasi 5 kalurahan** (Umbulharjo, Argomulyo, Wukirsari, Glagaharjo, Kepuharjo), pola cuaca bulanan, dan catatan hama secara ringan tanpa dashboard analitik yang berat.

### Apa yang Berubah dari PRD v1.0?

PRD v1.0 memberikan fondasi kejujuran data yang kuat, tetapi terlalu defensif dan membatasi nilai produk. Perombakan v2.0 melakukan 6 peningkatan utama:

| Aspek | PRD v1.0 (Lama) | PRD v2.0 (Baru) |
|---|---|---|
| **Ketergantungan Prototipe** | Wajib memindahkan folder prototipe lama yang belum tersedia di workspace | **Clean-slate reproducible pipeline:** melatih dan mengekspor model secara deterministik langsung dari dataset Excel sumber |
| **Desain Clustering ML** | K-Means $k=3$ memasukkan `area_ha` (luas petak) sehingga `silhouette = 0,1689` dan tidak stabil lintas seed | Memisahkan `area_ha` ke kalkulator RAB; clustering biofisik murni 4 fitur (`elevation_m`, `soil_ph`, `organic_carbon`, `NDVI`) menaikkan `silhouette = 0,2233` (+32%), tetap dilabeli eksploratif + *OOD Guard* |
| **Nilai Keputusan Agronomi** | Hanya mengembalikan nomor segmen dan 3 teks statis | **Mesin Hibrida:** menggabungkan segmen ML eksploratif + skor kesesuaian 6 komoditas + diagnosis kesehatan tanah (pengapuran & pupuk organik/probiotik) |
| **Kalkulator Biaya** | Kartu statis biaya per 1 hektar saja | **RAB Proporsional** sesuai luas lahan petani (ha/$m^2$) + komponen benih/pupuk/pestisida/tenaga kerja + simulasi *break-even* berbasis acuan BPS/Bapanas |
| **Arsitektur Asisten AI** | Naive RAG berbasis Chroma saja; gagal menjawab pertanyaan hitungan atau input fitur parsial | **Hybrid RAG (BM25 + Semantic) + Tool-Calling Deterministik** + memori percakapan sesi + *offline deterministic fallback* |
| **Pemanfaatan Data Spasial & Cuaca** | Koordinat GIS, data cuaca 60 bulan, dan irigasi tidak dimanfaatkan secara visual | Halaman ringan **Peta & Profil 5 Kalurahan** untuk penyuluh + ringkasan pola curah hujan & hama (tanpa dashboard KPI berat) |

---

## 2. Pengguna, Kebutuhan Nyata & Konteks Lapangan

### 2.1 Persona Pengguna

1. **Petani & Pengurus Kelompok Tani (Pengguna Utama)**
   - **Konteks:** Menggunakan HP Android kelas menengah/bawah dengan koneksi 3G/4G tidak stabil di lereng Merapi.
   - **Kebutuhan:** Jawaban cepat tentang biaya tanam untuk luas lahan sendiri (sering di bawah 1 ha), rekomendasi perbaikan tanah/pupuk organik, penanganan hama wereng, dan cara membagikan ringkasan ke grup WhatsApp Poktan.
2. **Penyuluh Pertanian Lapangan (PPL) & Perangkat Kalurahan (Pengguna Kedua)**
   - **Konteks:** Mendampingi petani di 5 kalurahan (Umbulharjo, Argomulyo, Wukirsari, Glagaharjo, Kepuharjo) dan mitra lokal pengembang pupuk organik/probiotik.
   - **Kebutuhan:** Alat bantu visual ringan untuk membandingkan karakteristik tiap kalurahan (elevasi, NDVI, tipe irigasi), menjelaskan sifat rekomendasi awal secara edukatif, dan demonstrasi saat pelatihan/serah terima.
3. **Tim Penguji Vinix7 & Reviewer Akademik (Pengguna Evaluasi)**
   - **Konteks:** Menilai kualitas engineering ML/AI, keakuratan klaim ilmiah, reproduksibilitas kode, dan keamanan data.
   - **Kebutuhan:** Halaman khusus yang mendokumentasikan hasil audit dataset, alasan penolakan prediksi yield, perbandingan clustering, dan keterlacakan sumber angka.

### 2.2 Kendala Operasional yang Wajib Dipenuhi Desain

- **Bahasa:** 100% Bahasa Indonesia yang lugas, sopan, dan minim jargon statistik di layar utama petani.
- **Privasi (*Zero PII*):** Sistem tidak memerlukan login, tidak menyimpan nama, nomor HP, NIK/KTP, ataupun alamat rumah petani.
- **Ringan & Mudah Dibaca:** Ukuran huruf minimal `14px` (isi `16px`), tombol aksi minimal tinggi `48px`, mendukung *copy/share* ringkasan teks ke WhatsApp tanpa mengunduh file besar.

---

## 3. Tata Kelola Data & Prinsip Kejujuran Ilmiah (*Data Governance*)

Semua klaim dalam produk merujuk pada hasil audit langsung terhadap 9 sheet pada `Smart_Farming_Cangkringan_Sleman_2022_2026.xlsx`.

### 3.1 Ringkasan Audit Dataset Sumber

| Sheet | Baris | Temuan Audit Terverifikasi | Keputusan Produk |
|---|---|---|---|
| `Land_Data` | 100 | 100 lahan di 5 kalurahan; total `108,7 ha` (`0,21–2,00 ha`, mean `1,087 ha`); elevasi `451–899 m`; tanah `100%` Regosol Vulkanik Merapi; pH `5,54–6,80`; C-organik `1,51–3,48%`; irigasi: Teknis `35`, Tadah Hujan `33`, Semi Teknis `32`; koordinat riil di Kecamatan Cangkringan | **Dipakai** sebagai basis profil lahan, peta titik sampel, dan fitur clustering biofisik |
| `GIS_Data` | 100 | Koordinat identik dengan `Land_Data`; `NDVI` `0,459–0,887` (mean `0,697`); Kepuharjo tertinggi (`0,743`), Glagaharjo terendah (`0,621`); `land_cover` 100% `Agriculture` | **Dipakai** untuk zonasi vegetasi dan profil kalurahan |
| `Cost_Data` | 6 | Biaya/ha 6 komoditas; penjumlahan `seed + fertilizer + pesticide + labor` cocok persis (`selisih = Rp 0`) | **Dipakai** sebagai sumber utama kalkulator RAB dan RAG |
| `Price_Data` | 360 | Rata-rata harga semua komoditas berkisar `Rp 41.827–Rp 52.082/kg` (rentang `Rp 5.123–Rp 89.975/kg`), tidak realistis untuk gabah/jagung/salak | **Dilarang dipakai** menghitung pendapatan; diganti acuan resmi BPS/Bapanas |
| `Weather_Data` | 60 | Data bulanan 2022–2026; curah hujan mean `255,0 mm/bulan` (`95,6–430,7 mm`), suhu `23,0–27,9°C`, kelembapan `70–94%` | **Dipakai** sebagai konteks musim & kalender curah hujan di halaman kalurahan |
| `Pest_Disease_Data` | 30 | Sampel sangat kecil (`30` baris); Wereng dominan (`12` kejadian), Thrips (`5`), Ulat Grayak (`5`), Jamur Daun (`3`); ada `5` baris berlabel `Tidak Ada` (`4` ber-severity Medium/High dan `1` Low) | **Dipakai** sebatas informasi deskriptif di RAG & halaman kalurahan dengan catatan sampel tipis; **bukan** sistem *early warning* otomatis |
| `Planting_Data` & `Harvest_Data` | 480 | Tepat `96` tanam/tahun (2022–2026); luas tanam dan luas panen tidak cocok pada **477 dari 480 baris** (hanya `PL0259`, `PL0339`, `PL0374` yang sama; atau **476 baris** dengan toleransi selisih `> 0,01 ha`); varietas tetap per komoditas; yield seluruh komoditas nyaris seragam (`13,25–14,85 t/ha`, maks `64,64 t/ha`); Isolation Forest menandai 48 anomali | **Dipakai sebagai temuan audit** di halaman Metodologi, bukan sebagai klaim produktivitas lapangan |
| `ML_Dataset` | 300 | Hanya mencakup April 2022–Mei 2025; korelasi tiap fitur terhadap `yield_ton_ha` mendekati nol (`-0,115` s.d. `+0,139`); Linear Regression ($R^2 = -0,130$) dan Random Forest ($R^2 = -0,076$) lebih buruk dari baseline rata-rata | **Dilarang mengklaim prediksi hasil panen**; ditampilkan sebagai bukti transparansi evaluasi model |

### 3.2 Aturan Mutlak Kejujuran Produk

1. **Dilarang** menampilkan prediksi kuantitatif hasil panen (ton/ha) atau proyeksi laba dari `Price_Data`.
2. **Wajib** melabeli segmen K-Means sebagai **segmentasi eksploratif** beserta catatan bahwa rekomendasi bersifat **panduan awal**, bukan pengganti uji laboratorium tanah atau keputusan akhir PPL.
3. **Wajib** menyertakan sitasi singkat sumber data pada setiap angka yang ditampilkan di UI maupun jawaban chat AI.
4. **Dilarang** memasukkan file dataset Excel mentah, kunci API, atau kredensial rahasia ke dalam repositori Git atau image frontend.

---

## 4. Spesifikasi Fitur & Arsitektur Produk (4 Pilar Utama)

Produk terdiri dari **5 rute halaman** yang saling terhubung melalui navigasi bawah (*bottom tab bar*) di mobile dan *top bar* di desktop:

1. `/` — **Tanya Tani AI** (Halaman Utama: Asisten Chat Agronomi)
2. `/analisis-lahan` — **Cek & Diagnosis Lahan** (Hybrid ML + Rule-Based Agronomy)
3. `/kalkulator-biaya` — **Kalkulator RAB & Titik Impas** (Cost & Break-Even Planner)
4. `/peta-kalurahan` — **Peta Kalurahan, Cuaca & Hama** (Konteks Spasial Ringan)
5. `/metodologi` — **Audit Data, Model & Batasan** (Transparansi Ilmiah)

---

### Pilar 1: Mesin Analisis Lahan Hibrida (`/analisis-lahan`)

Menggantikan form K-Means v1 yang terlalu sempit dengan arsitektur evaluasi 3 lapis:

#### Input Pengguna
* **4 Parameter Biofisik (Wajib untuk ML + Diagnosis):**
  * `elevation_m` (angka, validasi `0–3000` m; rentang historis Cangkringan `451–899` m)
  * `soil_ph` (angka, validasi `0–14`; rentang historis `5,54–6,80`)
  * `organic_carbon` (angka `%`, validasi `0–20`; rentang historis `1,51–3,48%`)
  * `ndvi` (angka, validasi `-1` s.d. `1`; rentang historis `0,459–0,887`)
* **2 Parameter Konteks Usaha Tani (Opsional dengan nilai bawaan cerdas):**
  * `area_ha` (angka `> 0` s.d. `100` ha; default `1,0` ha — dipakai untuk skala rekomendasi & tautan langsung ke kalkulator RAB, **tidak** dimasukkan ke fitur clustering)
  * `irrigation` (`"Teknis" | "Semi Teknis" | "Tadah Hujan"`; opsional untuk menyaring kelayakan komoditas air tinggi seperti Padi)
* **Preset Cepat:** Tombol 1-klik *"Isi Contoh Lahan"* untuk masing-masing profil kalurahan/segmen agar penguji dan petani bisa mencoba tanpa mengetik dari nol.

#### Output 3 Lapis

1. **Lapis 1 — Segmen Biofisik Eksploratif (ML K-Means):**
   - Model dilatih menggunakan `StandardScaler` + `KMeans(n_clusters=3, random_state=42, n_init=20)` hanya pada 4 fitur biofisik (`elevation_m`, `soil_ph`, `organic_carbon`, `NDVI`), yang menghasilkan `silhouette = 0,2233` dan distribusi ukuran `42 / 36 / 22`:
     - **Segmen A — Zona Menengah–Netral (`42` lahan):** Elevasi ~`654 m`, pH ~`6,56`, C-organik ~`2,36%`, NDVI ~`0,694`.
     - **Segmen B — Zona Lereng Atas Subur Vegetasi Rapat (`36` lahan):** Elevasi ~`764 m`, pH ~`5,94`, C-organik ~`2,66%`, NDVI ~`0,774`.
     - **Segmen C — Zona Lereng Bawah Vegetasi Jarang (`22` lahan):** Elevasi ~`553 m`, pH ~`5,97`, C-organik ~`2,43%`, NDVI ~`0,577`.
   - **Pengaman *Out-of-Distribution (OOD)*:** Jika nilai input berada di luar rentang observasi dataset Cangkringan (mis. elevasi `< 451` atau `> 899`, pH `< 5,54` atau `> 6,80`, C-organik `< 1,51` atau `> 3,48`, NDVI `< 0,459` atau `> 0,887`), API tetap menghitung hasil tetapi mengembalikan `ood_warnings` agar UI menampilkan peringatan kuning bahwa lahan berada di luar karakteristik sampel Cangkringan.
   - **Label Deterministik saat Training:** Skrip training wajib memetakan ID cluster berdasarkan urutan sifat centroid (bukan angka raw label acak K-Means) sehingga label selalu konsisten di setiap rebuild.

2. **Lapis 2 — Diagnosis Kesehatan Tanah & Rekomendasi Perbaikan (Rule-Based Agronomi):**
   - **Status pH:** Klasifikasi (Sangat Asam `< 5,5`, Agak Asam `5,5–6,4`, Netral Optimal `6,5–7,3`, Basa `> 7,3`) + anjuran pengapuran (dolomit/kapur pertanian) bila pH `< 6,0`.
   - **Status C-Organik:** Klasifikasi (Rendah `< 2,0%`, Sedang `2,0–3,0%`, Tinggi `> 3,0%`) + anjuran pembenah tanah organik (kompos/pupuk kandang/probiotik hayati) bila C-organik `< 2,5%`.
   - **Status Vegetasi (NDVI) & Elevasi:** Penjelasan indikatif kondisi kanopi tanaman/lahan terbuka serta strategi konservasi lereng untuk elevasi `> 700 m`.

3. **Lapis 3 — Peringkat Kesesuaian 6 Komoditas Cangkringan (Rule-Based Scoring):**
   - Menilai kecocokan komoditas (`Salak Pondoh`, `Padi`, `Jagung`, `Cabai Merah`, `Tomat`, `Bawang Merah`) berdasarkan kesesuaian elevasi, pH, NDVI/tutupan, dan tipe irigasi (mis. Padi diberi penalti kecocokan jika irigasi `Tadah Hujan` dan tidak disarankan di zona kekeringan; Salak Pondoh cocok pada elevasi `450–800 m` dan pH agak asam `5,5–6,5`).
   - Setiap kartu menyertakan **1-klik "Hitung RAB Komoditas Ini"** (mengarah ke `/kalkulator-biaya` dengan luas lahan & komoditas terisi otomatis) dan **"Salin Ringkasan ke WhatsApp"**.

---

### Pilar 2: Asisten AI Agronomi (*Hybrid RAG + Tool-Calling*, `/`)

Halaman utama langsung membuka antarmuka chat yang ringan dan ramah mobile.

#### Arsitektur Penalaran AI (3 Tahap)
1. **Intent & Tool Routing (Tool-Calling / Function Calling):**
   - `calculate_farming_cost(commodity, area_ha)` — menghitung RAB eksak dari `Cost_Data` agar LLM **tidak pernah melakukan aritmatika sendiri**.
   - `analyze_land_partial(elevation_m?, soil_ph?, organic_carbon?, ndvi?, irrigation?)` — **menyelesaikan celah kritis v1:** ketika pengguna bertanya di chat dengan parameter tidak lengkap (mis. *"Lahan saya elevasi 800 m, pH 5,8, NDVI 0,75, masuk segmen apa?"*), tool menghitung kecenderungan jarak terdekat hanya pada dimensi fitur yang tersedia, menampilkan kecocokan indikatifnya, dan menyebutkan parameter apa yang masih kurang untuk analisis penuh di `/analisis-lahan`.
   - `get_region_or_pest_summary(desa?, commodity?)` — menarik fakta terstruktur kalurahan, irigasi, cuaca bulanan, atau catatan hama.
2. **Hybrid Document Retrieval (`packages/rag`):**
   - Menggabungkan **BM25 lexical search** (kuat untuk istilah spesifik seperti `IR64`, `Salak Pondoh`, `Wereng`, `Kepuharjo`, `Rp 14.318.434`) dengan **Semantic Vector Search** menggunakan bobot *Reciprocal Rank Fusion (RRF)*.
   - **Desain Hemat Memori:** Untuk korpus 6 dokumen Markdown terkurasi (`< 50` chunk total), indeks dibangun saat build-time/startup secara ringan (tanpa memaksa memuat model ONNX lokal ratusan MB di container 512 MB RAM jika menggunakan API embeddings atau TF-IDF/BM25+lightweight index).
3. **Strict Grounding, Multi-Turn Context & Offline Fallback:**
   - **Memori Sesi:** Menyimpan riwayat hingga 4 giliran pesan terakhir di sisi klien/sesi agar pertanyaan lanjutan (mis. *"Kalau lahan saya cuma 0,4 hektar?"*) tetap tersambung tanpa menyimpan data ke server.
   - **Aturan Sitasi & Penolakan:** LLM diinstruksikan menjawab maksimal 3–5 kalimat/poin singkat, mencantumkan sumber (`[Cost Data]`, `[Profil Segmen]`, `[BPS 2025]`, `[Panduan Kementan]`), dan menjawab jujur *"Data tersebut belum tersedia di basis pengetahuan TaniCerdas, silakan konsultasikan dengan penyuluh kalurahan"* untuk topik di luar korpus.
   - **Offline Deterministic Fallback:** Jika LLM API timeout, kuota habis, atau key belum disetel, backend **tidak mengembalikan HTTP 500**, melainkan tetap menjalankan Tool-Calling + Retriever untuk menampilkan ringkasan potongan pengetahuan terstruktur dengan label `mode: "fallback"`.
   - **LLM Gateway Netral Provider:** Konfigurasi sepenuhnya lewat `LLM_BASE_URL`, `LLM_API_KEY`, dan `LLM_MODEL` (kompatibel dengan OpenAI SDK: mendukung DeepSeek, Groq, OpenRouter, Gemini OpenAI-compat, maupun Ollama lokal).

#### UX Halaman Utama Chat
- 4–5 tombol pertanyaan cepat (*prompt chips*) di atas kotak input yang mencakup semua skenario uji kunci.
- Setiap gelembung jawaban asisten menampilkan: teks jawaban terformat, badge sumber singkat, indikator jika memakai mode fallback, dan tombol umpan balik cepat (👍 / 👎 anonim).

---

### Pilar 3: Kalkulator RAB & Titik Impas (`/kalkulator-biaya`)

Mengubah halaman biaya statis v1 menjadi alat perencanaan finansial praktis yang tetap jujur:

1. **Pemilih Komoditas & Varietas Lokal:**
   - Padi (`IR64`), Jagung (`Bisi 18`), Cabai Merah (`Keriting Lokal`), Tomat (`Servo`), Bawang Merah (`Tajuk`), Salak Pondoh (`Pondoh Sleman`).
2. **Input Luas Lahan Fleksibel:**
   - Input dalam **Hektar (`ha`)** atau **$m^2$** (otomatis terkonversi, mis. `2.500 m² = 0,25 ha`).
3. **Rincian RAB Proporsional (`Cost_Data`):**
   - Menghitung proporsi biaya **Benih**, **Pupuk**, **Pestisida**, dan **Tenaga Kerja** secara real-time, lengkap dengan persentase porsi tiap pos (mis. Tenaga Kerja pada Padi menyerap `51,9%` total biaya per ha).
4. **Simulasi Harga Titik Impas (*Break-Even Price Calculator*):**
   - Alih-alih memakai `Price_Data` yang rusak, pengguna dapat memasukkan **asumsi hasil panen mereka sendiri** (atau memilih preset acuan BPS padi `4,635 ton/ha`), lalu sistem menghitung:
     - **Harga Impas (BEP):** $\text{Total Biaya} \div \text{Estimasi Hasil (kg)}$
     - **Pembanding Acuan Resmi:** Menampilkan perbandingan terhadap HPP GKP (`Rp 6.500/kg`), rata-rata harga gabah 2025 (`Rp 7.081/kg`), atau HPP Jagung (`Rp 5.500/kg`) beserta catatan sumber BPS/Bapanas.
5. **Ekspor Ringkasan:** Tombol *"Salin RAB ke WhatsApp"* dalam format teks rapi.

---

### Pilar 4: Peta Kalurahan, Cuaca & Hama (`/peta-kalurahan`) + Audit Metodologi (`/metodologi`)

#### `/peta-kalurahan` — Konteks Agro-Ekologi Wilayah
* **Peta Ringan Interaktif (Lazy-Loaded Leaflet / Geo-Scatter):** Memetakan 100 titik sampel lahan (`latitude` `-7,679` s.d. `-7,600`, `longitude` `110,402` s.d. `110,478`) yang diwarnai berdasarkan kalurahan atau segmen eksploratif. Jika koneksi sangat lambat, tersedia mode daftar/tabel ringkas sebagai *progressive enhancement*.
* **Kartu Profil 5 Kalurahan:** Menampilkan jumlah lahan sampel, rata-rata elevasi, NDVI rata-rata (menyoroti Kepuharjo tertinggi `0,743` vs Glagaharjo terendah `0,621`), dan komposisi irigasi (mis. Wukirsari 50% Tadah Hujan vs Argomulyo didominasi Teknis).
* **Ringkasan Iklim 60 Bulan & Catatan Hama:** Menampilkan grafik batang sangat ringan (atau CSS bar chart tanpa library berat) curah hujan rata-rata bulanan (`95,6–430,7 mm`, paling kering Juli `164,1 mm`, puncak hujan April/November `~291 mm`) dan frekuensi catatan hama (`Wereng 12/30` kasus) disertai disclaimer tegas bahwa sampel hama hanya 30 baris.

#### `/metodologi` — Halaman Transparansi & Kejujuran Data
* Penjelasan 4 bagian singkat dan jujur:
  1. Sumber data (`Smart_Farming_Cangkringan_Sleman_2022_2026.xlsx`, 9 sheet, periode 2022–2026) & karakteristik dataset simulasi/latihan Vinix7.
  2. Mengapa prediksi hasil panen tidak diaktifkan (tabel metrik $R^2$ negatif pada `ML_Dataset`) dan mengapa `Price_Data` tidak dipakai (pembanding BPS/Bapanas).
  3. Mengapa segmentasi K-Means 4 fitur biofisik (`silhouette = 0,2233`) lebih valid dibanding 5 fitur (`0,1689`) dan mengapa tetap berstatus eksploratif.
  4. Ringkasan temuan audit integritas data (ketidakcocokan luas tanam-panen `477/480` baris, anomali panen Isolation Forest `48/480` baris, dan inkonsistensi `4` baris `Tidak Ada` hama ber-severity Medium/High).

---

## 5. Arsitektur Sistem & Tech Stack

```
┌───────────────────────────────────────────────────────────────────┐
│                    Pengguna (Android / Desktop)                   │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │ HTTPS (JSON / REST)
┌─────────────────────────────────▼─────────────────────────────────┐
│             apps/web — Next.js App Router (TypeScript)            │
│   Tailwind CSS + shadcn/ui + Mobile Bottom Nav + WA Share Helper  │
│   Rute: / | /analisis-lahan | /kalkulator-biaya | /peta-kalurahan │
│         /metodologi                                               │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
┌─────────────────────────────────▼─────────────────────────────────┐
│               apps/api — FastAPI + Pydantic v2 (Python)           │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ packages/agronomy   │  │ packages/rag     │  │ SQLite Store │  │
│  │ - KMeans 4-fitur    │  │ - Hybrid (BM25 + │  │ - Anon Chat  │  │
│  │ - OOD Guard         │  │   Vector RRF)    │  │   Logs       │  │
│  │ - Suitability Rules │  │ - Tool-Calling   │  │ - Thumbs     │  │
│  │ - RAB & BEP Calc    │  │ - Fallback       │  │   Feedback   │  │
│  └─────────────────────┘  └────────┬─────────┘  └──────────────┘  │
└────────────────────────────────────┼──────────────────────────────┘
                                     │ OpenAI-Compatible API
                        ┌────────────▼────────────┐
                        │   External LLM Gateway  │
                        │ (Base URL & Model via   │
                        │  Environment Variables) │
                        └─────────────────────────┘
```

### Rincian Tech Stack & Catatan Lingkungan

- **Backend Runtime:** Python `3.12` direkomendasikan di Dockerfile & virtualenv produksi (catatan: host lokal memiliki Python `3.14.3` — hindari ketergantungan paket dengan wheel C++ berat seperti `onnxruntime` lokal di Python 3.14 agar instalasi & CI mulus).
- **API & ML:** `fastapi`, `uvicorn[standard]`, `pydantic>=2`, `scikit-learn`, `joblib`, `pandas`, `numpy`, `openpyxl` (khusus skrip preprocessing/training offline di `ml/`).
- **RAG & LLM Client:** `openai` (SDK standar untuk endpoint OpenAI-compatible), `rank-bm25`, vektor index ringan (`numpy` cosine embeddings via API atau `chromadb` jika memakai Python 3.12 Docker dengan pre-built index).
- **Frontend:** Next.js 14/15 App Router, TypeScript, Tailwind CSS, `shadcn/ui`, `lucide-react` (ikon ringan), `leaflet` (opsional *dynamic import* khusus halaman `/peta-kalurahan` agar tidak membebani bundle awal `/`).
- **Penyimpanan:** Artefak model (`model_segmentasi.joblib`, `scaler_segmentasi.joblib`, `profil_segmen.json`), file JSON turunan ringkas (`data_ringkas.json` untuk kalurahan/cuaca/hama/biaya tanpa menaruh file Excel mentah di repo!), dan SQLite untuk telemetry anonim (dengan kesadaran bahwa filesystem container free-tier bersifat ephemeral).

---

## 6. Spesifikasi Kontrak API (`/api/v1`)

Seluruh endpoint berada di bawah prefix `/api/v1` (ditambah `GET /health` di root untuk health check container).

### 6.1 `GET /api/v1/health`
Mengembalikan status server, status model ML ter-load, jumlah dokumen RAG terindeks, dan apakah kunci LLM aktif atau dalam mode fallback.

```json
{
  "status": "ok",
  "ml_model_loaded": true,
  "rag_chunks_loaded": 28,
  "llm_configured": true,
  "model_silhouette": 0.2233
}
```

### 6.2 `POST /api/v1/land/analyze`
**Request:**
```json
{
  "elevation_m": 760,
  "soil_ph": 5.9,
  "organic_carbon": 2.6,
  "ndvi": 0.77,
  "area_ha": 0.8,
  "irrigation": "Semi Teknis"
}
```
*Validasi Pydantic:* `elevation_m` (`0..3000`), `soil_ph` (`0..14`), `organic_carbon` (`0..20`), `ndvi` (`-1..1`), `area_ha` (`>0..100`, default `1.0`), `irrigation` (`"Teknis" | "Semi Teknis" | "Tadah Hujan" | null`). Input tidak valid otomatis ditolak dengan HTTP `422`.

**Response (`200 OK`):**
```json
{
  "exploratory_segment": {
    "id": "B",
    "code": 1,
    "name": "Zona Lereng Atas Subur & Vegetasi Rapat",
    "disclaimer": "Segmentasi bersifat eksploratif (silhouette 0,2233), bukan batas klasifikasi mutlak.",
    "nearest_centroid": {
      "elevation_m": 763.89,
      "soil_ph": 5.94,
      "organic_carbon": 2.66,
      "ndvi": 0.774
    },
    "standardized_distance": 0.19
  },
  "ood_warnings": [],
  "soil_diagnosis": [
    {
      "parameter": "soil_ph",
      "status": "Agak Asam",
      "recommendation": "Pertimbangkan pengapuran dolomit ringan sebelum tanam untuk komoditas non-toleran asam."
    },
    {
      "parameter": "organic_carbon",
      "status": "Sedang–Baik",
      "recommendation": "Pertahankan C-organik di atas 2,5% dengan penambahan kompos/pupuk organik saat olah tanah."
    }
  ],
  "commodity_suitability": [
    {
      "commodity": "Salak Pondoh",
      "variety": "Pondoh Sleman",
      "score": 92,
      "tier": "Sangat Cocok",
      "reasons": ["Elevasi lereng atas sesuai", "Toleran tanah agak asam (pH 5,9)", "Tutupan vegetasi tinggi"],
      "estimated_cost_for_area": 7518763
    }
  ],
  "whatsapp_summary": "..."
}
```

### 6.3 `POST /api/v1/cost/estimate`
**Request:**
```json
{
  "commodity": "Padi",
  "area_ha": 0.5,
  "target_yield_ton_per_ha": 4.635
}
```
**Response (`200 OK`):** Mengembalikan `variety`, `area_ha`, `cost_per_ha` (`14318434`), `scaled_cost` (`total`, `seed`, `fertilizer`, `pesticide`, `labor`, serta persentase komponen), `break_even_price_per_kg` (`6178`), dan `official_benchmarks` (HPP GKP `6500`, rata-rata harga gabah 2025 `7081`, sumber BPS/Bapanas).

### 6.4 `GET /api/v1/regions`
Mengembalikan ringkasan agregat 5 kalurahan (tanpa data mentah Excel), daftar 100 titik sampel teranonimasi (`id`, `desa`, `lat`, `lon`, `elevation_m`, `ndvi`, `irrigation`, `exploratory_segment`), ringkasan cuaca bulanan 12 bulan (`Weather_Data`), dan rekap hama (`Pest_Disease_Data` beserta disclaimer 30 baris).

### 6.5 `POST /api/v1/chat`
**Request:**
```json
{
  "question": "Lahan saya elevasi 800 m, pH 5,8, NDVI 0,75, masuk segmen apa?",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "land_context": null
}
```
**Response (`200 OK`):**
```json
{
  "message_id": "msg_01J...",
  "answer": "Berdasarkan 3 angka yang diberikan (elevasi 800 m, pH 5,8, NDVI 0,75), lahan Anda paling mendekati Segmen B (Zona Lereng Atas Subur & Vegetasi Rapat)... Untuk analisis penuh, lengkapi C-organik di halaman Cek Lahan.",
  "citations": [
    {"source": "analyze_land_partial", "detail": "Profil Segmen Biofisik K-Means (4 fitur)"},
    {"source": "segmen.md", "detail": "Karakteristik zona elevasi tinggi"}
  ],
  "tools_used": ["analyze_land_partial"],
  "retrieved_chunks": ["segmen.md#zona-b"],
  "mode": "llm"
}
```

### 6.6 `POST /api/v1/feedback`
Menerima `message_id`, `rating` (`1` atau `-1`), dan `comment` opsional (maks 300 karakter) untuk evaluasi kualitas jawaban tanpa identitas pengguna.

---

## 7. Struktur Repositori Target

```text
smart-farming-cangkringan-ml/
├── README.md
├── .gitignore                        # Mengecualikan .env, *.xlsx, *.db, node_modules, .venv
├── .env.example
├── docker-compose.yml
├── docs/
│   ├── PRD_TaniCerdas_Cangkringan_v2.md
│   ├── panduan-demo-penguji.md
│   └── arsitektur-dan-audit-data.md
├── ml/                               # Offline training & data audit (tidak ikut runtime production)
│   ├── audit_dataset.ipynb
│   ├── evaluasi_yield_dan_clustering.ipynb
│   ├── train_and_export.py           # Reproduksi deterministik model + data_ringkas.json dari Excel
│   └── verify_artifacts.py
├── packages/
│   ├── agronomy/                     # Shared pure-Python logic: rules kesesuaian, OOD guard, kalkulator RAB
│   │   ├── suitability.py
│   │   ├── cost_calculator.py
│   │   └── land_analyzer.py
│   └── rag/                          # Knowledge base terkurasi + hybrid retriever + tool registry
│       ├── knowledge_base/
│       │   ├── biaya.md
│       │   ├── segmen.md
│       │   ├── kalurahan.md
│       │   ├── hama_dan_cuaca.md
│       │   ├── harga_acuan_bps.md
│       │   └── panduan_budidaya.md
│       ├── retriever.py
│       ├── tools.py
│       └── chat_service.py
├── apps/
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   ├── schemas.py
│   │   ├── routers/
│   │   │   ├── land.py
│   │   │   ├── cost.py
│   │   │   ├── regions.py
│   │   │   └── chat.py
│   │   ├── artifacts/                # Output terverifikasi dari ml/train_and_export.py
│   │   │   ├── model_segmentasi.joblib
│   │   │   ├── scaler_segmentasi.joblib
│   │   │   ├── profil_segmen.json
│   │   │   └── data_ringkas.json
│   │   └── storage/
│   │       └── telemetry.py          # SQLite anonim
│   └── web/                          # Next.js App Router + TypeScript + Tailwind + shadcn/ui
│       ├── Dockerfile
│       ├── package.json
│       └── src/
│           ├── app/
│           │   ├── page.tsx                  # / (Tanya Tani AI)
│           │   ├── analisis-lahan/page.tsx
│           │   ├── kalkulator-biaya/page.tsx
│           │   ├── peta-kalurahan/page.tsx
│           │   └── metodologi/page.tsx
│           ├── components/
│           └── lib/
│               ├── api.ts
│               ├── types.ts
│               └── whatsapp.ts
└── tests/
    ├── test_agronomy.py
    ├── test_api_contracts.py
    ├── test_rag_eval.py
    └── golden_questions.json
```

---

## 8. Design System & Pengalaman Pengguna (Mobile-First)

* **Prinsip Utama:** Satu tugas utama per layar, kecepatan muat tinggi pada jaringan lambat, keterbacaan di luar ruangan (kontras tinggi di bawah sinar matahari).
* **Palet Warna:**
  * Primary Leaf Green: `#2E7D32` (aksi utama, tab aktif)
  * Deep Forest Green: `#1B5E20` (hover & header aksen)
  * Canvas Background: `#F7F9F4`
  * Surface Card: `#FFFFFF` (border `#DDE5D8`)
  * Text Primary / Secondary: `#1C2B1A` / `#5A6B57`
  * Soil Earth Accent: `#8D6E63`
  * Warning / Guardrail Banner: teks `#92400E` di latar `#FEF3C7`
  * Error Input: `#B91C1C` (khusus validasi form gagal)
* **Tipografi:** `Plus Jakarta Sans` (fallback `Inter`, `system-ui`), judul halaman `22–24px` bold, judul kartu `18px` bold, teks isi `16px` (`line-height: 1.6`), metadata/sumber minimal `14px`.
* **Navigasi Mobile:** *Sticky bottom navigation bar* 5 ikon + label jelas (`Chat`, `Cek Lahan`, `Biaya`, `Kalurahan`, `Data`) dengan area sentuh minimal `48x48px`.

---

## 9. Basis Pengetahuan RAG & Kurasi Konten

Setiap file di `packages/rag/knowledge_base/` memiliki header metadata (`sumber`, `tanggal_verifikasi`, `cakupan`) dan maksimal ~600–900 kata agar retrieval presisi:

1. `biaya.md` — Rincian 4 komponen biaya per ha dan varietas lokal 6 komoditas dari `Cost_Data`.
2. `segmen.md` — Profil centroid, rentang fitur, dan panduan interpretasi Segmen A, B, C (4 fitur biofisik) beserta status eksploratifnya.
3. `kalurahan.md` — Sebaran 100 lahan, elevasi, NDVI, dan komposisi irigasi pada 5 kalurahan Cangkringan.
4. `hama_dan_cuaca.md` — Pola curah hujan 60 bulan (`Weather_Data`), suhu/kelembapan, dominasi Wereng (`12/30` baris), dan catatan keterbatasan sampel hama.
5. `harga_acuan_bps.md` — Harga gabah rata-rata 2025 (`Rp 7.081/kg`), HPP GKP (`Rp 6.500/kg`), HPP jagung (`Rp 5.500/kg`), produktivitas padi riil (`4,635 t/ha`), serta penjelasan larangan pemakaian `Price_Data`.
6. `panduan_budidaya.md` — **Wajib dikurasi dari sumber resmi** (Kementan / BSIP / BPTP Yogyakarta / Dinas Pertanian Sleman) meliputi panduan pH tanah & pengapuran, peran bahan organik/probiotik pada Regosol Merapi, serta pengendalian terpadu Wereng. *Tidak boleh berisi angka budidaya tanpa sitasi sumber asli.*

---

## 10. Pengujian, Kriteria Evaluasi & Definisi Selesai

### 10.1 Lapisan Pengujian Otomatis (`pytest` + Eval)
1. **Unit Test Model & Agronomi (`test_agronomy.py`):**
   - Ketiga centroid segmen A, B, C kembali ke segmennya masing-masing.
   - Uji *OOD Guard* aktif ketika input di luar rentang historis (`area_ha = 15`, `elevation_m = 1500`, `soil_ph = 4.2`).
   - Kalkulator RAB menghasilkan jumlah tepat (`seed + fertilizer + pesticide + labor = total`) untuk luas `0,25 ha`, `1,0 ha`, dan `2,0 ha`.
2. **API Contract Test (`test_api_contracts.py`):**
   - `POST /api/v1/land/analyze` menolak `soil_ph = 99` atau `ndvi = 1,5` dengan HTTP `422`.
   - `POST /api/v1/chat` tetap mengembalikan HTTP `200` dengan `mode = "fallback"` saat `LLM_API_KEY` kosong atau upstream LLM disimulasikan gagal.
3. **RAG Grounding & Tool-Calling Suite (`test_rag_eval.py`):** Minimal 10 pertanyaan uji wajib lulus (`>= 90%`):
   - Q1: *"Berapa biaya tanam padi per hektar dan rinciannya?"* (`calculate_farming_cost`)
   - Q2: *"Kalau lahan saya cuma 0,4 hektar, berapa perkiraan modal tanam salak pondoh?"* (skala luas `0,4 × 9.398.454`)
   - Q3: *"Hama apa yang paling sering tercatat di Cangkringan, dan apakah datanya cukup untuk peringatan dini?"* (Wereng `12/30` + penolakan klaim early warning)
   - Q4: *"Lahan saya elevasi 800 m, pH 5,8, NDVI 0,75, masuk segmen apa?"* (`analyze_land_partial` — memberi analisis indikatif + menyebut C-organik belum diisi)
   - Q5: *"Kalurahan mana yang paling banyak irigasi tadah hujan dan mana yang NDVI-nya paling rendah?"* (Wukirsari 9/18 tadah hujan; Glagaharjo NDVI `0,621`)
   - Q6: *"Berapa perkiraan untung/pendapatan panen cabai per hektar dari data Vinix?"* (**Wajib menolak menghitung dari `Price_Data`**)
   - Q7: *"Prediksikan hasil panen jagung saya bulan depan kalau curah hujan 250 mm."* (**Wajib menolak memprediksi yield** dan menjelaskan alasan $R^2 < 0$)
   - Q8: *"Siapa pemenang Pilpres atau resep masakan soto?"* (**Wajib menjawab tidak tahu / di luar cakupan**)
   - Q9: *"Bagaimana cara mengatasi tanah dengan pH di bawah 6,0 dan C-organik rendah?"* (sitasi `panduan_budidaya.md`)
   - Q10: Pertanyaan lanjutan multi-turn (*"Kalau diganti bawang merah untuk luas yang sama?"*).

### 10.2 Kriteria Selesai (*Definition of Done*)
- [ ] Seluruh artefak ML (`model_segmentasi.joblib`, `scaler_segmentasi.joblib`, `profil_segmen.json`, `data_ringkas.json`) dapat direproduksi ulang 1-perintah dari Excel sumber tanpa menaruh `.xlsx` di repo Git.
- [ ] Seluruh test suite (`pytest`) dan evaluasi 10 skenario chat lulus.
- [ ] Mobile viewport (`360×800`) diuji tanpa horizontal scroll, ukuran font terbaca (`>= 14px`), tombol `>= 48px`, dan fitur salin WhatsApp berjalan.
- [ ] Tidak ada API key, `.env`, atau file `.xlsx` di riwayat commit Git.
- [ ] `README.md` memuat panduan setup lokal, arsitektur, hasil audit data, dan panduan deployment.

---

## 11. Roadmap Implementasi Bertahap

| Fase | Lingkup Pekerjaan | Output & Gerbang Lolos |
|---|---|---|
| **Fase 0 — Fondasi & Pipeline ML** | Inisialisasi struktur monorepo, `.gitignore`, `.env.example`; tulis `ml/train_and_export.py` & notebook audit; ekspor model 4-fitur + `data_ringkas.json` | Verifikasi centroid, `silhouette = 0,2233`, dan checksum `Cost_Data` cocok 100% |
| **Fase 1 — Core API & Mesin Agronomi** | Implementasi `packages/agronomy`, `apps/api` (`/health`, `/land/analyze`, `/cost/estimate`, `/regions`), validasi Pydantic & OOD Guard | Semua unit test & API contract test (`200` / `422`) hijau |
| **Fase 2 — Hybrid RAG & Tool-Calling** | Kurasi 6 dokumen pengetahuan (`panduan_budidaya.md` bersumber resmi), bangun retriever BM25+Vector, tool-calling, dan deterministic fallback | Lulus minimal 9/10 skenario `golden_questions.json` + uji fallback offline |
| **Fase 3 — Web App Mobile-First** | Bangun 5 halaman Next.js + shadcn/ui, navigasi bawah mobile, peta kalurahan lazy-loaded, kalkulator RAB+BEP, dan tombol bagikan WhatsApp | Uji integrasi end-to-end di viewport HP (`360px`) & desktop |
| **Fase 4 — Hardening, Docker & Deployment** | `Dockerfile` backend (Python 3.12) & frontend, `docker-compose.yml`, penyusunan `README.md`, audit keamanan repo, deploy demo | Live URL dapat diakses dari HP dan siap didemonstrasikan; opsional sambungkan Bot Telegram ke `/api/v1/chat` |

---

## 12. Lampiran Angka Terverifikasi (Sumber Tunggal Kebenaran)

Angka di bawah ini diverifikasi langsung dari `Smart_Farming_Cangkringan_Sleman_2022_2026.xlsx`:

### A. Ringkasan Lahan, GIS & Kalurahan (`Land_Data` + `GIS_Data`)
- **Total Lahan & Luas:** `100` lahan, total `108,7 ha` (rentang `0,21–2,00 ha`, rata-rata `1,087 ha`)
- **Elevasi & Tanah:** `451–899 m` (rata-rata `671,47 m`), `100%` `Regosol Vulkanik Merapi`
- **Kimia Tanah & Vegetasi:** pH `5,54–6,80` (rata-rata `6,207`), C-organik `1,51–3,48%` (rata-rata `2,487%`), NDVI `0,459–0,887` (rata-rata `0,697`)
- **Koordinat Wilayah:** Latitude `-7,679267` s.d. `-7,600359`, Longitude `110,402157` s.d. `110,478311`
- **Sebaran Kalurahan & Irigasi:**
  - **Umbulharjo:** `26` lahan | Elevasi mean `646,7 m` | NDVI mean `0,695` | Irigasi: Teknis `7`, Semi Teknis `10`, Tadah Hujan `9`
  - **Argomulyo:** `24` lahan | Elevasi mean `678,9 m` | NDVI mean `0,714` | Irigasi: Teknis `11`, Semi Teknis `7`, Tadah Hujan `6`
  - **Wukirsari:** `18` lahan | Elevasi mean `694,8 m` | NDVI mean `0,710` | Irigasi: Teknis `6`, Semi Teknis `3`, Tadah Hujan `9`
  - **Glagaharjo:** `17` lahan | Elevasi mean `649,5 m` | NDVI mean `0,621` | Irigasi: Teknis `6`, Semi Teknis `6`, Tadah Hujan `5`
  - **Kepuharjo:** `15` lahan | Elevasi mean `699,5 m` | NDVI mean `0,743` | Irigasi: Teknis `5`, Semi Teknis `6`, Tadah Hujan `4`

### B. Rincian Biaya Usaha Tani per Hektar (`Cost_Data` & Varietas Lokal)

| Komoditas | Varietas | Benih (Rp) | Pupuk (Rp) | Pestisida (Rp) | Tenaga Kerja (Rp) | Total / Ha (Rp) |
|---|---|---:|---:|---:|---:|---:|
| **Padi** | IR64 | 1.163.952 | 5.063.794 | 666.202 | 7.424.486 | **14.318.434** |
| **Jagung** | Bisi 18 | 811.213 | 4.229.002 | 868.146 | 5.100.856 | **11.009.217** |
| **Bawang Merah** | Tajuk | 635.767 | 2.502.652 | 1.246.833 | 5.925.394 | **10.310.646** |
| **Cabai Merah** | Keriting Lokal | 1.270.508 | 2.936.853 | 753.650 | 5.316.299 | **10.277.310** |
| **Tomat** | Servo | 537.026 | 2.892.135 | 891.714 | 5.531.939 | **9.852.814** |
| **Salak Pondoh** | Pondoh Sleman | 927.861 | 3.584.106 | 1.376.460 | 3.510.027 | **9.398.454** |

### C. Acuan Pembanding Resmi (BPS & Badan Pangan Nasional)
- **Rata-rata harga gabah 2025:** `Rp 7.081 / kg`
- **HPP Gabah Kering Panen (GKP):** `Rp 6.500 / kg`
- **HPP Jagung:** `Rp 5.500 / kg`
- **Produktivitas padi riil:** `4,635 ton / ha`
