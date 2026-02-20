"use client";

import { useState } from "react";

interface TestMessageButtonProps {
  installationId: string;
}

export function TestMessageButton({ installationId }: TestMessageButtonProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus("sending");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/slack/test-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installationId }),
      });

      if (res.ok) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error ?? `HTTP ${res.status}`);
        setStatus("error");
        setTimeout(() => {
          setStatus("idle");
          setErrorMessage(null);
        }, 3000);
      }
    } catch {
      setErrorMessage("네트워크 오류");
      setStatus("error");
      setTimeout(() => {
        setStatus("idle");
        setErrorMessage(null);
      }, 3000);
    }
  }

  const label =
    status === "idle" ? "테스트 메시지 전송" :
    status === "sending" ? "전송 중..." :
    status === "success" ? "전송 완료!" :
    errorMessage ? `전송 실패: ${errorMessage}` : "전송 실패";

  const styles = {
    idle: "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20",
    sending: "bg-indigo-500/10 text-indigo-300 opacity-50 cursor-not-allowed",
    success: "bg-green-500/10 text-green-400",
    error: "bg-red-500/10 text-red-400",
  };

  return (
    <button
      onClick={handleClick}
      disabled={status === "sending"}
      className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${styles[status]}`}
    >
      {label}
    </button>
  );
}
