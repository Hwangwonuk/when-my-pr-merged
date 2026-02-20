"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Lightbulb,
  Trophy,
  FileText,
  Settings,
  ArrowLeftRight,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SidebarProps {
  user: {
    login: string;
    avatarUrl?: string;
  };
}

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "", label: "개요", icon: LayoutDashboard },
  { href: "/stats", label: "통계", icon: BarChart3 },
  { href: "/reviewers", label: "리뷰어 랭킹", icon: Users },
  { href: "/insights", label: "인사이트", icon: Lightbulb },
  { href: "/leaderboard", label: "리더보드", icon: Trophy },
  { href: "/reports", label: "리포트", icon: FileText },
  { href: "/settings", label: "설정", icon: Settings },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const orgSlug = pathname.split("/")[1] || "";
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-800/50 flex items-center justify-between">
        <Link href="/" className="text-[13px] font-semibold text-gray-200 tracking-tight">
          내 PR 언제 머지돼?
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-gray-400 hover:text-white p-1"
          aria-label="메뉴 닫기"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {orgSlug ? (
          navItems.map((item) => {
            const fullHref = `/${orgSlug}${item.href}`;
            const isActive =
              item.href === ""
                ? pathname === `/${orgSlug}`
                : pathname.startsWith(fullHref);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={fullHref}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors duration-200",
                  isActive
                    ? "bg-white/5 text-white"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })
        ) : (
          <p className="px-2.5 py-1.5 text-[13px] text-gray-600">
            조직을 선택하면 메뉴가 표시됩니다.
          </p>
        )}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-gray-800/50 space-y-0.5">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors duration-200"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>조직 전환</span>
        </Link>
        <Link
          href="/profile"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-gray-400 hover:text-white hover:bg-white/5 transition-colors duration-200"
        >
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={user.login}
              className="w-6 h-6 rounded-full"
            />
          )}
          <span>{user.login}</span>
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/auth/session", { method: "DELETE" });
            window.location.href = "/login";
          }}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-gray-600 hover:text-red-400 hover:bg-white/5 transition-colors duration-200 w-full"
        >
          <LogOut className="w-3.5 h-3.5" />
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
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-md bg-gray-900 border border-gray-800/50 text-gray-400 hover:text-white"
        aria-label="메뉴 열기"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <aside className="hidden lg:flex w-56 border-r border-gray-800/50 bg-gray-950 flex-col">
        {navContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-56 bg-gray-950 flex flex-col transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
