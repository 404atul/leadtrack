import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";

export default async function AccountPausedPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Access Paused</h1>
        <p className="mt-2 text-sm text-gray-500">
          Access to this account is currently paused. Please contact your agency for assistance.
        </p>
        <div className="mt-4 flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
