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

  const isOutputPage =
    /^\/assignments\/[^/]+$/.test(pathname) && pathname !== "/assignments/create";

  return (
    <aside className="hidden lg:flex flex-col w-[230px] min-h-screen bg-white border-r border-gray-100 shrink-0 px-4 py-5">
      {/* VedaAI Logo */}
      <div className="mb-5">
        <Link href="/" className="inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vedaai-logo.jpg"
            alt="VedaAI"
            className="h-10 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Create Button with orange border */}
      <div className="mb-6">
        <Link
          href="/assignments/create"
          className="flex items-center justify-center gap-2 w-full py-[9px] bg-[#2D2D2D] text-white rounded-full text-[13px] font-semibold hover:bg-[#3a3a3a] transition-colors border-2 border-[#E8704F]/60"
        >
          <Sparkles size={14} className="text-[#E8704F]" />
          Create Assignment
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          let isActive: boolean;
          if (isOutputPage && item.href === "/toolkit") {
            isActive = true;
          } else if (isOutputPage && item.href === "/assignments") {
            isActive = false;
          } else {
            isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
          }
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-[9px] rounded-lg text-[13px] transition-colors ${
                isActive
                  ? "text-gray-900 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800 font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={17} strokeWidth={isActive ? 2 : 1.7} />
                <span>{item.label}</span>
              </div>
              {item.showBadge && assignmentCount > 0 && (
                <span className="min-w-[24px] h-[18px] px-1.5 bg-[#E8704F] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {assignmentCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="mb-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-[9px] rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <Settings size={17} strokeWidth={1.7} />
          Settings
        </Link>
      </div>

      {/* School Info Pill */}
      <div className="bg-[#F5F5F5] rounded-2xl p-2.5 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center shrink-0 overflow-hidden">
          <span className="text-white text-sm font-bold">D</span>
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-gray-900 leading-tight truncate">
            Delhi Public School
          </p>
          <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
            Bokaro Steel City
          </p>
        </div>
      </div>
    </aside>
  );
}
