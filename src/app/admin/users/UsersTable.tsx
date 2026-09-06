"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { setClientUserActive } from "@/lib/actions/user";
import EditUserButton from "./EditUserButton";

export type ClientUserRow = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  client: { id: string; name: string } | null;
};

export default function UsersTable({ users }: { users: ClientUserRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function toggleActive(userId: string, next: boolean) {
    setPendingId(userId);
    startTransition(async () => {
      await setClientUserActive(userId, next);
      setPendingId(null);
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <th className="px-5 py-3">Name</th>
            <th className="px-5 py-3">Email</th>
            <th className="px-5 py-3">Client</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Created</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">
                No client users yet. Create one from a client&apos;s detail page.
              </td>
            </tr>
          )}
          {users.map((u) => (
            <tr key={u.id} className="text-sm text-gray-700">
              <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
              <td className="px-5 py-3">{u.email}</td>
              <td className="px-5 py-3">
                {u.client ? (
                  <Link href={`/admin/clients/${u.client.id}`} className="text-brand-700 hover:underline">
                    {u.client.name}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-5 py-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                    u.isActive ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-gray-100 text-gray-500 ring-gray-500/20"
                  }`}
                >
                  {u.isActive ? "Active" : "Deactivated"}
                </span>
              </td>
              <td className="px-5 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-3">
                  <EditUserButton userId={u.id} name={u.name} />
                  <button
                    disabled={isPending && pendingId === u.id}
                    onClick={() => toggleActive(u.id, !u.isActive)}
                    className="text-sm font-medium text-gray-500 hover:text-gray-800 disabled:opacity-50"
                  >
                    {u.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
