"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signupAgency } from "@/lib/actions/signup";

export default function SignupForm() {
  const router = useRouter();
  const [agencyName, setAgencyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("agencyName", agencyName);
      formData.set("adminName", adminName);
      formData.set("email", email);
      formData.set("password", password);
      await signupAgency(formData);

      const res = await signIn("credentials", { email, password, redirect: false });
      if (!res || res.error) {
        setError("Account created, but sign-in failed. Try logging in.");
        setLoading(false);
        return;
      }

      router.push("/admin/billing");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="agencyName" className="block text-sm font-medium text-gray-700">
          Agency name
        </label>
        <input
          id="agencyName"
          required
          value={agencyName}
          onChange={(e) => setAgencyName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">
          Your name
        </label>
        <input
          id="adminName"
          required
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
