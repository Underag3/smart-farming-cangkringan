"""Verify integrity of exported ML artifacts and summary data."""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np


def verify(artifacts_dir: Path) -> None:
    """Assert centroids map back to their own segments and cost sums are exact."""
    model = joblib.load(artifacts_dir / "model_segmentasi.joblib")
    scaler = joblib.load(artifacts_dir / "scaler_segmentasi.joblib")
    profil = json.loads((artifacts_dir / "profil_segmen.json").read_text(encoding="utf-8"))
    ringkas = json.loads((artifacts_dir / "data_ringkas.json").read_text(encoding="utf-8"))

    raw_to_canonical = {int(k): v for k, v in profil["raw_to_canonical"].items()}

    for seg in profil["segments"]:
        c = seg["centroid"]
        vec = np.array([[c["elevation_m"], c["soil_ph"], c["organic_carbon"], c["ndvi"]]])
        scaled = scaler.transform(vec)
        raw_pred = int(model.predict(scaled)[0])
        mapped = raw_to_canonical[raw_pred]
        assert mapped == seg["id"], f"Centroid {seg['id']} mapped to {mapped}!"
        print(f"[OK] Centroid Segmen {seg['id']} ({seg['name']}) -> {mapped}")

    for item in ringkas["costs"]:
        calc = (
            item["seed_cost"]
            + item["fertilizer_cost"]
            + item["pesticide_cost"]
            + item["labor_cost"]
        )
        assert calc == item["total_cost_per_ha"], f"Cost mismatch for {item['commodity']}"
    print(f"[OK] Cost_Data checksum passed for {len(ringkas['costs'])} commodities")
    print(f"[OK] Sample plots verified: {len(ringkas['sample_plots'])} plots across {len(ringkas['regions'])} kalurahan")


if __name__ == "__main__":
    verify(Path("apps/api/artifacts"))
