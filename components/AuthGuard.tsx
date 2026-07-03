"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

type Props = {
  children: ReactNode;
  adminOnly?: boolean;
};

export default function AuthGuard({ children, adminOnly = false }: Props) {
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const res = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        router.replace("/login");
        return;
      }

      if (adminOnly && data.agent.role !== "Admin") {
        router.replace("/dashboard");
        return;
      }

      setAllowed(true);
      setChecking(false);
    }

    checkAccess();
  }, [adminOnly, router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaf8] text-[#4b0008]">
        <p className="text-lg font-bold">Checking access...</p>
      </main>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}