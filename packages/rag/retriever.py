"""Hybrid lexical (BM25) + char/word TF-IDF retriever over curated knowledge base."""

from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

STOPWORDS = {
    "atau", "dan", "yang", "di", "ke", "dari", "ini", "itu", "adalah", "untuk",
    "pada", "dengan", "jika", "bila", "apa", "siapa", "bagaimana", "berapa",
    "mana", "kapan", "kenapa", "mengapa", "cara", "saya", "anda", "kita",
    "bisa", "dapat", "ada", "tidak", "bukan", "cuma", "sama", "sudah", "belum",
    "akan", "lebih", "paling", "kalau", "tentang", "masuk", "sekitar", "dalam",
    "oleh", "sebagai", "seperti", "juga", "hanya", "masih", "lagi", "nya",
}

SYNONYMS = {
    "lombok": "cabai merah",
    "brambang": "bawang merah",
    "modal": "biaya",
    "ongkos": "biaya",
    "anggaran": "biaya",
    "desa": "kalurahan",
    "kelurahan": "kalurahan",
    "masam": "asam",
    "kapur": "dolomit pengapuran",
    "untung": "pendapatan harga",
    "laba": "pendapatan harga",
    "penghasilan": "pendapatan harga",
    "panen": "hasil panen yield",
    "air": "irigasi curah hujan",
    "hujan": "curah hujan cuaca",
    "tinggi": "elevasi mdpl",
    "ketinggian": "elevasi mdpl",
}


@dataclass(frozen=True)
class KnowledgeChunk:
    """Single section chunk from curated markdown files."""

    chunk_id: str
    filename: str
    source: str
    title: str
    content: str


def _tokenize(text: str) -> list[str]:
    """Normalize Indonesian text and expand domain synonyms."""
    lower = text.lower()
    for src, target in SYNONYMS.items():
        if re.search(rf"\b{re.escape(src)}\b", lower):
            lower = f"{lower} {target}"
    tokens = re.findall(r"[a-z0-9_]+", lower)
    return [t for t in tokens if len(t) > 1 and t not in STOPWORDS]


def _parse_frontmatter(raw: str) -> tuple[dict[str, str], str]:
    """Extract simple YAML-style header metadata if present."""
    if not raw.startswith("---"):
        return {}, raw
    parts = raw.split("---", 2)
    if len(parts) < 3:
        return {}, raw
    meta: dict[str, str] = {}
    for line in parts[1].strip().splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, parts[2].strip()


def _slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug or "intro"


def load_chunks_from_dir(kb_dir: Path | None = None) -> list[KnowledgeChunk]:
    """Read and split curated markdown documents by H2/H3 sections."""
    base_dir = kb_dir or (Path(__file__).resolve().parent / "knowledge_base")
    chunks: list[KnowledgeChunk] = []

    for md_path in sorted(base_dir.glob("*.md")):
        raw = md_path.read_text(encoding="utf-8")
        meta, body = _parse_frontmatter(raw)
        source = meta.get("sumber", md_path.name)

        sections = re.split(r"(?m)^(?=##\s+)", body)
        for idx, sec in enumerate(sections):
            text = sec.strip()
            if not text:
                continue
            first_line = text.splitlines()[0].lstrip("# ").strip()
            chunk_id = f"{md_path.name}#{_slugify(first_line)}-{idx}"
            chunks.append(
                KnowledgeChunk(
                    chunk_id=chunk_id,
                    filename=md_path.name,
                    source=source,
                    title=first_line,
                    content=text,
                )
            )
    return chunks


class HybridRetriever:
    """Combines BM25Okapi and TF-IDF cosine similarity using Reciprocal Rank Fusion."""

    def __init__(self, chunks: list[KnowledgeChunk]) -> None:
        self.chunks = chunks
        tokenized_corpus = [_tokenize(f"{c.title} {c.content}") for c in chunks]
        self.bm25 = BM25Okapi(tokenized_corpus)
        self.tfidf = TfidfVectorizer(ngram_range=(1, 2), lowercase=True)
        self.tfidf_matrix = self.tfidf.fit_transform([f"{c.title}\n{c.content}" for c in chunks])

    def search(self, query: str, top_k: int = 4) -> list[dict[str, Any]]:
        """Return top_k chunks ranked by RRF along with lexical signal strength."""
        q_tokens = _tokenize(query)
        if not q_tokens:
            return []

        bm25_scores = np.asarray(self.bm25.get_scores(q_tokens), dtype=float)
        q_vec = self.tfidf.transform([f"{query} {' '.join(q_tokens)}"])
        tfidf_scores = cosine_similarity(q_vec, self.tfidf_matrix).ravel()

        bm25_ranks = np.argsort(-bm25_scores)
        tfidf_ranks = np.argsort(-tfidf_scores)

        rrf_scores = np.zeros(len(self.chunks), dtype=float)
        k_rrf = 60.0
        for rank, idx in enumerate(bm25_ranks):
            if bm25_scores[idx] > 0:
                rrf_scores[idx] += 1.0 / (k_rrf + rank + 1)
        for rank, idx in enumerate(tfidf_ranks):
            if tfidf_scores[idx] > 0:
                rrf_scores[idx] += 1.0 / (k_rrf + rank + 1)

        order = np.argsort(-rrf_scores)
        results: list[dict[str, Any]] = []
        for idx in order[:top_k]:
            bm25_val = float(bm25_scores[idx])
            tfidf_val = float(tfidf_scores[idx])
            if bm25_val < 1.5 and tfidf_val < 0.12:
                continue
            chunk = self.chunks[int(idx)]
            results.append(
                {
                    "chunk_id": chunk.chunk_id,
                    "filename": chunk.filename,
                    "source": chunk.source,
                    "title": chunk.title,
                    "content": chunk.content,
                    "score": round(float(rrf_scores[idx]), 5),
                    "bm25_score": round(bm25_val, 3),
                    "tfidf_score": round(tfidf_val, 3),
                }
            )
        return results


@lru_cache(maxsize=1)
def get_retriever() -> HybridRetriever:
    """Return cached singleton HybridRetriever instance."""
    return HybridRetriever(load_chunks_from_dir())
