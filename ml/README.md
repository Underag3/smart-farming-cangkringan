# Pipeline Pelatihan & Audit Data (`ml/`)

Folder ini berisi skrip offline untuk mengaudit seluruh sheet dataset sumber (`Smart_Farming_Cangkringan_Sleman_2022_2026.xlsx`) serta melatih dan mengekspor artefak yang dipakai oleh backend API.

## Reproduksi Artefak

Jalankan perintah berikut dari root repositori:

```bash
python ml/train_and_export.py --excel "path/ke/Smart_Farming_Cangkringan_Sleman_2022_2026.xlsx"
python ml/verify_artifacts.py
```

Output yang dihasilkan di `apps/api/artifacts/`:
- `model_segmentasi.joblib` — Model `KMeans(n_clusters=3, random_state=42, n_init=20)` pada 4 fitur biofisik (`elevation_m`, `soil_ph`, `organic_carbon`, `NDVI`).
- `scaler_segmentasi.joblib` — `StandardScaler` yang dilatih pada 4 fitur biofisik.
- `profil_segmen.json` — Profil centroid deterministik (Segmen A, B, C), rentang fitur untuk *Out-of-Distribution Guard*, serta perbandingan metrik silhouette (`0,2233` vs baseline 5 fitur `0,1689`).
- `data_ringkas.json` — Ringkasan teraudit untuk 5 kalurahan, 100 koordinat sampel teranonimasi, biaya 6 komoditas (`Cost_Data`), klimatologi 60 bulan (`Weather_Data`), catatan hama (`Pest_Disease_Data`), hasil evaluasi regresi (`ML_Dataset`), dan acuan resmi BPS/Bapanas.
