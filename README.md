# TaniCerdas Cangkringan

Platform konsultasi budidaya, analisis kesesuaian lahan hibrida, kalkulator RAB usaha tani, dan eksplorasi mikro-zonasi untuk petani dan penyuluh di Kecamatan Cangkringan, Sleman, Yogyakarta.

> **Penyusun:** Mohammad Tyas Subianto — Program Studi Independen Vinix7 (Divisi Python Machine Learning & Data Engineering)

---

## Ringkasan Arsitektur & Fitur Utama

1. **Tanya Tani (`/`):** Asisten percakapan berbasis *Hybrid RAG* (BM25 + TF-IDF *Reciprocal Rank Fusion*) dan *tool-calling* deterministik untuk biaya, profil lahan parsial, serta informasi kalurahan/hama. Dilengkapi mode cadangan deterministik apabila kunci API LLM belum diisi atau server eksternal tidak terjangkau.
2. **Cek & Diagnosis Lahan (`/analisis-lahan`):**
   - **Segmentasi Biofisik Eksploratif (K-Means $k=3$, 4 fitur murni):** Memisahkan `area_ha` agar tidak mendistorsi kemiripan biofisik (`elevation_m`, `soil_ph`, `organic_carbon`, `NDVI`), meningkatkan *silhouette score* dari `0,1689` menjadi `0,2233`.
   - **Diagnosis Tanah & Kesesuaian Komoditas:** Aturan agronomi berbasis panduan Kementan/BSIP untuk 6 komoditas lokal (`Padi IR64`, `Jagung Bisi 18`, `Cabai Merah Keriting Lokal`, `Tomat Servo`, `Bawang Merah Tajuk`, `Salak Pondoh Sleman`) beserta *Out-of-Distribution Guard* dan tombol bagikan ke WhatsApp.
3. **Kalkulator RAB & Titik Impas (`/kalkulator-biaya`):** Menghitung proporsi modal Benih, Pupuk, Pestisida, dan Tenaga Kerja sesuai luas lahan (`ha` atau `m²`) dari `Cost_Data`, serta simulasi harga impas terhadap acuan resmi BPS/Bapanas.
4. **Peta Kalurahan, Cuaca & Hama (`/peta-kalurahan`):** Visualisasi vektor ringan 100 koordinat sampel lahan di 5 kalurahan (Umbulharjo, Argomulyo, Wukirsari, Glagaharjo, Kepuharjo), pola curah hujan 60 bulan, dan catatan hama.
5. **Audit Data & Metodologi (`/metodologi`):** Dokumentasi terbuka mengenai temuan audit data, alasan penolakan prediksi hasil panen ($R^2 < 0$), dan alasan `Price_Data` simulasi tidak dipakai.

---

## Kejujuran Data & Batasan Model

- **Prediksi Hasil Panen Dinonaktifkan:** Uji pada `ML_Dataset` (300 baris) menghasilkan $R^2$ negatif (`Linear Regression = -0,1301`, `Random Forest = -0,0756`), sehingga sistem tidak menampilkan prediksi tonase panen.
- **Harga Simulasi Diblokir:** `Price_Data` memiliki harga rata-rata `Rp 41.827–Rp 52.082/kg` sehingga dilarang dipakai menghitung laba; sistem menggunakan acuan resmi BPS/Bapanas (`Harga Gabah 2025 Rp 7.081/kg`, `HPP GKP Rp 6.500/kg`, `HPP Jagung Rp 5.500/kg`, produktivitas padi riil `4,635 t/ha`).
- **Segmentasi Bersifat Eksploratif:** `silhouette = 0,2233` menunjukkan tidak adanya pemisahan klaster alami yang tajam; seluruh hasil analisis lahan merupakan panduan awal sebelum verifikasi penyuluh pertanian (PPL).
- **Dataset Mentah Tidak Masuk Git:** File Excel sumber (`*.xlsx`), `.env`, dan database lokal (`*.db`) dikecualikan melalui `.gitignore`.

---

## Struktur Proyek

```text
├── apps/
│   ├── api/                 # Backend FastAPI, router REST /api/v1, artifacts model, SQLite anonim
│   └── web/                 # Frontend Next.js 14 App Router (TypeScript + Tailwind CSS)
├── packages/
│   ├── agronomy/            # Mesin kesesuaian komoditas, OOD guard, dan kalkulator RAB/BEP
│   └── rag/                 # Basis pengetahuan markdown, hybrid retriever, dan tool-calling
├── ml/                      # Skrip training deterministik & verifikasi artefak dari Excel
├── tests/                   # Suite pytest (unit, API contract, evaluasi 10 skenario tanya-jawab)
├── docs/                    # PRD v2.0 dan panduan demo penguji
├── .env.example
└── docker-compose.yml
```

---

## Menjalankan Secara Lokal

### 1. Siapkan Environment Variable

```bash
cp .env.example .env
```

Isi `LLM_API_KEY`, `LLM_BASE_URL`, dan `LLM_MODEL` pada `.env` bila ingin mengaktifkan mode LLM penuh. Jika `LLM_API_KEY` dibiarkan kosong, endpoint `/api/v1/chat` tetap berjalan aman menggunakan mode cadangan deterministik.

### 2. Backend API (Python 3.12)

```bash
uv venv --python 3.12 .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Linux/macOS:
# source .venv/bin/activate

uv pip install -r apps/api/requirements.txt
uv pip install -e . --no-deps

uvicorn apps.api.main:app --reload --port 8000
```

*(Opsional)* Mereproduksi ulang model dan `data_ringkas.json` dari dataset Excel lokal:

```bash
python ml/train_and_export.py --excel "path/ke/Smart_Farming_Cangkringan_Sleman_2022_2026.xlsx"
python ml/verify_artifacts.py
```

### 3. Frontend Web (Next.js)

```bash
cd apps/web
npm install
npm run dev
```

Buka `http://localhost:3000` (tampilan dioptimalkan untuk layar ponsel Android dan desktop).

### 4. Menjalankan Pengujian

```bash
pytest -v
```

---

## Deployment dengan Docker Compose

```bash
docker compose up --build
```

Untuk deployment terpisah:
- **Backend (`apps/api/Dockerfile`):** Cocok di Render, Railway, atau Hugging Face Spaces (Python 3.12, ringan tanpa dependensi ONNX eksternal).
- **Frontend (`apps/web`):** Cocok di Vercel dengan mengisi environment variable `NEXT_PUBLIC_API_URL` mengarah ke URL backend.
