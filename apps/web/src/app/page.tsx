"use client";

import Link from "next/link";
import { useState } from "react";
import { Send, ThumbsDown, ThumbsUp, BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import type { ChatResponse } from "@/lib/types";

interface Bubble {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatResponse["citations"];
  tools_used?: string[];
  mode?: ChatResponse["mode"];
  rated?: 1 | -1;
}

const SAMPLE_QUESTIONS = [
  "Berapa biaya tanam padi per hektar dan rinciannya?",
  "Kalau lahan saya cuma 0,4 hektar, berapa modal tanam salak pondoh?",
  "Hama apa yang paling sering muncul di Cangkringan?",
  "Lahan saya elevasi 800 m, pH 5,8, NDVI 0,75, masuk segmen apa?",
  "Kalurahan mana yang paling banyak tadah hujan dan mana yang NDVI terendah?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Bubble[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Halo Pak/Bu Tani! Tanyakan biaya tanam, hama wereng, kondisi 5 kalurahan Cangkringan, atau kondisi pH dan elevasi lahan Anda. Jawaban mengacu pada data terverifikasi dan menyertakan sumbernya.",
      citations: [{ source: "Basis Pengetahuan TaniCerdas", detail: "Data terkurasi Cangkringan" }],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitQuestion(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userBubble: Bubble = {
      id: `u_${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    const nextHistory = [...messages, userBubble]
      .filter((m) => m.id !== "welcome")
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userBubble]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.chat({
        question: trimmed,
        history: nextHistory.slice(0, -1),
      });
      const assistantBubble: Bubble = {
        id: res.message_id,
        role: "assistant",
        content: res.answer,
        citations: res.citations,
        tools_used: res.tools_used,
        mode: res.mode,
      };
      setMessages((prev) => [...prev, assistantBubble]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghubungi server. Pastikan backend API sedang berjalan."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRate(msgId: string, rating: 1 | -1) {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, rated: rating } : m))
    );
    try {
      await api.sendFeedback({ message_id: msgId, rating });
    } catch {
      // keep optimistic UI quietly
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold text-ink md:text-2xl">
          Tanya Asisten TaniCerdas
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Tanya budidaya, biaya tanam sesuai luas lahan, hama, atau segmen lahan
          Cangkringan. Tidak mengarang angka di luar basis pengetahuan.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/analisis-lahan"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-leaf bg-white px-3.5 py-2 text-sm font-semibold text-leaf hover:bg-leaf-soft"
          >
            Buka Form Cek Lahan Lengkap
          </Link>
          <Link
            href="/kalkulator-biaya"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm font-semibold text-ink hover:bg-stone-100"
          >
            Hitung RAB &amp; Titik Impas
          </Link>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed md:max-w-[80%] ${
                    isUser
                      ? "bg-leaf-soft text-ink border border-green-200"
                      : "bg-canvas text-ink border border-line"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-line pt-2 text-xs text-ink-muted">
                      <BookOpen className="h-3.5 w-3.5 shrink-0 text-leaf" />
                      <span>Sumber:</span>
                      {msg.citations.map((cit, idx) => (
                        <span
                          key={`${cit.source}-${idx}`}
                          className="rounded-md bg-white px-2 py-0.5 font-medium border border-line"
                        >
                          {cit.source}
                        </span>
                      ))}
                      {msg.mode === "fallback" && (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 font-medium text-amber-900">
                          Mode Cadangan Deterministik
                        </span>
                      )}
                    </div>
                  )}

                  {!isUser && msg.id !== "welcome" && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRate(msg.id, 1)}
                        aria-label="Jawaban membantu"
                        className={`inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium border ${
                          msg.rated === 1
                            ? "border-leaf bg-leaf-soft text-leaf-dark"
                            : "border-line bg-white text-ink-muted"
                        }`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>Membantu</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRate(msg.id, -1)}
                        aria-label="Jawaban kurang tepat"
                        className={`inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium border ${
                          msg.rated === -1
                            ? "border-red-400 bg-red-50 text-red-700"
                            : "border-line bg-white text-ink-muted"
                        }`}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        <span>Kurang Tepat</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-line bg-canvas px-4 py-3 text-sm text-ink-muted">
                Sedang mengecek basis pengetahuan &amp; kalkulator data...
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitQuestion(input);
          }}
          className="flex flex-col gap-2 pt-2 sm:flex-row"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tulis pertanyaan Anda, mis. biaya tanam salak 0,5 ha..."
            className="min-h-[48px] flex-1 rounded-xl border border-line bg-canvas px-4 py-2.5 text-base text-ink placeholder:text-ink-muted focus:border-leaf focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || input.trim().length < 2}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-leaf px-5 py-2.5 text-base font-bold text-white transition-colors hover:bg-leaf-dark disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>Kirim</span>
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-ink">Contoh Pertanyaan Cepat:</p>
        <div className="mt-2.5 flex flex-col gap-2">
          {SAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => submitQuestion(q)}
              disabled={loading}
              className="min-h-[44px] rounded-xl border border-line bg-canvas px-3.5 py-2 text-left text-sm font-medium text-ink transition-colors hover:border-leaf hover:bg-leaf-soft"
            >
              {q}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
