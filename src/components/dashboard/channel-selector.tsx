"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Channel {
  id: string;
  name: string;
}

interface ChannelSelectorProps {
  installationId: string;
  currentChannelId: string | null;
  currentChannelName: string | null;
}

export function ChannelSelector({
  installationId,
  currentChannelId,
  currentChannelName,
}: ChannelSelectorProps) {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<{
    id: string;
    name: string;
  } | null>(
    currentChannelId && currentChannelName
      ? { id: currentChannelId, name: currentChannelName }
      : null
  );

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/slack/channels?installationId=${installationId}`)
      .then((res) => res.json())
      .then((data) => {
        setChannels(data.channels ?? []);
      })
      .catch(() => setChannels([]))
      .finally(() => setLoading(false));
  }, [open, installationId]);

  async function handleSelect(channel: Channel) {
    setSaving(true);
    try {
      await fetch("/api/slack/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installationId,
          channelId: channel.id,
          channelName: channel.name,
        }),
      });
      setSelected(channel);
      setOpen(false);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm text-gray-400 mb-1">알림 채널</p>
          <p className="text-white">
            {selected ? `#${selected.name}` : "미설정"}
          </p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="ml-auto text-sm px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
        >
          {selected ? "변경" : "채널 선택"}
        </button>
      </div>

      {open && (
        <div className="mt-3 rounded-lg bg-gray-900 border border-gray-700 max-h-60 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-500 p-3">채널 목록 불러오는 중...</p>
          ) : channels.length === 0 ? (
            <p className="text-sm text-gray-500 p-3">
              채널이 없습니다. 봇이 접근 가능한 퍼블릭 채널이 필요합니다.
            </p>
          ) : (
            channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => handleSelect(ch)}
                disabled={saving}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-800 transition-colors ${
                  selected?.id === ch.id
                    ? "text-indigo-400 bg-gray-800/50"
                    : "text-gray-300"
                }`}
              >
                #{ch.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
