"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SlackDisconnectButtonProps {
  installationId: string;
}

export function SlackDisconnectButton({ installationId }: SlackDisconnectButtonProps) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    if (!window.confirm("Slack 연동을 해제하시겠습니까? 모든 알림 설정이 삭제됩니다.")) {
      return;
    }

    setDisconnecting(true);
    try {
      const res = await fetch("/api/slack/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installationId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <button
      onClick={handleDisconnect}
      disabled={disconnecting}
      className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-200 ${
        disconnecting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      {disconnecting ? "해제 중..." : "연동 해제"}
    </button>
  );
}
