"""Kalurahan spatial context, weather climatology, pest summary, and audit endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from packages.agronomy.artifacts import load_segment_profiles, load_summary_data

router = APIRouter(tags=["regions"])


@router.get("/regions")
def get_regions() -> dict:
    """Return 5 kalurahan summaries, anonymized sample plots, weather, and pest counts."""
    summary = load_summary_data()
    return {
        "dataset_meta": summary["dataset_meta"],
        "regions": summary["regions"],
        "sample_plots": summary["sample_plots"],
        "weather_summary": summary["weather_summary"],
        "pest_summary": summary["pest_summary"],
    }


@router.get("/audit")
def get_audit() -> dict:
    """Return full model evaluation & data integrity audit findings for /metodologi."""
    summary = load_summary_data()
    profil = load_segment_profiles()
    return {
        "dataset_meta": summary["dataset_meta"],
        "clustering": {
            "algorithm": profil["algorithm"],
            "features": profil["features"],
            "silhouette_4feat": profil["silhouette_score"],
            "silhouette_5feat_legacy": profil["legacy_5feat_silhouette"],
            "disclaimer": profil["disclaimer"],
        },
        "audit_findings": summary["audit_findings"],
        "pest_summary": summary["pest_summary"],
    }
