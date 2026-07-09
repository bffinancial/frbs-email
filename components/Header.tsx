"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Archive,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  PenLine,
  Send,
  Settings,
  Users,
} from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

type AgentProfile = {
  full_name: string;
  role: string;
  company_email: string;
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [agent, setAgent] = useState<AgentProfile | null>(null);

  useEffect(() => {
    async function loadMe() {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) return;

      const res = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      setAgent(data.agent);
    }

    loadMe();
  }, []);

  async function logout() {
    await supabaseClient.auth.signOut();
    router.push("/login");
  }

  const isAdmin = agent?.role?.toLowerCase() === "admin";

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/inbox", label: "Inbox", icon: Inbox },
    { href: "/compose", label: "Compose", icon: PenLine },
    { href: "/sent", label: "Sent", icon: Send },
    { href: "/drafts", label: "Drafts", icon: Archive },
    { href: "/templates", label: "Templates", icon: FileText },
    { href: "/connect", label: "Connect", icon: MessageCircle },
    ...(isAdmin ? [{ href: "/agents", label: "Agents", icon: Users }] : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#4b0008]/10 bg-white shadow-sm">
      <div className="mx-auto flex h-24 max-w-7xl items-center px-6">
        <Link href="/dashboard" className="shrink-0">
          <Image
            src="/frbs-logo.png"
            alt="FORWARD"
            width={230}
            height={60}
            priority
            className="h-14 w-auto"
          />
        </Link>

        <nav className="ml-10 flex flex-1 items-center justify-center gap-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-[#4b0008] text-white shadow-md"
                    : "text-[#4b0008] hover:bg-[#f6eee7]"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden text-right md:block">
            <p className="font-semibold text-[#4b0008]">
              {agent?.full_name ?? "Loading..."}
            </p>
            <p className="text-xs text-gray-500">{agent?.role ?? ""}</p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-[#4b0008]/20 px-5 py-3 font-semibold text-[#4b0008] transition hover:bg-[#f6eee7]"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}