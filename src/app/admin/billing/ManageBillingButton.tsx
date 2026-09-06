"use client";

import { useState, useTransition } from "react";
import { openBillingPortal } from "@/lib/actions/billing";

export default function ManageBillingButton() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await openBillingPortal();
      } catch (e: any) {
        if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw e;
        setError(e?.message ?? "Something went wrong opening the billing portal.");
      }
    });
  }

  return (
    <div className="text-right">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        {isPending ? "Opening..." : "Manage Billing"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
