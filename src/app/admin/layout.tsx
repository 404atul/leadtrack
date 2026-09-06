import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireAgencyAdmin } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import { icons } from "@/components/NavIcons";
import ClientSwitcher from "@/components/ClientSwitcher";
import { SELECTED_CLIENT_COOKIE } from "@/lib/constants";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: icons.dashboard },
  { href: "/admin/clients", label: "Clients", icon: icons.clients },
  { href: "/admin/leads", label: "Leads", icon: icons.leads },
  { href: "/admin/users", label: "Users", icon: icons.users },
  { href: "/admin/billing", label: "Billing", icon: icons.billing },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAgencyAdmin({ allowInactiveBilling: true });
  const agencyId = session.user.agencyId!;

  const [agency, clients, selectedClientCookie] = await Promise.all([
    prisma.agency.findUnique({ where: { id: agencyId } }),
    prisma.client.findMany({
      where: { agencyId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    Promise.resolve(cookies().get(SELECTED_CLIENT_COOKIE)?.value ?? null),
  ]);

  const selectedClientId = clients.some((c) => c.id === selectedClientCookie)
    ? selectedClientCookie
    : null;

  const selectedClient = selectedClientId
    ? clients.find((c) => c.id === selectedClientId) ?? null
    : null;

  const trialDaysLeft =
    agency?.subscriptionStatus === "trialing" && agency.trialEndsAt
      ? Math.max(0, Math.ceil((agency.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        items={NAV_ITEMS}
        title="LeadTrack CRM"
        subtitle={agency?.name ?? "Agency"}
        userName={session.user.name ?? session.user.email ?? "Admin"}
      />
      <div className="flex flex-1 flex-col">
        {trialDaysLeft !== null && (
          <div className="bg-amber-50 px-6 py-2 text-center text-sm text-amber-800">
            {trialDaysLeft > 0
              ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your trial.`
              : "Your trial has ended."}{" "}
            <a href="/admin/billing" className="font-medium underline">
              Upgrade now
            </a>
          </div>
        )}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="text-sm text-gray-500">
            {selectedClient ? (
              <>
                Viewing <span className="font-medium text-gray-800">{selectedClient.name}</span>
              </>
            ) : (
              <>
                Viewing <span className="font-medium text-gray-800">all clients</span>
              </>
            )}
          </div>
          <ClientSwitcher clients={clients} selectedClientId={selectedClientId} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
