"""Cached loader for exported ML models and audited JSON artifacts."""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib


def get_artifacts_dir() -> Path:
    """Resolve directory containing model_segmentasi.joblib and JSON files."""
    env_dir = os.getenv("ARTIFACTS_DIR")
    if env_dir:
        return Path(env_dir)
    repo_root = Path(__file__).resolve().parents[2]
    return repo_root / "apps" / "api" / "artifacts"


@lru_cache(maxsize=1)
def load_segmentation_model() -> Any:
    """Load fitted KMeans model."""
    return joblib.load(get_artifacts_dir() / "model_segmentasi.joblib")


@lru_cache(maxsize=1)
def load_scaler() -> Any:
    """Load fitted StandardScaler."""
    return joblib.load(get_artifacts_dir() / "scaler_segmentasi.joblib")


@lru_cache(maxsize=1)
def load_segment_profiles() -> dict[str, Any]:
    """Load verified segment profiles and feature bounds."""
    path = get_artifacts_dir() / "profil_segmen.json"
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_summary_data() -> dict[str, Any]:
    """Load audited regional, cost, weather, pest, and benchmark data."""
    path = get_artifacts_dir() / "data_ringkas.json"
    return json.loads(path.read_text(encoding="utf-8"))
