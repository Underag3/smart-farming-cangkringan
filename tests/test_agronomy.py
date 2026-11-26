"""Unit tests for biophysical segmentation, OOD guard, suitability, and cost calculator."""

from __future__ import annotations

import pytest

from packages.agronomy.artifacts import load_segment_profiles
from packages.agronomy.cost_calculator import estimate_farming_cost
from packages.agronomy.land_analyzer import analyze_land, analyze_land_partial, check_ood_warnings


def test_centroids_map_back_to_own_segments() -> None:
    profiles = load_segment_profiles()
    for seg in profiles["segments"]:
        c = seg["centroid"]
        res = analyze_land(
            elevation_m=c["elevation_m"],
            soil_ph=c["soil_ph"],
            organic_carbon=c["organic_carbon"],
            ndvi=c["ndvi"],
            area_ha=1.0,
        )
        assert res["exploratory_segment"]["id"] == seg["id"]
        assert res["ood_warnings"] == []


def test_ood_guard_flags_extreme_inputs() -> None:
    warnings = check_ood_warnings(
        elevation_m=1500.0,
        soil_ph=4.2,
        organic_carbon=6.0,
        ndvi=0.2,
        area_ha=15.0,
    )
    assert len(warnings) == 5


def test_partial_land_analysis_handles_3_features() -> None:
    res = analyze_land_partial(elevation_m=800.0, soil_ph=5.8, ndvi=0.75)
    assert res["is_partial"] is True
    assert res["missing_features"] == ["organic_carbon"]
    assert res["closest_segment"]["id"] == "B"


def test_cost_calculator_proportional_and_bep() -> None:
    res = estimate_farming_cost("padi", area_ha=0.5, target_yield_ton_per_ha=4.635)
    sc = res["scaled_cost"]
    assert sc["seed"] + sc["fertilizer"] + sc["pesticide"] + sc["labor"] == sc["total"]
    assert sc["total"] == 7159217
    assert res["break_even"] is not None
    assert res["break_even"]["break_even_price_rp_per_kg"] > 0


def test_cost_calculator_rejects_unknown_commodity() -> None:
    with pytest.raises(ValueError):
        estimate_farming_cost("durian", area_ha=1.0)
