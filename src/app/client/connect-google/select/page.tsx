import { prisma } from "@/lib/prisma";
import { requireClientUser } from "@/lib/session";
import SelectForm from "./SelectForm";
import type { GoogleCustomer } from "@/lib/google";

const ATTEMPT_TTL_MS = 30 * 60 * 1000;

export default async function ConnectGoogleSelectPage({
  searchParams,
}: {
  searchParams: { attempt?: string };
}) {
  const session = await requireClientUser();
  const attemptId = searchParams.attempt;

  if (!attemptId) {
    return <ExpiredState message="No connection attempt was specified. Please reconnect with Google Ads." />;
  }

  const attempt = await prisma.googleConnectionAttempt.findFirst({
    where: { id: attemptId, clientId: session.user.clientId! },
  });

  if (!attempt) {
    return <ExpiredState message="This link is invalid. Please reconnect with Google Ads." />;
  }

  if (Date.now() - attempt.createdAt.getTime() > ATTEMPT_TTL_MS) {
    await prisma.googleConnectionAttempt.delete({ where: { id: attempt.id } }).catch(() => {});
    return <ExpiredState message="This connection attempt expired. Please reconnect with Google Ads." />;
  }

  const customers = attempt.customersJson as unknown as GoogleCustomer[];

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Finish connecting Google Ads</h1>
        <p className="mt-1 text-sm text-gray-500">Choose which Google Ads account to use for this client.</p>
      </div>
      <SelectForm attemptId={attempt.id} customers={customers} />
    </div>
  );
}

function ExpiredState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-lg font-semibold text-gray-900">Connection not found</h1>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
      <a
        href="/api/auth/google/connect"
        className="mt-4 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Connect with Google Ads
      </a>
    </div>
  );
}
