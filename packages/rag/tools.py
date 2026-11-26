"""Deterministic tool-calling definitions and execution for TaniCerdas chat."""

from __future__ import annotations

import json
import re
from typing import Any

from packages.agronomy.artifacts import load_summary_data
from packages.agronomy.cost_calculator import COMMODITY_ALIASES, estimate_farming_cost
from packages.agronomy.land_analyzer import analyze_land_partial

OPENAI_TOOLS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "calculate_farming_cost",
            "description": (
                "Hitung rincian biaya usaha tani (RAB) eksak dari Cost_Data untuk salah satu dari "
                "6 komoditas (Padi, Jagung, Cabai Merah, Tomat, Bawang Merah, Salak Pondoh) dan luas lahan dalam hektar."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "commodity": {"type": "string", "description": "Nama komoditas, mis. Padi atau Salak Pondoh."},
                    "area_ha": {"type": "number", "description": "Luas lahan dalam hektar (>0 sampai 100).", "default": 1.0},
                    "target_yield_ton_per_ha": {
                        "type": "number",
                        "description": "Opsional asumsi hasil panen pengguna (ton/ha) untuk hitung titik impas.",
                    },
                },
                "required": ["commodity"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_land_partial",
            "description": (
                "Analisis segmen eksploratif lahan dan diagnosis tanah meskipun pengguna hanya menyebut "
                "sebagian parameter (misalnya hanya elevasi, pH, dan NDVI tanpa C-organik)."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "elevation_m": {"type": "number", "description": "Elevasi lahan dalam meter dpl."},
                    "soil_ph": {"type": "number", "description": "pH tanah (0 sampai 14)."},
                    "organic_carbon": {"type": "number", "description": "Karbon organik tanah dalam persen."},
                    "ndvi": {"type": "number", "description": "Indeks vegetasi NDVI (-1 sampai 1)."},
                    "irrigation": {
                        "type": "string",
                        "enum": ["Teknis", "Semi Teknis", "Tadah Hujan"],
                        "description": "Jenis irigasi lahan bila disebutkan.",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_region_or_pest_summary",
            "description": (
                "Ambil data terverifikasi mengenai 5 kalurahan Cangkringan, irigasi, pola curah hujan 60 bulan, "
                "catatan hama (30 baris), atau acuan harga BPS/Bapanas."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "desa": {
                        "type": "string",
                        "description": "Nama kalurahan opsional: Umbulharjo, Argomulyo, Wukirsari, Glagaharjo, Kepuharjo.",
                    },
                    "topic": {
                        "type": "string",
                        "enum": ["regions", "weather", "pest", "benchmarks"],
                        "description": "Topik ringkasan data terstruktur.",
                    },
                },
            },
        },
    },
]


def _get_region_or_pest_summary(desa: str | None = None, topic: str | None = None) -> dict[str, Any]:
    summary = load_summary_data()
    if desa:
        for reg in summary["regions"]:
            if reg["desa"].lower() == desa.strip().lower():
                return {"region": reg, "source": "Land_Data & GIS_Data (100 lahan sampel)"}
    if topic == "weather":
        return {"weather_summary": summary["weather_summary"], "source": "Weather_Data (60 bulan)"}
    if topic == "pest":
        return {"pest_summary": summary["pest_summary"], "source": "Pest_Disease_Data (30 baris)"}
    if topic == "benchmarks":
        return {
            "official_bps_benchmarks": summary["audit_findings"]["official_bps_benchmarks"],
            "price_rejection_note": (
                "Price_Data (Rp 41.827-52.082/kg) tidak realistis dan dilarang dipakai menghitung pendapatan."
            ),
            "yield_rejection_note": (
                "Prediksi hasil panen ditolak karena model pada ML_Dataset memberi R2 negatif (-0,130 dan -0,076)."
            ),
        }
    if topic == "regions":
        return {
            "regions": summary["regions"],
            "source": "Land_Data & GIS_Data (100 lahan sampel)",
        }
    return {
        "regions": summary["regions"],
        "pest_summary": summary["pest_summary"],
        "source": "Land_Data, GIS_Data, & Pest_Disease_Data",
    }


def execute_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    """Execute a registered deterministic tool safely and return JSON-serializable output."""
    try:
        if name == "calculate_farming_cost":
            return estimate_farming_cost(
                commodity=str(arguments.get("commodity", "")),
                area_ha=float(arguments.get("area_ha", 1.0)),
                target_yield_ton_per_ha=(
                    float(arguments["target_yield_ton_per_ha"])
                    if arguments.get("target_yield_ton_per_ha") is not None
                    else None
                ),
            )
        if name == "analyze_land_partial":
            return analyze_land_partial(
                elevation_m=float(arguments["elevation_m"]) if arguments.get("elevation_m") is not None else None,
                soil_ph=float(arguments["soil_ph"]) if arguments.get("soil_ph") is not None else None,
                organic_carbon=(
                    float(arguments["organic_carbon"]) if arguments.get("organic_carbon") is not None else None
                ),
                ndvi=float(arguments["ndvi"]) if arguments.get("ndvi") is not None else None,
                irrigation=arguments.get("irrigation"),
            )
        if name == "get_region_or_pest_summary":
            return _get_region_or_pest_summary(
                desa=arguments.get("desa"),
                topic=arguments.get("topic"),
            )
        return {"error": f"Tool '{name}' tidak dikenal."}
    except Exception as exc:  # pragma: no cover - defensive boundary
        return {"error": str(exc)}


def _extract_number(pattern: str, text: str) -> float | None:
    match = re.search(pattern, text, flags=re.IGNORECASE)
    if not match:
        return None
    raw = match.group(1).replace(",", ".")
    try:
        return float(raw)
    except ValueError:
        return None


def _detect_commodity_in_text(text: str) -> str | None:
    lower = text.lower()
    for alias in sorted(COMMODITY_ALIASES.keys(), key=len, reverse=True):
        if re.search(rf"\b{re.escape(alias)}\b", lower):
            return COMMODITY_ALIASES[alias]
    return None


def heuristic_tool_dispatch(
    question: str,
    history: list[dict[str, str]] | None = None,
) -> list[dict[str, Any]]:
    """Run deterministic tools from regex/keyword patterns (used for fallback and pre-grounding)."""
    q_lower = question.lower()
    dispatched: list[dict[str, Any]] = []

    # 1. Partial or full land analysis detection
    elev = _extract_number(r"elevasi\s*(?:sekitar|di|=\s*)?(\d+(?:[.,]\d+)?)", q_lower)
    if elev is None:
        elev = _extract_number(r"(\d{3,4})\s*(?:m\b|mdpl|meter)", q_lower)
    ph = _extract_number(r"\bph\s*(?:tanah|saya|=)?\s*(\d+(?:[.,]\d+)?)", q_lower)
    oc = _extract_number(r"(?:karbon\s*organik|c[- ]organik)\s*(?:=)?\s*(\d+(?:[.,]\d+)?)", q_lower)
    ndvi = _extract_number(r"\bndvi\s*(?:=)?\s*(-?\d+(?:[.,]\d+)?)", q_lower)

    if any(val is not None for val in (elev, ph, oc, ndvi)):
        args = {
            k: v
            for k, v in {
                "elevation_m": elev,
                "soil_ph": ph,
                "organic_carbon": oc,
                "ndvi": ndvi,
            }.items()
            if v is not None
        }
        dispatched.append({"name": "analyze_land_partial", "args": args, "result": execute_tool("analyze_land_partial", args)})

    # 2. Cost calculation detection (check current question and recent history for follow-ups)
    commodity = _detect_commodity_in_text(q_lower)
    area_ha = _extract_number(r"(\d+(?:[.,]\d+)?)\s*(?:ha|hektar)", q_lower)
    if area_ha is None and history:
        for msg in reversed(history):
            area_ha = _extract_number(r"(\d+(?:[.,]\d+)?)\s*(?:ha|hektar)", msg.get("content", "").lower())
            if area_ha is not None:
                break
    if commodity is None and history and any(w in q_lower for w in ("diganti", "kalau", "luas yang sama", "berapa biaya", "modal")):
        for msg in reversed(history):
            commodity = _detect_commodity_in_text(msg.get("content", "").lower())
            if commodity is not None:
                break

    asks_cost = any(w in q_lower for w in ("biaya", "modal", "ongkos", "anggaran", "rab", "rupiah", "rp"))
    if commodity and (asks_cost or area_ha is not None):
        c_args = {"commodity": commodity, "area_ha": area_ha or 1.0}
        dispatched.append({"name": "calculate_farming_cost", "args": c_args, "result": execute_tool("calculate_farming_cost", c_args)})

    # 3. Region / pest / weather / rejection checks
    for desa in ("Umbulharjo", "Argomulyo", "Wukirsari", "Glagaharjo", "Kepuharjo"):
        if desa.lower() in q_lower:
            r_args = {"desa": desa}
            dispatched.append({"name": "get_region_or_pest_summary", "args": r_args, "result": execute_tool("get_region_or_pest_summary", r_args)})
            break
    else:
        if any(w in q_lower for w in ("kalurahan", "desa", "tadah hujan", "irigasi", "ndvi terendah", "ndvi tertinggi")):
            dispatched.append({"name": "get_region_or_pest_summary", "args": {"topic": "regions"}, "result": execute_tool("get_region_or_pest_summary", {"topic": "regions"})})

    if any(w in q_lower for w in ("hama", "wereng", "penyakit", "peringatan dini")):
        dispatched.append({"name": "get_region_or_pest_summary", "args": {"topic": "pest"}, "result": execute_tool("get_region_or_pest_summary", {"topic": "pest"})})

    if any(w in q_lower for w in ("untung", "laba", "pendapatan", "prediksi hasil panen", "tonase", "harga jual")):
        dispatched.append({"name": "get_region_or_pest_summary", "args": {"topic": "benchmarks"}, "result": execute_tool("get_region_or_pest_summary", {"topic": "benchmarks"})})

    return dispatched


def format_tool_results_for_prompt(dispatched: list[dict[str, Any]]) -> str:
    """Serialize executed tool payloads compactly for LLM context."""
    return json.dumps(dispatched, ensure_ascii=False, indent=2)
