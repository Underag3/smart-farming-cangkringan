"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { api } from "@/lib/api";
import type { ChatResponse } from "@/lib/types";

interface Bubble {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatResponse["citations"];
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

export function ChatAtelier() {
  const params = useSearchParams();
  const initialQuery = params.get("q");
  const triggeredInitial = useRef<string | null>(null);

  const [messages, setMessages] = useState<Bubble[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Selamat datang di ruang tanya TaniCerdas. Ajukan pertanyaan seputar biaya tanam sesuai luas lahan, hama wereng, kondisi 5 kalurahan, atau profil pH dan elevasi lahan Anda.",
      citations: [
        { source: "Basis Pengetahuan Terkurasi", detail: "6 dokumen Cangkringan" },
      ],
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
        mode: res.mode,
      };
      setMessages((prev) => [...prev, assistantBubble]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghubungi API backend. Pastikan server FastAPI berjalan."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery && triggeredInitial.current !== initialQuery) {
      triggeredInitial.current = initialQuery;
      submitQuestion(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  async function handleRate(msgId: string, rating: 1 | -1) {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, rated: rating } : m))
    );
    try {
      await api.sendFeedback({ message_id: msgId, rating });
    } catch {
      // keep optimistic UI
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left: Chat Surface */}
      <div className="lg:col-span-8">
        <div className="rounded-[6px] border border-[rgba(48,48,48,0.2)] bg-[#F2EADA]">
          <div className="flex items-center justify-between border-b border-[rgba(48,48,48,0.16)] px-5 py-3 text-xs text-[#5C584F]">
            <span className="uppercase tracking-[0.12em]">
              Ruang Konsultasi Agronomi
            </span>
            <span>Sitasi Wajib · Anti-Halusinasi</span>
          </div>

          <div className="max-h-[460px] space-y-4 overflow-y-auto p-5">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[92%] rounded-[4px] px-4 py-3.5 text-[15px] leading-relaxed md:max-w-[82%] ${
                      isUser
                        ? "bg-[#20462B] text-[#F2EADA]"
                        : "border border-[rgba(48,48,48,0.18)] bg-[#DFD7C9]/65 text-[#303030]"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>

                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[rgba(48,48,48,0.14)] pt-2.5 text-[11px] text-[#5C584F]">
                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-[#20462B]" />
                        <span>Sumber:</span>
                        {msg.citations.map((cit, idx) => (
                          <span
                            key={`${cit.source}-${idx}`}
                            className="rounded-[3px] border border-[rgba(48,48,48,0.18)] bg-[#F2EADA] px-2 py-0.5 font-medium text-[#303030]"
                          >
                            {cit.source}
                          </span>
                        ))}
                        {msg.mode === "fallback" && (
                          <span className="rounded-[3px] border border-dashed border-[#8D6E63] px-2 py-0.5 font-medium text-[#8D6E63]">
                            Mode Cadangan Deterministik
                          </span>
                        )}
                      </div>
                    )}

                    {!isUser && msg.id !== "welcome" && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRate(msg.id, 1)}
                          className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-[3px] border px-2.5 py-1 text-xs transition-colors ${
                            msg.rated === 1
                              ? "border-[#20462B] bg-[#20462B] text-[#F2EADA]"
                              : "border-[rgba(48,48,48,0.2)] bg-[#F2EADA] text-[#5C584F] hover:text-[#303030]"
                          }`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span>Membantu</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRate(msg.id, -1)}
                          className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-[3px] border px-2.5 py-1 text-xs transition-colors ${
                            msg.rated === -1
                              ? "border-red-700 bg-red-800 text-white"
                              : "border-[rgba(48,48,48,0.2)] bg-[#F2EADA] text-[#5C584F] hover:text-[#303030]"
                          }`}
                        >
                          <ThumbsDown className="h-3 w-3" />
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
                <div className="rounded-[4px] border border-[rgba(48,48,48,0.18)] bg-[#DFD7C9]/65 px-4 py-3 text-sm text-[#5C584F]">
                  Menelusuri basis pengetahuan &amp; menghitung data...
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-5 mb-3 rounded-[4px] border border-red-400 bg-red-50 p-3 text-sm text-red-900">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitQuestion(input);
            }}
            className="flex flex-col gap-2 border-t border-[rgba(48,48,48,0.16)] p-4 sm:flex-row"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pertanyaan Anda, mis. biaya tanam salak 0,4 ha..."
              className="min-h-[48px] flex-1 rounded-[4px] border border-[rgba(48,48,48,0.25)] bg-[#DFD7C9]/45 px-4 text-base text-[#303030] placeholder:text-[#5C584F] focus:border-[#20462B] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || input.trim().length < 2}
              className="btn-drs-primary px-6"
            >
              <Send className="h-4 w-4" />
              <span>Kirim</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right: Prompt Chips in Dashed Architectural List */}
      <div className="flex flex-col justify-between lg:col-span-4">
        <div>
          <p className="eyebrow-tag">
            <span className="h-1.5 w-1.5 rounded-full bg-[#20462B]" />
            <span>Contoh Pertanyaan Uji</span>
          </p>
          <p className="mt-2 text-sm text-[#5C584F]">
            Ketuk salah satu skenario di bawah untuk menguji kalkulator tool
            otomatis dan pencarian basis pengetahuan:
          </p>
          <div className="mt-4 space-y-2.5">
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => submitQuestion(q)}
                disabled={loading}
                className="group flex min-h-[48px] w-full items-center justify-between gap-3 rounded-[4px] border border-dashed border-[rgba(48,48,48,0.4)] px-3.5 py-2.5 text-left text-sm text-[#303030] transition-all hover:border-[#20462B] hover:bg-[#F2EADA]"
              >
                <span>{q}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#5C584F] transition-transform group-hover:translate-x-1 group-hover:text-[#20462B]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
