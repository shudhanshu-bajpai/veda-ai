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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#2D2D2D] safe-area-bottom">
      <div className="flex items-center justify-around h-[60px]">
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
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2"
            >
              <Icon
                size={20}
                className={isActive ? "text-white" : "text-gray-500"}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-white" : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Home indicator bar */}
      <div className="flex justify-center pb-1">
        <div className="w-32 h-1 bg-gray-600 rounded-full" />
      </div>
    </nav>
  );
}
