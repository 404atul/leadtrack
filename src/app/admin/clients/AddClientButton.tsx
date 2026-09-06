"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { createClient } from "@/lib/actions/client";

export default function AddClientButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createClient(formData);
        setOpen(false);
        router.refresh();
      } catch (e: any) {
        setError(e?.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        + Add Client
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Client">
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Business Name</label>
            <input
              name="name"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Industry (optional)</label>
            <input
              name="industry"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {isPending ? "Creating..." : "Create Client"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
