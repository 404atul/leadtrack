"use client";

import { useState } from "react";

export default function CopyWebhookUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — the input is still
      // selectable so the user can copy manually.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-700"
      />
      <button
        onClick={handleCopy}
        className="shrink-0 rounded-md bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
