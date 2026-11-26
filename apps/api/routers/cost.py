"""Farming cost (RAB) and break-even price endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from apps.api.schemas import CostEstimateRequest
from packages.agronomy.artifacts import load_summary_data
from packages.agronomy.cost_calculator import estimate_farming_cost

router = APIRouter(tags=["cost"])


@router.get("/costs")
def get_costs() -> dict:
    """Return baseline per-hectare costs for all 6 commodities plus BPS benchmarks."""
    summary = load_summary_data()
    return {
        "costs": summary["costs"],
        "official_bps_benchmarks": summary["audit_findings"]["official_bps_benchmarks"],
        "price_rejection_note": (
            "Price_Data (Rp 41.827-52.082/kg) tidak realistis dan tidak dipakai untuk proyeksi laba."
        ),
    }


@router.post("/cost/estimate")
def post_cost_estimate(payload: CostEstimateRequest) -> dict:
    """Calculate proportional farming cost and optional break-even price."""
    try:
        return estimate_farming_cost(
            commodity=payload.commodity,
            area_ha=payload.area_ha,
            target_yield_ton_per_ha=payload.target_yield_ton_per_ha,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
