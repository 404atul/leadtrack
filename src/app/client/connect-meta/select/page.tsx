import { prisma } from "@/lib/prisma";
import { requireClientUser } from "@/lib/session";
import SelectForm from "./SelectForm";
import type { MetaPage, MetaAdAccount } from "@/lib/meta";

const ATTEMPT_TTL_MS = 30 * 60 * 1000;

export default async function ConnectMetaSelectPage({
  searchParams,
}: {
  searchParams: { attempt?: string };
}) {
  const session = await requireClientUser();
  const attemptId = searchParams.attempt;

  if (!attemptId) {
    return (
      <ExpiredState message="No connection attempt was specified. Please reconnect with Meta." />
    );
  }

  const attempt = await prisma.metaConnectionAttempt.findFirst({
    where: { id: attemptId, clientId: session.user.clientId! },
  });

  if (!attempt) {
    return <ExpiredState message="This link is invalid. Please reconnect with Meta." />;
  }

  if (Date.now() - attempt.createdAt.getTime() > ATTEMPT_TTL_MS) {
    await prisma.metaConnectionAttempt.delete({ where: { id: attempt.id } }).catch(() => {});
    return <ExpiredState message="This connection attempt expired. Please reconnect with Meta." />;
  }

  const pages = attempt.pagesJson as unknown as MetaPage[];
  const adAccounts = attempt.adAccountsJson as unknown as MetaAdAccount[];

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Finish connecting Meta</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose which Facebook Page and ad account to use for this client.
        </p>
      </div>
      <SelectForm attemptId={attempt.id} pages={pages} adAccounts={adAccounts} />
    </div>
  );
}

function ExpiredState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-lg font-semibold text-gray-900">Connection not found</h1>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
      <a
        href="/api/auth/meta/connect"
        className="mt-4 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Connect with Meta
      </a>
    </div>
  );
}
