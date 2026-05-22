"use client";
import Header from "@/components/layout/Header";
import ComingSoon from "@/components/ComingSoon";
import { Users } from "lucide-react";

export default function GroupsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="My Groups" showBack />
      <ComingSoon
        icon={Users}
        title="My Groups"
        description="Organize your students into groups, manage rosters, and assign work to specific classes. We're putting the final touches on this."
      />
    </div>
  );
}
