"""Anonymous SQLite telemetry for chat queries and feedback (zero PII)."""

from __future__ import annotations

import json
import os
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path


def _db_path() -> Path:
    raw = os.getenv("SQLITE_DB_PATH", "apps/api/storage/telemetry.db")
    path = Path(raw)
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def init_db() -> None:
    """Create telemetry tables if they do not exist."""
    with closing(sqlite3.connect(_db_path())) as conn:
        with conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS chat_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    message_id TEXT UNIQUE NOT NULL,
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    tools_used TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS chat_feedback (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    message_id TEXT NOT NULL,
                    rating INTEGER NOT NULL,
                    comment TEXT,
                    created_at TEXT NOT NULL
                )
                """
            )


def log_chat_turn(
    message_id: str,
    question: str,
    answer: str,
    mode: str,
    tools_used: list[str],
) -> None:
    """Persist an anonymized chat interaction without user identity."""
    now = datetime.now(timezone.utc).isoformat()
    with closing(sqlite3.connect(_db_path())) as conn:
        with conn:
            conn.execute(
                """
                INSERT OR IGNORE INTO chat_logs (message_id, question, answer, mode, tools_used, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (message_id, question, answer, mode, json.dumps(tools_used), now),
            )


def log_feedback(message_id: str, rating: int, comment: str | None = None) -> None:
    """Store anonymous thumbs-up/down rating for a chat message."""
    now = datetime.now(timezone.utc).isoformat()
    with closing(sqlite3.connect(_db_path())) as conn:
        with conn:
            conn.execute(
                """
                INSERT INTO chat_feedback (message_id, rating, comment, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (message_id, rating, comment, now),
            )
