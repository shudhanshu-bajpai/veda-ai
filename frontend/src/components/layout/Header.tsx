"use client";

import { ArrowLeft, Bell, ChevronDown, Menu, LayoutGrid, Sparkles, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  Home,
  Users,
  ClipboardList,
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
  showMobileBack?: boolean;
  icon?: LucideIcon;
}

export default function Header({
  title = "Assignment",
  showBack = false,
  showMobileBack,
  icon: HeaderIcon = LayoutGrid,
}: HeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileBack = showMobileBack ?? showBack;

  return (
    <>
      {/* Mobile Header — floating panel (top row only) */}
      <header className="sticky top-3 z-40 lg:hidden mx-3 mt-3 rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100">
        <div className="flex items-center justify-between px-4 h-[52px]">
          <Link href="/" className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/vedaai-logo.jpg"
              alt="VedaAI"
              className="h-9 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-2">
            <button className="relative p-1.5 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={17} className="text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#E8704F] rounded-full border border-white" />
            </button>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center text-white text-[10px] font-bold">
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

      {/* Mobile Sub-header — separate floating card */}
      {mobileBack && (
        <div className="lg:hidden mx-3 mt-3 rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
          <div className="flex items-center px-4 h-[48px] relative">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
            >
              <ArrowLeft size={16} className="text-gray-700" />
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 text-[14px] font-semibold text-gray-900">
              {title}
            </span>
          </div>
        </div>
      )}

      {/* Desktop Header — floating panel */}
      <header className="sticky top-4 z-40 hidden lg:block mx-4 mt-4">
        <div className="flex items-center justify-between px-5 h-[52px] bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100">
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
              <HeaderIcon size={16} className="text-gray-400" />
              <span className="text-[13px] font-medium text-gray-600">{title}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={17} className="text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E8704F] rounded-full border border-white" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 rounded-full pl-1 pr-3 py-1 hover:bg-gray-50 transition-colors">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center text-white text-[10px] font-bold">
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/vedaai-logo.jpg"
                alt="VedaAI"
                className="h-12 w-auto object-contain"
              />
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
