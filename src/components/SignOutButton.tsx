"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="mt-1 text-xs font-medium text-gray-400 hover:text-gray-700"
    >
      Sign out
    </button>
  );
}
