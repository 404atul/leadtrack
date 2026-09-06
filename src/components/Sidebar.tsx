"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export default function Sidebar({
  items,
  title,
  subtitle,
  userName,
}: {
  items: NavItem[];
  title: string;
  subtitle: string;
  userName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="px-5 py-5">
        <p className="text-base font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 px-4 py-4">
        <p className="truncate text-sm font-medium text-gray-700">{userName}</p>
        <SignOutButton />
      </div>
    </aside>
  );
}
