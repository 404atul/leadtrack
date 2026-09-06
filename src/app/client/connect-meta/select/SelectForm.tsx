"use client";

import { useState, useTransition } from "react";
import { saveMetaSelection } from "@/lib/actions/metaConnect";
import type { MetaPage, MetaAdAccount } from "@/lib/meta";

export default function SelectForm({
  attemptId,
  pages,
  adAccounts,
}: {
  attemptId: string;
  pages: MetaPage[];
  adAccounts: MetaAdAccount[];
}) {
  const [pageId, setPageId] = useState(pages[0]?.id ?? "");
  const [adAccountId, setAdAccountId] = useState(adAccounts[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await saveMetaSelection(attemptId, formData);
      } catch (e: any) {
        if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw e;
        setError(e?.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Facebook Page</p>
        <div className="space-y-2">
          {pages.map((page) => (
            <label
              key={page.id}
              className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
            >
              <input
                type="radio"
                name="pageId"
                value={page.id}
                checked={pageId === page.id}
                onChange={() => setPageId(page.id)}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500"
              />
              {page.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Ad Account</p>
        <div className="space-y-2">
          {adAccounts.map((account) => (
            <label
              key={account.id}
              className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
            >
              <input
                type="radio"
                name="adAccountId"
                value={account.id}
                checked={adAccountId === account.id}
                onChange={() => setAdAccountId(account.id)}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500"
              />
              {account.name}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !pageId || !adAccountId}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {isPending ? "Connecting..." : "Connect"}
      </button>
    </form>
  );
}
