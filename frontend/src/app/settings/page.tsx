"use client";
import Header from "@/components/layout/Header";
import ComingSoon from "@/components/ComingSoon";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Settings" showBack />
      <ComingSoon
        icon={SettingsIcon}
        title="Settings"
        description="Manage your profile, notification preferences, and integration keys. Coming up next."
      />
    </div>
  );
}
