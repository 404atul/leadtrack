"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSelectedClient } from "@/lib/actions/clientSwitcher";

export default function ClientSwitcher({
  clients,
  selectedClientId,
}: {
  clients: { id: string; name: string }[];
  selectedClientId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    startTransition(async () => {
      await setSelectedClient(value === "all" ? null : value);
      router.refresh();
    });
  }

  return (
    <select
      value={selectedClientId ?? "all"}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
    >
      <option value="all">View All Clients</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
