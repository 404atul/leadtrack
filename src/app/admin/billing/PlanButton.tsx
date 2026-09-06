"use client";

import { useState, useTransition } from "react";
import { startCheckout } from "@/lib/actions/billing";
import type { PlanKey } from "@/lib/billing";

export default function PlanButton({ planKey }: { planKey: PlanKey }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await startCheckout(planKey);
      } catch (e: any) {
        if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw e;
        setError(e?.message ?? "Something went wrong starting checkout.");
      }
    });
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {isPending ? "Redirecting..." : "Start 14-day free trial"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
