import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

export default async function SignupPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect(session.user.role === "agency_admin" ? "/admin/dashboard" : "/client/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Signups are not currently open</h1>
        <p className="mt-3 text-sm text-gray-500">
          Contact your agency admin for access to your client portal.
        </p>
        <p className="mt-6 text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
