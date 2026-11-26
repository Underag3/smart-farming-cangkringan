"""Deterministic farming cost (RAB) and break-even price calculator."""

from __future__ import annotations

from typing import Any

from packages.agronomy.artifacts import load_summary_data

COMMODITY_ALIASES = {
    "padi": "Padi",
    "beras": "Padi",
    "gabah": "Padi",
    "jagung": "Jagung",
    "cabai": "Cabai Merah",
    "cabai merah": "Cabai Merah",
    "lombok": "Cabai Merah",
    "tomat": "Tomat",
    "bawang": "Bawang Merah",
    "bawang merah": "Bawang Merah",
    "salak": "Salak Pondoh",
    "salak pondoh": "Salak Pondoh",
}


def normalize_commodity_name(raw_name: str) -> str:
    """Map user-provided commodity name or alias to canonical Cost_Data name."""
    cleaned = " ".join(raw_name.strip().lower().split())
    if cleaned in COMMODITY_ALIASES:
        return COMMODITY_ALIASES[cleaned]
    for alias, canonical in COMMODITY_ALIASES.items():
        if alias in cleaned:
            return canonical
    raise ValueError(
        f"Komoditas '{raw_name}' tidak ditemukan. Pilihan valid: "
        "Padi, Jagung, Cabai Merah, Tomat, Bawang Merah, Salak Pondoh."
    )


def get_cost_lookup() -> dict[str, dict[str, Any]]:
    """Return cost entries keyed by canonical commodity name."""
    summary = load_summary_data()
    return {item["commodity"]: item for item in summary["costs"]}


def estimate_farming_cost(
    commodity: str,
    area_ha: float = 1.0,
    target_yield_ton_per_ha: float | None = None,
) -> dict[str, Any]:
    """Calculate proportional RAB breakdown and optional break-even price."""
    if area_ha <= 0 or area_ha > 100:
        raise ValueError("Luas lahan harus lebih dari 0 dan maksimal 100 hektar.")

    canonical = normalize_commodity_name(commodity)
    lookup = get_cost_lookup()
    row = lookup[canonical]

    seed = round(row["seed_cost"] * area_ha)
    fertilizer = round(row["fertilizer_cost"] * area_ha)
    pesticide = round(row["pesticide_cost"] * area_ha)
    labor = round(row["labor_cost"] * area_ha)
    total = seed + fertilizer + pesticide + labor

    def pct(part: int) -> float:
        return round((part / total) * 100, 1) if total > 0 else 0.0

    benchmarks = load_summary_data()["audit_findings"]["official_bps_benchmarks"]
    bep_info: dict[str, Any] | None = None
    if target_yield_ton_per_ha is not None:
        if target_yield_ton_per_ha <= 0 or target_yield_ton_per_ha > 100:
            raise ValueError("Target hasil panen harus antara > 0 dan 100 ton/ha.")
        expected_kg = target_yield_ton_per_ha * area_ha * 1000.0
        bep_rp_kg = round(total / expected_kg)
        bep_info = {
            "target_yield_ton_per_ha": round(target_yield_ton_per_ha, 3),
            "expected_total_kg": round(expected_kg, 1),
            "break_even_price_rp_per_kg": bep_rp_kg,
            "note": (
                "Titik impas dihitung dari Total Biaya / Estimasi Panen Anda (bukan prediksi model). "
                "Price_Data simulasi tidak dipakai."
            ),
        }

    relevant_benchmarks = []
    if canonical == "Padi":
        relevant_benchmarks = [
            {"label": "HPP Gabah Kering Panen (Bapanas)", "value_rp_kg": benchmarks["hpp_gkp_rp_kg"]},
            {"label": "Rata-rata harga gabah 2025 (BPS)", "value_rp_kg": benchmarks["rata_rata_harga_gabah_2025_rp_kg"]},
            {"label": "Produktivitas padi riil (BPS)", "value_ton_ha": benchmarks["produktivitas_padi_riil_ton_ha"]},
        ]
    elif canonical == "Jagung":
        relevant_benchmarks = [
            {"label": "HPP Jagung (Bapanas)", "value_rp_kg": benchmarks["hpp_jagung_rp_kg"]},
        ]

    return {
        "commodity": canonical,
        "variety": row["variety"],
        "area_ha": round(area_ha, 4),
        "cost_per_ha": {
            "seed": row["seed_cost"],
            "fertilizer": row["fertilizer_cost"],
            "pesticide": row["pesticide_cost"],
            "labor": row["labor_cost"],
            "total": row["total_cost_per_ha"],
        },
        "scaled_cost": {
            "seed": seed,
            "fertilizer": fertilizer,
            "pesticide": pesticide,
            "labor": labor,
            "total": total,
        },
        "component_shares_pct": {
            "seed": pct(seed),
            "fertilizer": pct(fertilizer),
            "pesticide": pct(pesticide),
            "labor": pct(labor),
        },
        "break_even": bep_info,
        "official_benchmarks": relevant_benchmarks,
        "source": "Cost_Data (Smart Farming Cangkringan 2022-2026) & Acuan BPS/Bapanas",
    }
