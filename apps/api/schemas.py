"""Pydantic v2 request and response schemas for TaniCerdas API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class LandAnalyzeRequest(BaseModel):
    """Input validation for biophysical land evaluation."""

    elevation_m: float = Field(..., ge=0, le=3000, description="Elevasi lahan dalam meter dpl.")
    soil_ph: float = Field(..., ge=0, le=14, description="pH tanah (0-14).")
    organic_carbon: float = Field(..., ge=0, le=20, description="Karbon organik tanah (%).")
    ndvi: float = Field(..., ge=-1, le=1, description="Indeks vegetasi NDVI (-1 s.d. 1).")
    area_ha: float = Field(1.0, gt=0, le=100, description="Luas lahan dalam hektar (>0 s.d. 100).")
    irrigation: Literal["Teknis", "Semi Teknis", "Tadah Hujan"] | None = Field(
        default=None,
        description="Jenis irigasi opsional.",
    )


class CostEstimateRequest(BaseModel):
    """Input validation for proportional RAB & break-even calculator."""

    commodity: str = Field(..., min_length=2, max_length=60)
    area_ha: float = Field(1.0, gt=0, le=100)
    target_yield_ton_per_ha: float | None = Field(default=None, gt=0, le=100)


class ChatMessage(BaseModel):
    """Single message turn in short conversation history."""

    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    """Chat query payload with optional multi-turn history and land context."""

    question: str = Field(..., min_length=2, max_length=600)
    history: list[ChatMessage] = Field(default_factory=list, max_length=10)
    land_context: dict | None = Field(default=None)


class FeedbackRequest(BaseModel):
    """Anonymous thumbs-up/down feedback for chat evaluation."""

    message_id: str = Field(..., min_length=4, max_length=64)
    rating: Literal[1, -1]
    comment: str | None = Field(default=None, max_length=300)
