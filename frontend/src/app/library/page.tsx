"use client";
import Header from "@/components/layout/Header";

export default function LibraryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="My Library" showBack />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Library — Coming soon</p>
      </div>
    </div>
  );
}
