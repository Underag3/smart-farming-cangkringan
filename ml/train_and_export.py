"""Train biophysical land segmentation and export verified runtime artifacts."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score, silhouette_score
from sklearn.model_selection import KFold, cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler

BIOPHYSICAL_FEATURES = ["elevation_m", "soil_ph", "organic_carbon", "NDVI"]
LEGACY_FIVE_FEATURES = ["elevation_m", "area_ha", "soil_ph", "organic_carbon", "NDVI"]

OFFICIAL_BPS_BENCHMARKS = {
    "rata_rata_harga_gabah_2025_rp_kg": 7081,
    "hpp_gkp_rp_kg": 6500,
    "hpp_jagung_rp_kg": 5500,
    "produktivitas_padi_riil_ton_ha": 4.635,
    "sumber": "BPS & Badan Pangan Nasional (acuan pembanding resmi 2025)",
}

SEGMENT_METADATA = {
    "A": {
        "code": 0,
        "name": "Zona Menengah-Netral",
        "description": (
            "Lahan elevasi menengah (~654 m) dengan pH paling mendekati netral (~6,56) "
            "dan tutupan vegetasi sedang-rapat (NDVI ~0,694)."
        ),
        "focus_recommendations": [
            "Pertahankan pH netral dengan pemupukan berimbang dan hindari pengasaman berlebih dari urea tunggal.",
            "Tambahkan pupuk organik/kompos saat olah tanah bila C-organik di bawah 2,5%.",
            "Cocok untuk rotasi padi-palawija atau hortikultura (cabai/tomat) bila irigasi teknis/semi teknis tersedia.",
        ],
    },
    "B": {
        "code": 1,
        "name": "Zona Lereng Atas Subur & Vegetasi Rapat",
        "description": (
            "Lahan dataran lebih tinggi (~764 m) dengan kandungan karbon organik tertinggi (~2,66%) "
            "dan vegetasi paling rapat (NDVI ~0,774), namun pH cenderung agak asam (~5,94)."
        ),
        "focus_recommendations": [
            "Terapkan pengapuran dolomit ringan sebelum tanam bila pH di bawah 6,0 untuk tanaman sensitif asam.",
            "Manfaatkan kesuburan C-organik alami untuk tanaman tahunan/agroforestri seperti Salak Pondoh atau hortikultura dataran menengah-atas.",
            "Terapkan terasering/mulsa organik untuk menjaga kestabilan lereng dan kelembapan tanah vulkanik.",
        ],
    },
    "C": {
        "code": 2,
        "name": "Zona Lereng Bawah Vegetasi Jarang",
        "description": (
            "Lahan elevasi lebih rendah (~553 m) dengan kerapatan vegetasi paling rendah (NDVI ~0,577) "
            "dan tanah agak asam (~5,97)."
        ),
        "focus_recommendations": [
            "Prioritaskan pembenahan tanah dengan kompos matang/pupuk organik + probiotik hayati untuk meningkatkan retensi air.",
            "Periksa ketersediaan air irigasi sebelum menanam padi; pertimbangkan jagung atau tanaman tahan kering bila tadah hujan.",
            "Lakukan pengapuran terukur dan penanaman penutup tanah untuk menekan penguapan dan erosi.",
        ],
    },
}


def resolve_excel_path(cli_path: str | None) -> Path:
    """Resolve source Excel path from CLI argument, env var, or known defaults."""
    candidates = [
        cli_path,
        os.getenv("SMART_FARMING_EXCEL"),
        r"C:\Users\MyBook Hype AMD\Downloads\Smart_Farming_Cangkringan_Sleman_2022_2026.xlsx",
        "data/Smart_Farming_Cangkringan_Sleman_2022_2026.xlsx",
    ]
    for candidate in candidates:
        if candidate:
            path = Path(candidate)
            if path.exists():
                return path
    raise FileNotFoundError(
        "File dataset Excel tidak ditemukan. Berikan argumen --excel <path>."
    )


def map_clusters_deterministically(
    df: pd.DataFrame, raw_labels: np.ndarray
) -> dict[int, str]:
    """Map raw KMeans labels to stable canonical keys A, B, C using centroids."""
    temp = df.copy()
    temp["raw_cluster"] = raw_labels
    means = temp.groupby("raw_cluster")[BIOPHYSICAL_FEATURES].mean()

    cluster_b = int(means["elevation_m"].idxmax())
    remaining = [idx for idx in means.index if idx != cluster_b]
    cluster_c = int(means.loc[remaining, "NDVI"].idxmin())
    cluster_a = int([idx for idx in remaining if idx != cluster_c][0])

    return {
        cluster_a: "A",
        cluster_b: "B",
        cluster_c: "C",
    }


def build_audit_findings(excel_path: Path) -> dict:
    """Run real audit computations across Harvest, Planting, Price, and ML sheets."""
    plant = pd.read_excel(excel_path, sheet_name="Planting_Data")
    harv = pd.read_excel(excel_path, sheet_name="Harvest_Data")
    price = pd.read_excel(excel_path, sheet_name="Price_Data")
    ml = pd.read_excel(excel_path, sheet_name="ML_Dataset")

    merged = plant.merge(harv, on="planting_id", suffixes=("_p", "_h"))
    area_diff = (merged["area_planted_ha"] - merged["area_harvested_ha"]).abs()
    exact_mismatch = int((merged["area_planted_ha"] != merged["area_harvested_ha"]).sum())
    tol_mismatch = int((area_diff > 0.01).sum())

    iso = IsolationForest(contamination=0.1, random_state=42)
    iso_pred = iso.fit_predict(harv[["area_harvested_ha", "production_ton", "yield_ton_ha"]])
    anom_count = int((iso_pred == -1).sum())
    anom_mean = round(float(harv.loc[iso_pred == -1, "yield_ton_ha"].mean()), 2)
    norm_mean = round(float(harv.loc[iso_pred == 1, "yield_ton_ha"].mean()), 2)

    X_ml = pd.get_dummies(ml.drop(columns=["date", "yield_ton_ha"]), drop_first=True)
    y_ml = ml["yield_ton_ha"]
    X_tr, X_te, y_tr, y_te = train_test_split(X_ml, y_ml, test_size=0.2, random_state=42)
    kf = KFold(n_splits=5, shuffle=True, random_state=42)

    lr = LinearRegression().fit(X_tr, y_tr)
    lr_pred = lr.predict(X_te)
    lr_cv = cross_val_score(LinearRegression(), X_ml, y_ml, cv=kf, scoring="r2")

    rf = RandomForestRegressor(random_state=42).fit(X_tr, y_tr)
    rf_pred = rf.predict(X_te)
    rf_cv = cross_val_score(
        RandomForestRegressor(random_state=42), X_ml, y_ml, cv=kf, scoring="r2"
    )

    price_by_comm = (
        price.groupby("commodity")["price_rp_per_kg"]
        .agg(["mean", "min", "max"])
        .round(1)
        .to_dict("index")
    )

    return {
        "planting_harvest": {
            "total_rows": int(len(merged)),
            "plantings_per_year": {
                str(k): int(v)
                for k, v in pd.to_datetime(plant["date"])
                .dt.year.value_counts()
                .sort_index()
                .items()
            },
            "area_mismatch_exact_count": exact_mismatch,
            "area_mismatch_gt_001_count": tol_mismatch,
            "yield_mean_ton_ha": round(float(harv["yield_ton_ha"].mean()), 3),
            "yield_max_ton_ha": round(float(harv["yield_ton_ha"].max()), 2),
            "isolation_forest_anomalies": anom_count,
            "isolation_forest_anom_yield_mean": anom_mean,
            "isolation_forest_norm_yield_mean": norm_mean,
        },
        "yield_prediction_rejection": {
            "ml_rows": int(len(ml)),
            "date_min": str(pd.to_datetime(ml["date"]).min().date()),
            "date_max": str(pd.to_datetime(ml["date"]).max().date()),
            "ml_yield_mean_ton_ha": round(float(y_ml.mean()), 3),
            "linear_regression": {
                "r2_test": round(float(r2_score(y_te, lr_pred)), 4),
                "rmse_test": round(float(np.sqrt(mean_squared_error(y_te, lr_pred))), 4),
                "r2_cv5_mean": round(float(lr_cv.mean()), 4),
            },
            "random_forest": {
                "r2_test": round(float(r2_score(y_te, rf_pred)), 4),
                "rmse_test": round(float(np.sqrt(mean_squared_error(y_te, rf_pred))), 4),
                "r2_cv5_mean": round(float(rf_cv.mean()), 4),
            },
        },
        "price_data_rejection": {
            "total_rows": int(len(price)),
            "overall_min_rp_kg": int(price["price_rp_per_kg"].min()),
            "overall_max_rp_kg": int(price["price_rp_per_kg"].max()),
            "by_commodity": price_by_comm,
        },
        "official_bps_benchmarks": OFFICIAL_BPS_BENCHMARKS,
    }


def export_all(excel_path: Path, output_dir: Path) -> None:
    """Train segmentation artifacts and export audited JSON summaries."""
    output_dir.mkdir(parents=True, exist_ok=True)

    land = pd.read_excel(excel_path, sheet_name="Land_Data")
    gis = pd.read_excel(excel_path, sheet_name="GIS_Data")
    plant = pd.read_excel(excel_path, sheet_name="Planting_Data")
    cost = pd.read_excel(excel_path, sheet_name="Cost_Data")
    weather = pd.read_excel(excel_path, sheet_name="Weather_Data")
    pest = pd.read_excel(excel_path, sheet_name="Pest_Disease_Data")

    lg = land.merge(gis[["farm_id", "NDVI", "land_cover"]], on="farm_id")

    # 1. Baseline 5-feature KMeans (for transparent comparison in /metodologi)
    X5 = StandardScaler().fit_transform(lg[LEGACY_FIVE_FEATURES].to_numpy())
    km5 = KMeans(n_clusters=3, random_state=42, n_init=10).fit(X5)
    sil_5feat = round(float(silhouette_score(X5, km5.labels_)), 4)

    # 2. Primary 4-feature biophysical KMeans (fit on ndarray to avoid feature-name warnings at inference)
    scaler = StandardScaler()
    X4 = scaler.fit_transform(lg[BIOPHYSICAL_FEATURES].to_numpy())
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=20).fit(X4)
    sil_4feat = round(float(silhouette_score(X4, kmeans.labels_)), 4)

    raw_to_canonical = map_clusters_deterministically(lg, kmeans.labels_)
    lg["segment_id"] = pd.Series(kmeans.labels_).map(raw_to_canonical)

    feature_bounds = {}
    for feat in BIOPHYSICAL_FEATURES:
        feature_bounds[feat] = {
            "min": round(float(lg[feat].min()), 3),
            "max": round(float(lg[feat].max()), 3),
            "mean": round(float(lg[feat].mean()), 3),
            "std": round(float(lg[feat].std(ddof=0)), 3),
        }
    feature_bounds["area_ha"] = {
        "min": round(float(lg["area_ha"].min()), 3),
        "max": round(float(lg["area_ha"].max()), 3),
        "mean": round(float(lg["area_ha"].mean()), 3),
        "std": round(float(lg["area_ha"].std(ddof=0)), 3),
    }

    segments_profile = []
    for seg_id in ["A", "B", "C"]:
        sub = lg[lg["segment_id"] == seg_id]
        meta = SEGMENT_METADATA[seg_id]
        segments_profile.append(
            {
                "id": seg_id,
                "code": meta["code"],
                "name": meta["name"],
                "count": int(len(sub)),
                "description": meta["description"],
                "centroid": {
                    "elevation_m": round(float(sub["elevation_m"].mean()), 2),
                    "soil_ph": round(float(sub["soil_ph"].mean()), 2),
                    "organic_carbon": round(float(sub["organic_carbon"].mean()), 2),
                    "ndvi": round(float(sub["NDVI"].mean()), 3),
                },
                "focus_recommendations": meta["focus_recommendations"],
            }
        )

    profil_payload = {
        "model_version": "2.0.0",
        "algorithm": "KMeans(n_clusters=3, random_state=42, n_init=20) + StandardScaler",
        "features": ["elevation_m", "soil_ph", "organic_carbon", "ndvi"],
        "n_samples": int(len(lg)),
        "silhouette_score": sil_4feat,
        "legacy_5feat_silhouette": sil_5feat,
        "raw_to_canonical": {str(k): v for k, v in raw_to_canonical.items()},
        "feature_bounds": feature_bounds,
        "segments": segments_profile,
        "disclaimer": (
            "Segmentasi bersifat eksploratif (silhouette 0,2233), bukan batas klasifikasi mutlak. "
            "Rekomendasi bersifat panduan awal sebelum verifikasi lapangan/penyuluh."
        ),
    }

    # Build regions summary
    regions = []
    for desa, grp in lg.groupby("desa"):
        irr_counts = {str(k): int(v) for k, v in grp["irrigation"].value_counts().items()}
        regions.append(
            {
                "desa": str(desa),
                "farm_count": int(len(grp)),
                "total_area_ha": round(float(grp["area_ha"].sum()), 2),
                "mean_elevation_m": round(float(grp["elevation_m"].mean()), 1),
                "mean_soil_ph": round(float(grp["soil_ph"].mean()), 2),
                "mean_organic_carbon": round(float(grp["organic_carbon"].mean()), 2),
                "mean_ndvi": round(float(grp["NDVI"].mean()), 3),
                "irrigation_counts": irr_counts,
            }
        )
    regions.sort(key=lambda r: r["farm_count"], reverse=True)

    # Varieties per commodity
    varieties = (
        plant.groupby("commodity")["variety"].first().to_dict()
    )
    costs_list = []
    for _, row in cost.iterrows():
        comm = str(row["commodity"])
        costs_list.append(
            {
                "commodity": comm,
                "variety": str(varieties.get(comm, "-")),
                "seed_cost": int(row["seed_cost"]),
                "fertilizer_cost": int(row["fertilizer_cost"]),
                "pesticide_cost": int(row["pesticide_cost"]),
                "labor_cost": int(row["labor_cost"]),
                "total_cost_per_ha": int(row["total_cost_per_ha"]),
            }
        )
    costs_list.sort(key=lambda c: c["total_cost_per_ha"], reverse=True)

    # Weather monthly climatology
    weather_df = weather.copy()
    weather_df["month"] = pd.to_datetime(weather_df["date"]).dt.month
    month_names = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
    ]
    monthly_weather = []
    for m in range(1, 13):
        sub_w = weather_df[weather_df["month"] == m]
        monthly_weather.append(
            {
                "month": m,
                "label": month_names[m - 1],
                "mean_rainfall_mm": round(float(sub_w["rainfall_mm"].mean()), 1),
                "mean_temperature_c": round(float(sub_w["temperature_C"].mean()), 1),
                "mean_humidity_pct": round(float(sub_w["humidity_percent"].mean()), 1),
            }
        )

    # Pest summary
    tidak_ada_rows = pest[pest["pest_disease"].astype(str).str.contains("Tidak", case=False, na=False)]
    pest_summary = {
        "total_records": int(len(pest)),
        "counts_by_pest": {
            str(k): int(v) for k, v in pest["pest_disease"].value_counts().items()
        },
        "tidak_ada_total": int(len(tidak_ada_rows)),
        "tidak_ada_by_severity": {
            str(k): int(v) for k, v in tidak_ada_rows["severity"].value_counts().items()
        },
        "note": (
            "Data hama hanya berisi 30 baris (2022-2026); tidak memadai untuk sistem peringatan dini otomatis."
        ),
    }

    sample_plots = []
    for _, r in lg.iterrows():
        sample_plots.append(
            {
                "farm_id": str(r["farm_id"]),
                "desa": str(r["desa"]),
                "latitude": round(float(r["latitude"]), 6),
                "longitude": round(float(r["longitude"]), 6),
                "elevation_m": int(r["elevation_m"]),
                "area_ha": round(float(r["area_ha"]), 2),
                "soil_ph": round(float(r["soil_ph"]), 2),
                "organic_carbon": round(float(r["organic_carbon"]), 2),
                "ndvi": round(float(r["NDVI"]), 3),
                "irrigation": str(r["irrigation"]),
                "segment_id": str(r["segment_id"]),
            }
        )

    data_ringkas = {
        "dataset_meta": {
            "source_name": excel_path.name,
            "total_farms": int(len(lg)),
            "total_area_ha": round(float(lg["area_ha"].sum()), 2),
            "elevation_min_m": int(lg["elevation_m"].min()),
            "elevation_max_m": int(lg["elevation_m"].max()),
            "soil_type": str(lg["soil_type"].mode().iloc[0]),
            "mean_ndvi": round(float(lg["NDVI"].mean()), 3),
            "lat_bounds": [round(float(lg["latitude"].min()), 6), round(float(lg["latitude"].max()), 6)],
            "lon_bounds": [round(float(lg["longitude"].min()), 6), round(float(lg["longitude"].max()), 6)],
        },
        "regions": regions,
        "sample_plots": sample_plots,
        "costs": costs_list,
        "weather_summary": {
            "total_months": int(len(weather_df)),
            "rainfall_mean_mm": round(float(weather_df["rainfall_mm"].mean()), 1),
            "rainfall_min_mm": round(float(weather_df["rainfall_mm"].min()), 1),
            "rainfall_max_mm": round(float(weather_df["rainfall_mm"].max()), 1),
            "temperature_min_c": round(float(weather_df["temperature_C"].min()), 1),
            "temperature_max_c": round(float(weather_df["temperature_C"].max()), 1),
            "humidity_min_pct": int(weather_df["humidity_percent"].min()),
            "humidity_max_pct": int(weather_df["humidity_percent"].max()),
            "monthly": monthly_weather,
        },
        "pest_summary": pest_summary,
        "audit_findings": build_audit_findings(excel_path),
    }

    joblib.dump(kmeans, output_dir / "model_segmentasi.joblib")
    joblib.dump(scaler, output_dir / "scaler_segmentasi.joblib")
    (output_dir / "profil_segmen.json").write_text(
        json.dumps(profil_payload, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    (output_dir / "data_ringkas.json").write_text(
        json.dumps(data_ringkas, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(f"Exported artifacts to: {output_dir}")
    print(f"4-feat silhouette: {sil_4feat} (vs legacy 5-feat: {sil_5feat})")
    for seg in segments_profile:
        print(f"  Segmen {seg['id']} ({seg['name']}): n={seg['count']}, centroid={seg['centroid']}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Train and export TaniCerdas ML artifacts.")
    parser.add_argument("--excel", type=str, default=None, help="Path to Smart Farming Excel dataset.")
    parser.add_argument(
        "--out",
        type=str,
        default="apps/api/artifacts",
        help="Output directory for exported artifacts.",
    )
    args = parser.parse_args()
    excel_path = resolve_excel_path(args.excel)
    export_all(excel_path, Path(args.out))


if __name__ == "__main__":
    main()
