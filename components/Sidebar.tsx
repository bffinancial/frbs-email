"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  FileText,
  Inbox,
  LayoutDashboard,
  PenLine,
  Send,
  Archive,
  Users,
  UserRound,
  Settings,
  BarChart3,
} from "lucide-react";

const sections = [
  {
    title: "",
    links: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    title: "MAIL",
    links: [
      { href: "/inbox", label: "Inbox", icon: Inbox },
      { href: "/compose", label: "Compose", icon: PenLine },
      { href: "/sent", label: "Sent", icon: Send },
      { href: "/drafts", label: "Drafts", icon: Archive },
      { href: "/templates", label: "Templates", icon: FileText },
    ],
  },

  {
    title: "PEOPLE",
    links: [
      { href: "/contacts", label: "Contacts", icon: UserRound },
      { href: "/agents", label: "Agents", icon: Users },
    ],
  },

  {
    title: "TOOLS",
    links: [
      { href: "/assistant", label: "AI Assistant", icon: Bot },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },

  {
    title: "SYSTEM",
    links: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 border-r border-[#4b0008]/10 bg-white">
      <div className="p-6">

        {sections.map((section) => (
          <div
            key={section.title}
            className="mb-8"
          >
            {section.title && (
              <p className="mb-3 text-xs font-bold tracking-[0.25em] text-[#7a1118]">
                {section.title}
              </p>
            )}

            <div className="space-y-1">
              {section.links.map((link) => {
                const Icon = link.icon;

                const active =
                  pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition

                    ${
                      active
                        ? "bg-[#4b0008] text-white"
                        : "hover:bg-[#f6eee7]"
                    }`}
                  >
                    <Icon size={18} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}