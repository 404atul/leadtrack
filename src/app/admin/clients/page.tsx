import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAgencyAdmin } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import AddClientButton from "./AddClientButton";

export default async function AdminClientsPage() {
  const session = await requireAgencyAdmin();

  const clients = await prisma.client.findMany({
    where: { agencyId: session.user.agencyId! },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500">All clients managed by your agency.</p>
        </div>
        <AddClientButton />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Industry</th>
              <th className="px-5 py-3">Leads</th>
              <th className="px-5 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">
                  No clients yet. Add your first client to get started.
                </td>
              </tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="text-sm text-gray-700 hover:bg-gray-50">
                <td className="px-5 py-3">
                  <Link href={`/admin/clients/${c.id}`} className="font-medium text-brand-700 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-5 py-3">{c.industry ?? "—"}</td>
                <td className="px-5 py-3">{c._count.leads}</td>
                <td className="px-5 py-3 text-gray-500">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
