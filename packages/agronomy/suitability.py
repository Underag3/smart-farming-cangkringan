"""Deterministic rule-based soil diagnosis and commodity suitability scoring."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class CropRule:
    """Agronomic tolerance & optimum profile grounded in Kementan/BSIP guidelines."""

    commodity: str
    variety: str
    elev_opt: tuple[float, float]
    elev_tol: tuple[float, float]
    ph_opt: tuple[float, float]
    ph_tol: tuple[float, float]
    water_need: str  # "high" | "medium" | "low"
    prefers_high_oc: bool
    note: str


CROP_RULES: tuple[CropRule, ...] = (
    CropRule(
        commodity="Salak Pondoh",
        variety="Pondoh Sleman",
        elev_opt=(400.0, 800.0),
        elev_tol=(100.0, 950.0),
        ph_opt=(5.5, 6.5),
        ph_tol=(4.5, 7.2),
        water_need="medium",
        prefers_high_oc=True,
        note="Sangat adaptif di tanah Regosol vulkanik agak asam lereng Merapi dengan mulsa/bahan organik.",
    ),
    CropRule(
        commodity="Padi",
        variety="IR64",
        elev_opt=(0.0, 650.0),
        elev_tol=(0.0, 1000.0),
        ph_opt=(5.5, 6.5),
        ph_tol=(5.0, 7.5),
        water_need="high",
        prefers_high_oc=False,
        note="Memerlukan pasokan air kontinyu (irigasi teknis/semi teknis) dan pengendalian preventif Wereng.",
    ),
    CropRule(
        commodity="Jagung",
        variety="Bisi 18",
        elev_opt=(0.0, 900.0),
        elev_tol=(0.0, 1200.0),
        ph_opt=(5.8, 7.0),
        ph_tol=(5.2, 7.5),
        water_need="low",
        prefers_high_oc=False,
        note="Adaptif sebagai tanaman rotasi palawija termasuk pada lahan tadah hujan berdrainase baik.",
    ),
    CropRule(
        commodity="Cabai Merah",
        variety="Keriting Lokal",
        elev_opt=(0.0, 900.0),
        elev_tol=(0.0, 1400.0),
        ph_opt=(6.0, 7.0),
        ph_tol=(5.5, 7.5),
        water_need="medium",
        prefers_high_oc=True,
        note="Menghendaki pH mendekati netral dan drainase baik untuk menekan penyakit saat hujan tinggi.",
    ),
    CropRule(
        commodity="Tomat",
        variety="Servo",
        elev_opt=(450.0, 1000.0),
        elev_tol=(200.0, 1400.0),
        ph_opt=(6.0, 6.5),
        ph_tol=(5.5, 7.2),
        water_need="medium",
        prefers_high_oc=True,
        note="Optimal pada suhu sejuk dataran menengah-atas Cangkringan dengan bedengan berdrainase baik.",
    ),
    CropRule(
        commodity="Bawang Merah",
        variety="Tajuk",
        elev_opt=(0.0, 550.0),
        elev_tol=(0.0, 750.0),
        ph_opt=(5.6, 6.5),
        ph_tol=(5.2, 7.0),
        water_need="low",
        prefers_high_oc=False,
        note="Lebih sesuai dataran rendah-menengah dan rentan curah hujan ekstrem; lebih cocok musim kemarau.",
    ),
)


def _range_score(value: float, opt: tuple[float, float], tol: tuple[float, float], weight: float) -> tuple[float, str]:
    """Return weighted score in [0, weight] and status label ('opt'|'tol'|'out')."""
    if opt[0] <= value <= opt[1]:
        return weight, "opt"
    if tol[0] <= value <= tol[1]:
        if value < opt[0]:
            frac = (value - tol[0]) / max(opt[0] - tol[0], 1e-6)
        else:
            frac = (tol[1] - value) / max(tol[1] - opt[1], 1e-6)
        return weight * (0.45 + 0.45 * max(0.0, min(1.0, frac))), "tol"
    return weight * 0.1, "out"


def diagnose_soil(
    elevation_m: float | None = None,
    soil_ph: float | None = None,
    organic_carbon: float | None = None,
    ndvi: float | None = None,
) -> list[dict[str, str]]:
    """Produce actionable agronomic diagnosis for provided soil & site parameters."""
    findings: list[dict[str, str]] = []

    if soil_ph is not None:
        if soil_ph < 5.5:
            findings.append(
                {
                    "parameter": "soil_ph",
                    "status": "Masam",
                    "recommendation": (
                        "pH tergolong masam (< 5,5). Lakukan pengapuran dolomit bertahap "
                        "(umumnya 1-3 ton/ha sesuai tekstur tanah, aplikasi 1-2 minggu sebelum tanam)."
                    ),
                }
            )
        elif soil_ph < 6.0:
            findings.append(
                {
                    "parameter": "soil_ph",
                    "status": "Agak Asam",
                    "recommendation": (
                        "pH agak asam (5,5-5,9). Cukup ramah untuk Salak Pondoh dan Padi, tetapi berikan "
                        "kapur dolomit ringan bila menanam Cabai Merah atau Tomat."
                    ),
                }
            )
        elif soil_ph <= 7.2:
            findings.append(
                {
                    "parameter": "soil_ph",
                    "status": "Mendekati Netral (Optimal)",
                    "recommendation": (
                        "pH berada pada kisaran ideal penyerapan hara (6,0-7,2). Pertahankan dengan pemupukan berimbang."
                    ),
                }
            )
        else:
            findings.append(
                {
                    "parameter": "soil_ph",
                    "status": "Basa",
                    "recommendation": (
                        "pH tinggi (> 7,2). Tambahkan bahan organik/kompos matang untuk membantu penyanggaan pH tanah."
                    ),
                }
            )

    if organic_carbon is not None:
        if organic_carbon < 2.0:
            findings.append(
                {
                    "parameter": "organic_carbon",
                    "status": "Rendah",
                    "recommendation": (
                        "Karbon organik rendah (< 2,0%). Prioritaskan penambahan kompos/pupuk kandang matang "
                        "dan pupuk hayati/probiotik untuk memperbaiki struktur tanah vulkanik."
                    ),
                }
            )
        elif organic_carbon < 2.5:
            findings.append(
                {
                    "parameter": "organic_carbon",
                    "status": "Sedang",
                    "recommendation": (
                        "Karbon organik sedang (2,0-2,49%). Tambahkan bahan organik saat olah tanah agar retensi lengas meningkat."
                    ),
                }
            )
        else:
            findings.append(
                {
                    "parameter": "organic_carbon",
                    "status": "Baik",
                    "recommendation": (
                        "Karbon organik baik (>= 2,5%). Pertahankan dengan pengembalian sisa panen atau mulsa organik."
                    ),
                }
            )

    if ndvi is not None:
        if ndvi < 0.55:
            findings.append(
                {
                    "parameter": "ndvi",
                    "status": "Vegetasi Jarang / Lahan Terbuka",
                    "recommendation": (
                        "NDVI rendah (< 0,55) menandakan tutupan hijau jarang. Gunakan mulsa organik atau tanaman penutup tanah "
                        "untuk menekan erosi dan penguapan."
                    ),
                }
            )
        elif ndvi < 0.72:
            findings.append(
                {
                    "parameter": "ndvi",
                    "status": "Vegetasi Sedang",
                    "recommendation": "Tutupan vegetasi cukup baik (0,55-0,71); jaga rotasi tanam dan pemeliharaan kanopi.",
                }
            )
        else:
            findings.append(
                {
                    "parameter": "ndvi",
                    "status": "Vegetasi Rapat",
                    "recommendation": (
                        "NDVI tinggi (>= 0,72) menunjukkan vegetasi sehat/rapat. Perhatikan jarak tanam dan sirkulasi udara "
                        "untuk mencegah kelembapan berlebih pemicu jamur."
                    ),
                }
            )

    if elevation_m is not None and elevation_m > 700:
        findings.append(
            {
                "parameter": "elevation_m",
                "status": "Lereng Atas Merapi",
                "recommendation": (
                    "Elevasi > 700 m memiliki suhu lebih sejuk dan kemiringan lebih curam. Terapkan terasering/rorak "
                    "untuk konservasi tanah dan air."
                ),
            }
        )

    return findings


def score_commodities(
    elevation_m: float,
    soil_ph: float,
    organic_carbon: float,
    ndvi: float,
    area_ha: float,
    irrigation: str | None,
    cost_lookup: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    """Score and rank the 6 Cangkringan commodities deterministically."""
    results: list[dict[str, Any]] = []

    for rule in CROP_RULES:
        reasons: list[str] = []
        elev_pts, elev_status = _range_score(elevation_m, rule.elev_opt, rule.elev_tol, 35.0)
        ph_pts, ph_status = _range_score(soil_ph, rule.ph_opt, rule.ph_tol, 35.0)

        if elev_status == "opt":
            reasons.append(f"Elevasi {elevation_m:.0f} m sesuai kisaran optimal ({rule.elev_opt[0]:.0f}-{rule.elev_opt[1]:.0f} m).")
        elif elev_status == "tol":
            reasons.append(f"Elevasi {elevation_m:.0f} m masih dapat ditoleransi dengan penyesuaian manajemen tanam.")
        else:
            reasons.append(f"Elevasi {elevation_m:.0f} m di luar rentang ideal ({rule.elev_opt[0]:.0f}-{rule.elev_opt[1]:.0f} m).")

        if ph_status == "opt":
            reasons.append(f"pH tanah {soil_ph:.2f} optimal ({rule.ph_opt[0]:.1f}-{rule.ph_opt[1]:.1f}).")
        elif ph_status == "tol":
            reasons.append(f"pH tanah {soil_ph:.2f} perlu koreksi ringan mendekati {rule.ph_opt[0]:.1f}-{rule.ph_opt[1]:.1f}.")
        else:
            reasons.append(f"pH tanah {soil_ph:.2f} kurang sesuai; butuh perbaikan pH lebih dulu.")

        # Irrigation & water compatibility (20 pts)
        water_pts = 15.0
        if irrigation == "Teknis":
            water_pts = 20.0
            reasons.append("Irigasi teknis mendukung kebutuhan air sepanjang musim.")
        elif irrigation == "Semi Teknis":
            water_pts = 17.0 if rule.water_need == "high" else 19.0
            reasons.append("Irigasi semi teknis cukup memadai dengan pengaturan jadwal tanam.")
        elif irrigation == "Tadah Hujan":
            if rule.water_need == "high":
                water_pts = 6.0
                reasons.append("Risiko pasokan air: irigasi tadah hujan kurang ideal untuk tanaman kebutuhan air tinggi.")
            elif rule.water_need == "medium":
                water_pts = 13.0
                reasons.append("Pada tadah hujan, tanam sebaiknya mengikuti awal musim hujan.")
            else:
                water_pts = 19.0
                reasons.append("Relatif adaptif pada lahan tadah hujan.")
        else:
            reasons.append("Tipe irigasi belum diisi; pastikan kecukupan air sesuai musim.")

        # Organic carbon & NDVI context (10 pts)
        if rule.prefers_high_oc:
            oc_pts = 10.0 if organic_carbon >= 2.3 else 6.5
        else:
            oc_pts = 9.0 if organic_carbon >= 1.8 else 7.0
        if rule.commodity == "Salak Pondoh" and ndvi >= 0.70:
            oc_pts = min(10.0, oc_pts + 1.0)

        total_score = round(elev_pts + ph_pts + water_pts + oc_pts)
        total_score = max(0, min(100, int(total_score)))

        if total_score >= 82:
            tier = "Sangat Cocok"
        elif total_score >= 65:
            tier = "Cukup Cocok"
        else:
            tier = "Perlu Penyesuaian"

        reasons.append(rule.note)
        cost_row = cost_lookup[rule.commodity]
        est_cost = round(cost_row["total_cost_per_ha"] * area_ha)

        results.append(
            {
                "commodity": rule.commodity,
                "variety": rule.variety,
                "score": total_score,
                "tier": tier,
                "reasons": reasons,
                "estimated_cost_for_area": est_cost,
            }
        )

    results.sort(key=lambda item: item["score"], reverse=True)
    return results
