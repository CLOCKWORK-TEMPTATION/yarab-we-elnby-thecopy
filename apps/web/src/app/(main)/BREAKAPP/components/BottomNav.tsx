"use client";

/**
 * @module BottomNav
 * @description شريط التنقل السفلي لتطبيق BREAKAPP الموبايل
 *
 * السبب: تطبيق BREAKAPP هو mobile-first — شريط التنقل السفلي
 * هو النمط المعياري لتطبيقات الموبايل ويسهل الوصول بيد واحدة
 */

import { usePathname } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "../lib/auth";
import type { UserRole } from "../lib/roles";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "الرئيسية",
    href: "/BREAKAPP/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    roles: ["director", "crew", "runner", "admin"],
  },
  {
    label: "المخرج",
    href: "/BREAKAPP/director",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ["director", "admin"],
  },
  {
    label: "الطلبات",
    href: "/BREAKAPP/crew/menu",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    roles: ["director", "crew", "admin"],
  },
  {
    label: "التوصيل",
    href: "/BREAKAPP/runner/track",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    roles: ["runner", "admin"],
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const user = getCurrentUser();
  const role = (user?.role || "crew") as UserRole;

  // تصفية العناصر حسب الدور
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  // لا يُعرض في صفحة تسجيل الدخول
  if (pathname?.includes("/login")) return null;

  return (
    <nav
      dir="rtl"
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden safe-area-bottom"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {item.icon}
              <span className="text-[10px] mt-0.5 font-cairo">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
