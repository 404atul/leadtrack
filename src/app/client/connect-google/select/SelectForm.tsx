"use client";

import { useState, useTransition } from "react";
import { saveGoogleSelection } from "@/lib/actions/googleConnect";
import type { GoogleCustomer } from "@/lib/google";

export default function SelectForm({
  attemptId,
  customers,
}: {
  attemptId: string;
  customers: GoogleCustomer[];
}) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await saveGoogleSelection(attemptId, formData);
      } catch (e: any) {
        if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw e;
        setError(e?.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Google Ads Account</p>
        <div className="space-y-2">
          {customers.map((customer) => (
            <label
              key={customer.id}
              className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
            >
              <input
                type="radio"
                name="customerId"
                value={customer.id}
                checked={customerId === customer.id}
                onChange={() => setCustomerId(customer.id)}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500"
              />
              {customer.name} <span className="text-gray-400">({customer.id})</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !customerId}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {isPending ? "Connecting..." : "Connect"}
      </button>
    </form>
  );
}
