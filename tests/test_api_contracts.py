"""FastAPI contract and validation tests."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from apps.api.main import app


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_file = tmp_path / "test_telemetry.db"
    monkeypatch.setenv("SQLITE_DB_PATH", str(db_file))
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    with TestClient(app) as c:
        yield c


def test_health_endpoints(client: TestClient) -> None:
    for path in ("/health", "/api/v1/health"):
        resp = client.get(path)
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert body["ml_model_loaded"] is True
        assert body["rag_chunks_loaded"] >= 6
        assert body["model_silhouette"] == 0.2233


def test_land_analyze_valid_and_422_validation(client: TestClient) -> None:
    ok_resp = client.post(
        "/api/v1/land/analyze",
        json={
            "elevation_m": 760,
            "soil_ph": 5.9,
            "organic_carbon": 2.6,
            "ndvi": 0.77,
            "area_ha": 0.8,
            "irrigation": "Semi Teknis",
        },
    )
    assert ok_resp.status_code == 200
    body = ok_resp.json()
    assert body["exploratory_segment"]["id"] == "B"
    assert len(body["commodity_suitability"]) == 6
    assert "eksploratif" in body["exploratory_segment"]["disclaimer"].lower()

    bad_ph = client.post(
        "/api/v1/land/analyze",
        json={
            "elevation_m": 700,
            "soil_ph": 99,
            "organic_carbon": 2.5,
            "ndvi": 0.7,
        },
    )
    assert bad_ph.status_code == 422

    bad_ndvi = client.post(
        "/api/v1/land/analyze",
        json={
            "elevation_m": 700,
            "soil_ph": 6.2,
            "organic_carbon": 2.5,
            "ndvi": 1.5,
        },
    )
    assert bad_ndvi.status_code == 422


def test_cost_and_regions_and_audit_endpoints(client: TestClient) -> None:
    costs_resp = client.get("/api/v1/costs")
    assert costs_resp.status_code == 200
    assert len(costs_resp.json()["costs"]) == 6

    est_resp = client.post(
        "/api/v1/cost/estimate",
        json={"commodity": "Salak Pondoh", "area_ha": 0.4},
    )
    assert est_resp.status_code == 200
    assert est_resp.json()["scaled_cost"]["total"] == 3759381

    reg_resp = client.get("/api/v1/regions")
    assert reg_resp.status_code == 200
    assert len(reg_resp.json()["regions"]) == 5
    assert len(reg_resp.json()["sample_plots"]) == 100

    audit_resp = client.get("/api/v1/audit")
    assert audit_resp.status_code == 200
    assert audit_resp.json()["clustering"]["silhouette_4feat"] == 0.2233


def test_chat_fallback_and_feedback(client: TestClient) -> None:
    chat_resp = client.post(
        "/api/v1/chat",
        json={"question": "Berapa biaya tanam padi per hektar?"},
    )
    assert chat_resp.status_code == 200
    data = chat_resp.json()
    assert data["mode"] == "fallback"
    assert "14.318.434" in data["answer"]

    fb_resp = client.post(
        "/api/v1/feedback",
        json={"message_id": data["message_id"], "rating": 1, "comment": "Jelas"},
    )
    assert fb_resp.status_code == 200
    assert fb_resp.json()["status"] == "recorded"
