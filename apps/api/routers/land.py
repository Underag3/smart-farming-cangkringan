"""Land analysis and exploratory segment profile endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from apps.api.schemas import LandAnalyzeRequest
from packages.agronomy.artifacts import load_segment_profiles
from packages.agronomy.land_analyzer import analyze_land

router = APIRouter(tags=["land"])


@router.get("/segments")
def get_segments() -> dict:
    """Return exploratory segment profiles, feature bounds, and disclaimer."""
    return load_segment_profiles()


@router.post("/land/analyze")
def post_land_analyze(payload: LandAnalyzeRequest) -> dict:
    """Run hybrid biophysical clustering, soil diagnosis, and crop suitability."""
    return analyze_land(
        elevation_m=payload.elevation_m,
        soil_ph=payload.soil_ph,
        organic_carbon=payload.organic_carbon,
        ndvi=payload.ndvi,
        area_ha=payload.area_ha,
        irrigation=payload.irrigation,
    )
