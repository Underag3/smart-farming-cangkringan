"""Agronomy AI chat and anonymous feedback endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from apps.api.schemas import ChatRequest, FeedbackRequest
from apps.api.storage.telemetry import log_chat_turn, log_feedback
from packages.rag.chat_service import answer_question

router = APIRouter(tags=["chat"])


@router.post("/chat")
def post_chat(payload: ChatRequest) -> dict:
    """Answer user farming question using Hybrid RAG + Tool-Calling."""
    history = [{"role": m.role, "content": m.content} for m in payload.history]
    result = answer_question(
        question=payload.question,
        history=history,
        land_context=payload.land_context,
    )
    log_chat_turn(
        message_id=result["message_id"],
        question=payload.question,
        answer=result["answer"],
        mode=result["mode"],
        tools_used=result["tools_used"],
    )
    return result


@router.post("/feedback")
def post_feedback(payload: FeedbackRequest) -> dict:
    """Save anonymous user rating for a chat response."""
    log_feedback(
        message_id=payload.message_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    return {"status": "recorded", "message_id": payload.message_id}
