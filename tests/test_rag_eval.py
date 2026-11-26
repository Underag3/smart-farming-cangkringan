"""Evaluation suite for Hybrid RAG + deterministic tool-calling."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from packages.rag.chat_service import answer_question


def test_golden_questions_fallback_mode(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    golden_path = Path(__file__).resolve().parent / "golden_questions.json"
    cases = json.loads(golden_path.read_text(encoding="utf-8"))

    for case in cases:
        res = answer_question(case["question"], history=case["history"])
        answer_lower = res["answer"].lower()
        for expected in case["expected_substrings"]:
            assert expected.lower() in answer_lower, (
                f"[{case['id']}] Expected '{expected}' in answer:\n{res['answer']}"
            )
        if case["expected_tool"]:
            assert case["expected_tool"] in res["tools_used"], (
                f"[{case['id']}] Expected tool '{case['expected_tool']}', got {res['tools_used']}"
            )
