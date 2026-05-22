"use client";
import Header from "@/components/layout/Header";
import ComingSoon from "@/components/ComingSoon";
import { BookOpen } from "lucide-react";

export default function LibraryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="My Library" showBack />
      <ComingSoon
        icon={BookOpen}
        title="My Library"
        description="Save question banks, reusable templates, and reference materials. Your library will live here, soon."
      />
    </div>
  );
}
