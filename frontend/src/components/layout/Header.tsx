"use client";

import { ArrowLeft, Bell, ChevronDown, Menu, LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  Home,
  Users,
  ClipboardList,
  Sparkles,
  BookOpen,
  Settings,
  X,
} from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "My Groups", href: "/groups", icon: Users },
  { label: "Assignments", href: "/assignments", icon: ClipboardList },
  { label: "AI Teacher's Toolkit", href: "/toolkit", icon: Sparkles },
  { label: "My Library", href: "/library", icon: BookOpen },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export default function Header({ title = "Assignment", showBack = false }: HeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 lg:hidden">
        <div className="flex items-center justify-between px-4 h-[52px]">
          <div className="flex items-center gap-2.5">
            {showBack ? (
              <>
                <button
                  onClick={() => router.back()}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ArrowLeft size={18} className="text-gray-600" />
                </button>
                <span className="text-[14px] font-semibold text-gray-900">{title}</span>
              </>
            ) : (
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#2D2D2D] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-[11px]">V</span>
                </div>
                <span className="text-[15px] font-bold text-gray-900 tracking-tight">VedaAI</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-1.5 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={17} className="text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[11px] font-bold">
              JD
            </div>
            <button
              className="p-1"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 hidden lg:block">
        <div className="flex items-center justify-between px-6 h-[52px]">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={() => router.back()}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <LayoutGrid size={16} className="text-gray-400" />
              <span className="text-[13px] font-medium text-gray-600">{title}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={17} className="text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[11px] font-bold">
                JD
              </div>
              <span className="text-[13px] font-medium text-gray-700">John Doe</span>
              <ChevronDown size={13} className="text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-out Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
                <span className="text-lg font-bold text-gray-900">VedaAI</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                  D
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Delhi Public School</p>
                  <p className="text-xs text-gray-500">Bokaro Steel City</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
