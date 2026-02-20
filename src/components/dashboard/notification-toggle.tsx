"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface NotificationToggleProps {
  installationId: string;
  field: string;
  label: string;
  description: string;
  enabled: boolean;
}

export function NotificationToggle({
  installationId,
  field,
  label,
  description,
  enabled: initialEnabled,
}: NotificationToggleProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    setSaving(true);
    const newValue = !enabled;
    try {
      const res = await fetch("/api/slack/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installationId,
          field,
          value: newValue,
        }),
      });
      if (res.ok) {
        setEnabled(newValue);
        router.refresh();
      }
    } catch {
      // revert on failure
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        onClick={handleToggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-indigo-600" : "bg-gray-600"
        } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
