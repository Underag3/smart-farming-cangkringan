"""Hybrid land analysis combining biophysical K-Means segmentation and agronomy rules."""

from __future__ import annotations

from typing import Any

import numpy as np

from packages.agronomy.artifacts import (
    load_scaler,
    load_segment_profiles,
    load_segmentation_model,
)
from packages.agronomy.cost_calculator import get_cost_lookup
from packages.agronomy.suitability import diagnose_soil, score_commodities

FEATURE_KEYS = ("elevation_m", "soil_ph", "organic_carbon", "ndvi")
FEATURE_LABELS = {
    "elevation_m": ("Elevasi (m)", "m"),
    "soil_ph": ("pH Tanah", ""),
    "organic_carbon": ("Karbon Organik (%)", "%"),
    "ndvi": ("NDVI", ""),
    "area_ha": ("Luas Lahan (ha)", "ha"),
}


def check_ood_warnings(
    elevation_m: float | None = None,
    soil_ph: float | None = None,
    organic_carbon: float | None = None,
    ndvi: float | None = None,
    area_ha: float | None = None,
) -> list[str]:
    """Flag inputs outside observed Cangkringan sample bounds without rejecting valid ranges."""
    profil = load_segment_profiles()
    bounds = profil["feature_bounds"]
    provided = {
        "elevation_m": elevation_m,
        "soil_ph": soil_ph,
        "organic_carbon": organic_carbon,
        "NDVI": ndvi,
        "area_ha": area_ha,
    }
    warnings: list[str] = []

    for key, val in provided.items():
        if val is None or key not in bounds:
            continue
        low = bounds[key]["min"]
        high = bounds[key]["max"]
        if val < low or val > high:
            label_key = "ndvi" if key == "NDVI" else key
            label, unit = FEATURE_LABELS[label_key]
            suffix = f" {unit}" if unit else ""
            warnings.append(
                f"{label} ({val}{suffix}) berada di luar rentang observasi 100 lahan sampel "
                f"Cangkringan ({low}-{high}{suffix}). Interpretasi segmen perlu diverifikasi penyuluh."
            )
    return warnings


def _build_whatsapp_summary(
    segment: dict[str, Any],
    area_ha: float,
    irrigation: str | None,
    top_crops: list[dict[str, Any]],
    diagnosis: list[dict[str, str]],
) -> str:
    """Create plain-text summary formatted for sharing on WhatsApp."""
    irr_text = irrigation or "Belum diisi"
    top_lines = "\n".join(
        f"- {c['commodity']} ({c['variety']}): skor {c['score']}/100 [{c['tier']}], "
        f"estimasi biaya Rp {c['estimated_cost_for_area']:,}".replace(",", ".")
        for c in top_crops[:3]
    )
    diag_lines = "\n".join(f"- {d['status']}: {d['recommendation']}" for d in diagnosis[:2])
    return (
        f"*Ringkasan Analisis Lahan — TaniCerdas Cangkringan*\n"
        f"Segmen Eksploratif: *Segmen {segment['id']} ({segment['name']})*\n"
        f"Luas: {area_ha:.2f} ha | Irigasi: {irr_text}\n\n"
        f"*Top 3 Kesesuaian Komoditas:*\n{top_lines}\n\n"
        f"*Catatan Tanah Utama:*\n{diag_lines}\n\n"
        f"_Catatan: Segmentasi bersifat eksploratif (silhouette 0,2233). "
        f"Hasil ini merupakan rekomendasi awal, konsultasikan dengan penyuluh kalurahan sebelum keputusan final._"
    )


def analyze_land(
    elevation_m: float,
    soil_ph: float,
    organic_carbon: float,
    ndvi: float,
    area_ha: float = 1.0,
    irrigation: str | None = None,
) -> dict[str, Any]:
    """Run full 3-layer analysis: ML biophysical segment + soil diagnosis + crop suitability."""
    model = load_segmentation_model()
    scaler = load_scaler()
    profil = load_segment_profiles()

    raw_vec = np.array([[elevation_m, soil_ph, organic_carbon, ndvi]], dtype=float)
    scaled_vec = scaler.transform(raw_vec)
    raw_pred = int(model.predict(scaled_vec)[0])
    seg_id = profil["raw_to_canonical"][str(raw_pred)]

    seg_meta = next(item for item in profil["segments"] if item["id"] == seg_id)
    centroid_vec = scaler.transform(
        np.array(
            [[
                seg_meta["centroid"]["elevation_m"],
                seg_meta["centroid"]["soil_ph"],
                seg_meta["centroid"]["organic_carbon"],
                seg_meta["centroid"]["ndvi"],
            ]],
            dtype=float,
        )
    )
    std_distance = round(float(np.linalg.norm(scaled_vec - centroid_vec)), 3)

    ood_warnings = check_ood_warnings(
        elevation_m=elevation_m,
        soil_ph=soil_ph,
        organic_carbon=organic_carbon,
        ndvi=ndvi,
        area_ha=area_ha,
    )
    diagnosis = diagnose_soil(
        elevation_m=elevation_m,
        soil_ph=soil_ph,
        organic_carbon=organic_carbon,
        ndvi=ndvi,
    )
    suitability = score_commodities(
        elevation_m=elevation_m,
        soil_ph=soil_ph,
        organic_carbon=organic_carbon,
        ndvi=ndvi,
        area_ha=area_ha,
        irrigation=irrigation,
        cost_lookup=get_cost_lookup(),
    )

    segment_out = {
        "id": seg_meta["id"],
        "code": seg_meta["code"],
        "name": seg_meta["name"],
        "description": seg_meta["description"],
        "silhouette_score": profil["silhouette_score"],
        "disclaimer": profil["disclaimer"],
        "nearest_centroid": seg_meta["centroid"],
        "standardized_distance": std_distance,
        "focus_recommendations": seg_meta["focus_recommendations"],
    }

    return {
        "input": {
            "elevation_m": elevation_m,
            "soil_ph": soil_ph,
            "organic_carbon": organic_carbon,
            "ndvi": ndvi,
            "area_ha": area_ha,
            "irrigation": irrigation,
        },
        "exploratory_segment": segment_out,
        "ood_warnings": ood_warnings,
        "soil_diagnosis": diagnosis,
        "commodity_suitability": suitability,
        "whatsapp_summary": _build_whatsapp_summary(
            segment=segment_out,
            area_ha=area_ha,
            irrigation=irrigation,
            top_crops=suitability,
            diagnosis=diagnosis,
        ),
    }


def analyze_land_partial(
    elevation_m: float | None = None,
    soil_ph: float | None = None,
    organic_carbon: float | None = None,
    ndvi: float | None = None,
    irrigation: str | None = None,
) -> dict[str, Any]:
    """Estimate closest exploratory segment when user supplies partial land metrics in chat."""
    provided = {
        "elevation_m": elevation_m,
        "soil_ph": soil_ph,
        "organic_carbon": organic_carbon,
        "ndvi": ndvi,
    }
    present_keys = [k for k, v in provided.items() if v is not None]
    missing_keys = [k for k, v in provided.items() if v is None]

    if not present_keys:
        raise ValueError("Minimal satu parameter biofisik (elevasi, pH, C-organik, atau NDVI) harus diberikan.")

    if not missing_keys:
        full = analyze_land(
            elevation_m=float(elevation_m),  # type: ignore[arg-type]
            soil_ph=float(soil_ph),  # type: ignore[arg-type]
            organic_carbon=float(organic_carbon),  # type: ignore[arg-type]
            ndvi=float(ndvi),  # type: ignore[arg-type]
            irrigation=irrigation,
        )
        return {
            "is_partial": False,
            "provided_features": present_keys,
            "missing_features": [],
            "closest_segment": full["exploratory_segment"],
            "ood_warnings": full["ood_warnings"],
            "soil_diagnosis": full["soil_diagnosis"],
            "top_commodities": full["commodity_suitability"][:3],
        }

    profil = load_segment_profiles()
    bounds = profil["feature_bounds"]
    idx_map = {"elevation_m": "elevation_m", "soil_ph": "soil_ph", "organic_carbon": "organic_carbon", "ndvi": "NDVI"}

    best_seg = None
    best_dist = float("inf")
    for seg in profil["segments"]:
        sq_sum = 0.0
        for key in present_keys:
            bkey = idx_map[key]
            mean = bounds[bkey]["mean"]
            std = max(bounds[bkey]["std"], 1e-6)
            val_z = (float(provided[key]) - mean) / std  # type: ignore[arg-type]
            cent_z = (float(seg["centroid"][key]) - mean) / std
            sq_sum += (val_z - cent_z) ** 2
        dist = float(np.sqrt(sq_sum))
        if dist < best_dist:
            best_dist = dist
            best_seg = seg

    assert best_seg is not None
    return {
        "is_partial": True,
        "provided_features": present_keys,
        "missing_features": missing_keys,
        "closest_segment": {
            "id": best_seg["id"],
            "code": best_seg["code"],
            "name": best_seg["name"],
            "description": best_seg["description"],
            "partial_standardized_distance": round(best_dist, 3),
            "focus_recommendations": best_seg["focus_recommendations"],
            "note": (
                "Perhitungan indikatif menggunakan fitur yang tersedia. "
                f"Lengkapi {', '.join(missing_keys)} di menu Cek Lahan untuk pemetaan penuh."
            ),
        },
        "ood_warnings": check_ood_warnings(
            elevation_m=elevation_m,
            soil_ph=soil_ph,
            organic_carbon=organic_carbon,
            ndvi=ndvi,
        ),
        "soil_diagnosis": diagnose_soil(
            elevation_m=elevation_m,
            soil_ph=soil_ph,
            organic_carbon=organic_carbon,
            ndvi=ndvi,
        ),
    }
