"use client";
import Header from "@/components/layout/Header";

export default function GroupsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="My Groups" showBack />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Groups — Coming soon</p>
      </div>
    </div>
  );
}
