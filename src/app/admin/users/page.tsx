import { prisma } from "@/lib/prisma";
import { requireAgencyAdmin } from "@/lib/session";
import UsersTable from "./UsersTable";

export default async function AdminUsersPage() {
  const session = await requireAgencyAdmin();

  const users = await prisma.user.findMany({
    where: { role: "client_user", agencyId: session.user.agencyId! },
    orderBy: { createdAt: "desc" },
    include: { client: { select: { id: true, name: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Client Users</h1>
        <p className="text-sm text-gray-500">All client-side login accounts.</p>
      </div>
      <UsersTable
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          isActive: u.isActive,
          createdAt: u.createdAt,
          client: u.client,
        }))}
      />
    </div>
  );
}
