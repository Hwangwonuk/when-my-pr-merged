"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ResyncButtonProps {
  installationId: string;
}

export function ResyncButton({ installationId }: ResyncButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "syncing" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus("syncing");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/installations/resync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installationId }),
      });

      if (res.ok) {
        router.refresh();
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
    status === "syncing" ? "동기화 중..." :
    status === "error" ? (errorMessage ? `실패: ${errorMessage}` : "실패") :
    "다시 동기화";

  const styles =
    status === "syncing"
      ? "bg-indigo-500/10 text-indigo-300 opacity-50 cursor-not-allowed"
      : status === "error"
      ? "bg-red-500/10 text-red-400"
      : "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20";

  return (
    <button
      onClick={handleClick}
      disabled={status === "syncing"}
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-200 ${styles}`}
    >
      {label}
    </button>
  );
}
