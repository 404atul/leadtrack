"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateClientMetaPageId } from "@/lib/actions/client";

export default function MetaPageIdField({
  clientId,
  initialValue,
}: {
  clientId: string;
  initialValue: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateClientMetaPageId(clientId, formData);
        setEditing(false);
        router.refresh();
      } catch (e: any) {
        setError(e?.message ?? "Something went wrong.");
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Meta Page ID</p>
          <p className="mt-0.5 text-sm text-gray-800">{initialValue || "Not linked"}</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-2">
      <label className="block text-xs font-medium uppercase tracking-wide text-gray-400">Meta Page ID</label>
      <div className="flex gap-2">
        <input
          name="metaPageId"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 102938475610293"
          className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setValue(initialValue ?? "");
          }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
