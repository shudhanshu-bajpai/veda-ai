"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ClipboardList, BookOpen, Sparkles } from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: LayoutGrid },
  { label: "Assignments", href: "/assignments", icon: ClipboardList },
  { label: "Library", href: "/library", icon: BookOpen },
  { label: "AI Toolkit", href: "/toolkit", icon: Sparkles },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed left-3 right-3 z-50 bg-[#2D2D2D] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
      style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center justify-around px-2 py-2.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-1"
            >
              <Icon
                size={20}
                className={isActive ? "text-white" : "text-gray-500"}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span
                className={`text-[10px] ${
                  isActive
                    ? "text-white font-semibold"
                    : "text-gray-500 font-medium"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
