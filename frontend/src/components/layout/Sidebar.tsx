"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  ClipboardList,
  Sparkles,
  BookOpen,
  Settings,
} from "lucide-react";
import { useAssignmentStore } from "@/store/assignmentStore";

const navItems = [
  { label: "Home", href: "/", icon: LayoutGrid },
  { label: "My Groups", href: "/groups", icon: Users },
  { label: "Assignments", href: "/assignments", icon: ClipboardList, showBadge: true },
  { label: "AI Teacher's Toolkit", href: "/toolkit", icon: Sparkles },
  { label: "My Library", href: "/library", icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { assignments } = useAssignmentStore();
  const assignmentCount = assignments.length;

  return (
    <aside className="hidden lg:flex flex-col w-[240px] min-h-screen bg-white border-r border-gray-200 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#2D2D2D] rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="text-[17px] font-bold text-gray-900 tracking-tight">
            VedaAI
          </span>
        </Link>
      </div>

      {/* Create Button */}
      <div className="px-4 pb-4">
        <Link
          href="/assignments/create"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#2D2D2D] text-white rounded-full text-[13px] font-semibold hover:bg-[#3a3a3a] transition-colors"
        >
          <span className="text-base leading-none">✦</span>
          Create Assignment
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
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
              className={`flex items-center justify-between px-3 py-[9px] rounded-lg text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </div>
              {item.showBadge && assignmentCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {assignmentCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-3 py-2">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-[9px] rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <Settings size={17} strokeWidth={1.8} />
          Settings
        </Link>
      </div>

      {/* School Info */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center">
            <span className="text-white text-sm font-bold">D</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-900 leading-tight">
              Delhi Public School
            </p>
            <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
              Bokaro Steel City
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
