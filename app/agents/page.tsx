"use client";

import AuthGuard from "@/components/AuthGuard";
import AgentsContent from "./AgentsContent";

export default function AgentsPage() {
  return (
    <AuthGuard adminOnly>
      <AgentsContent />
    </AuthGuard>
  );
}