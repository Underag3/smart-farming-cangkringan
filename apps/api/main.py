"""FastAPI entrypoint for TaniCerdas Cangkringan v2.0."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.api.routers import chat, cost, land, regions
from apps.api.storage.telemetry import init_db
from packages.agronomy.artifacts import (
    load_scaler,
    load_segment_profiles,
    load_segmentation_model,
    load_summary_data,
)
from packages.rag.retriever import get_retriever

load_dotenv()


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Warm up ML artifacts, RAG index, and SQLite tables on startup."""
    init_db()
    load_segmentation_model()
    load_scaler()
    load_segment_profiles()
    load_summary_data()
    get_retriever()
    yield


app = FastAPI(
    title="TaniCerdas Cangkringan API",
    version="2.0.0",
    description=(
        "API analisis kesesuaian lahan hibrida, kalkulator RAB, profil kalurahan, "
        "dan asisten chat agronomi berbasis Hybrid RAG + Tool-Calling."
    ),
    lifespan=lifespan,
)

raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
@app.get("/api/v1/health")
def health_check() -> dict:
    """Report service readiness, model silhouette, and LLM configuration status."""
    profil = load_segment_profiles()
    retriever = get_retriever()
    return {
        "status": "ok",
        "ml_model_loaded": True,
        "rag_chunks_loaded": len(retriever.chunks),
        "llm_configured": bool(os.getenv("LLM_API_KEY", "").strip()),
        "model_silhouette": profil["silhouette_score"],
    }


app.include_router(land.router, prefix="/api/v1")
app.include_router(cost.router, prefix="/api/v1")
app.include_router(regions.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
