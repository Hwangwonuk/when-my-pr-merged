"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface SidebarProps {
  user: {
    login: string;
    avatarUrl?: string;
  };
}

const navItems = [
  { href: "", label: "개요", icon: "📊" },
  { href: "/stats", label: "통계", icon: "📈" },
  { href: "/reviewers", label: "리뷰어 랭킹", icon: "👥" },
  { href: "/insights", label: "인사이트", icon: "🔍" },
  { href: "/leaderboard", label: "리더보드", icon: "🏆" },
  { href: "/reports", label: "리포트", icon: "📋" },
  { href: "/settings", label: "설정", icon: "⚙️" },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const orgSlug = pathname.split("/")[1] || "";
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold">
          내 PR 언제 머지돼?
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-gray-400 hover:text-white p-1"
          aria-label="메뉴 닫기"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {orgSlug ? (
          navItems.map((item) => {
            const fullHref = `/${orgSlug}${item.href}`;
            const isActive =
              item.href === ""
                ? pathname === `/${orgSlug}`
                : pathname.startsWith(fullHref);

            return (
              <Link
                key={item.href}
                href={fullHref}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-indigo-600/20 text-indigo-400"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })
        ) : (
          <p className="px-3 py-2 text-sm text-gray-500">
            조직을 선택하면 메뉴가 표시됩니다.
          </p>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-800 space-y-2">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-2 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <span>🔄</span>
          <span>조직 전환</span>
        </Link>
        <Link
          href="/profile"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={user.login}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span>{user.login}</span>
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/auth/session", { method: "DELETE" });
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 px-2 py-2 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors w-full"
        >
          <span>🚪</span>
          <span>로그아웃</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white"
        aria-label="메뉴 열기"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-gray-800 bg-gray-900/50 flex-col">
        {navContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 flex flex-col transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
