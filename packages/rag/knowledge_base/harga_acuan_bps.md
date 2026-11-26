---
sumber: BPS, Badan Pangan Nasional (Bapanas), & Audit ML_Dataset / Price_Data
cakupan: Acuan harga resmi dan penjelasan fitur yang tidak diklaim sistem
---

# Acuan Harga Resmi & Batasan Prediksi

## Acuan Harga & Produktivitas Resmi (Pembanding Riil)
- **Rata-rata harga gabah 2025 (BPS):** **Rp 7.081 / kg**
- **HPP Gabah Kering Panen / GKP (Bapanas):** **Rp 6.500 / kg**
- **HPP Jagung (Bapanas):** **Rp 5.500 / kg**
- **Produktivitas padi riil (BPS):** **4,635 ton / ha**

## Mengapa Sistem Tidak Menghitung Laba dari `Price_Data`?
Pada dataset latihan Vinix (`Price_Data`, 360 baris), harga semua komoditas berada pada rata-rata **Rp 41.827-Rp 52.082 / kg** (rentang acak Rp 5.123-Rp 89.975 / kg). Angka tersebut tidak realistis untuk komoditas pangan seperti gabah atau jagung sehingga dilarang dipakai menghitung pendapatan petani.

## Mengapa Sistem Tidak Memprediksi Hasil Panen (`yield`)?
Pengujian pada `ML_Dataset` (300 baris, April 2022-Mei 2025) dengan pembagian 80:20 dan validasi silang menunjukkan performa negatif:
- **Linear Regression:** $R^2$ uji **-0,1301**, RMSE **10,14 ton/ha**.
- **Random Forest:** $R^2$ uji **-0,0756**, RMSE **9,89 ton/ha** (rata-rata yield dataset 14,69 ton/ha).
Nilai $R^2 < 0$ berarti model lebih buruk daripada sekadar menebak rata-rata historis. Selain itu, ditemukan ketidakcocokan luas tanam vs panen pada 477 dari 480 baris dan 48 baris anomali yield tinggi (hingga 64,64 ton/ha). Oleh karena itu, TaniCerdas tidak menampilkan prediksi tonase panen.
