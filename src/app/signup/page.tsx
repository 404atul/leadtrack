import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import SignupForm from "./SignupForm";

export default async function SignupPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect(session.user.role === "agency_admin" ? "/admin/dashboard" : "/client/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Start your free trial</h1>
          <p className="mt-1 text-sm text-gray-500">LeadTrack CRM for ad agencies</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <SignupForm />
        </div>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
