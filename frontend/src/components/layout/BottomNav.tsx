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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#2D2D2D] rounded-t-2xl safe-area-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
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
              className="flex flex-col items-center justify-center gap-1 flex-1 py-1.5"
            >
              <div
                className={`flex items-center justify-center w-10 h-7 rounded-xl ${
                  isActive ? "bg-[#3a3a3a]" : ""
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-white" : "text-gray-500"}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </div>
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
      {/* iOS Home indicator bar */}
      <div className="flex justify-center pb-1.5">
        <div className="w-32 h-[3px] bg-gray-500 rounded-full" />
      </div>
    </nav>
  );
}
