import { prisma } from "@/lib/prisma";
import { requireClientUser } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import { icons } from "@/components/NavIcons";

const NAV_ITEMS = [{ href: "/client/dashboard", label: "Dashboard", icon: icons.dashboard }];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await requireClientUser();

  const client = await prisma.client.findUnique({
    where: { id: session.user.clientId! },
    select: { name: true },
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        items={NAV_ITEMS}
        title={client?.name ?? "LeadTrack CRM"}
        subtitle="Client Portal"
        userName={session.user.name ?? session.user.email ?? "User"}
      />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
