"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { supabaseClient } from "@/lib/supabaseClient";
import {
  Bell,
  CheckCircle,
  LayoutDashboard,
  Mail,
  Save,
  ShieldCheck,
  Signature,
  User,
} from "lucide-react";

type AgentSettings = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string | null;
  signature_title: string | null;
  signature_phone: string | null;
  signature_website: string | null;
  forwarding_email: string | null;
  company_email: string | null;
  auth_email: string | null;
  primary_sender_email: string | null;
  chat_alerts_enabled: boolean;
  dm_alerts_enabled: boolean;
  mention_alerts_enabled: boolean;
  compact_layout: boolean;
  default_landing_page: string;
  time_format: string;
  is_active: boolean;
  suspended: boolean;
  last_login_at: string | null;
  last_password_reset: string | null;
};

export default function SettingsPage() {
  const [agent, setAgent] = useState<AgentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      setStatus("You must be signed in to view settings.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabaseClient
      .from("agents")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    setAgent(data);
    setLoading(false);
  }

  function updateField<K extends keyof AgentSettings>(
    field: K,
    value: AgentSettings[K]
  ) {
    if (!agent) return;
    setAgent({ ...agent, [field]: value });
  }

  async function saveSettings() {
    if (!agent) return;

    setSaving(true);
    setStatus("");

    const { error } = await supabaseClient
      .from("agents")
      .update({
        full_name: agent.full_name,
        first_name: agent.first_name,
        last_name: agent.last_name,
        phone: agent.phone,
        role: agent.role,
        signature_title: agent.signature_title,
        signature_phone: agent.signature_phone,
        signature_website: agent.signature_website,
        forwarding_email: agent.forwarding_email,
        primary_sender_email: agent.primary_sender_email,
        chat_alerts_enabled: agent.chat_alerts_enabled,
        dm_alerts_enabled: agent.dm_alerts_enabled,
        mention_alerts_enabled: agent.mention_alerts_enabled,
        compact_layout: agent.compact_layout,
        default_landing_page: agent.default_landing_page,
        time_format: agent.time_format,
      })
      .eq("id", agent.id);

    if (error) {
      setStatus(error.message);
      setSaving(false);
      return;
    }

    setStatus("Settings saved successfully.");
    setSaving(false);
  }

  if (loading) {
    return <Shell>Loading settings...</Shell>;
  }

  if (!agent) {
    return <Shell>{status || "No agent settings found."}</Shell>;
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#4b0008]">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="flex flex-col gap-5 border-b border-[#4b0008]/15 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-bold uppercase tracking-[0.25em] text-[#7a1118]">
              FORWARD Mail
            </p>
            <h1 className="mt-3 text-5xl font-black">Settings</h1>
            <p className="mt-3 text-lg text-[#6f2b31]">
              Manage your profile, email identity, signature, alerts, and system
              preferences.
            </p>
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#4b0008] px-6 py-4 font-black text-white disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </header>

        {status && (
          <div className="mt-6 rounded-2xl border border-[#4b0008]/10 bg-white p-4 font-bold text-[#7a1118] shadow-sm">
            {status}
          </div>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card icon={User} title="Profile Settings">
            <Input label="Full Name" value={agent.full_name} onChange={(v) => updateField("full_name", v)} />
            <Input label="First Name" value={agent.first_name} onChange={(v) => updateField("first_name", v)} />
            <Input label="Last Name" value={agent.last_name} onChange={(v) => updateField("last_name", v)} />
            <Input label="Phone" value={agent.phone} onChange={(v) => updateField("phone", v)} />
            <Input label="Role / Title" value={agent.role} onChange={(v) => updateField("role", v)} />
          </Card>

          <Card icon={Mail} title="Email Identity">
            <Input label="Company Email" value={agent.company_email} disabled />
            <Input label="Auth Email" value={agent.auth_email} disabled />
            <Input label="Primary Sender Email" value={agent.primary_sender_email} onChange={(v) => updateField("primary_sender_email", v)} />
            <Input label="Forwarding Email" value={agent.forwarding_email} onChange={(v) => updateField("forwarding_email", v)} />
          </Card>

          <Card icon={Signature} title="Email Signature">
            <Input label="Signature Title" value={agent.signature_title} onChange={(v) => updateField("signature_title", v)} />
            <Input label="Signature Phone" value={agent.signature_phone} onChange={(v) => updateField("signature_phone", v)} />
            <Input label="Signature Website" value={agent.signature_website} onChange={(v) => updateField("signature_website", v)} />
          </Card>

          <Card icon={Bell} title="FRBS Connect Alerts">
            <Toggle label="Chat Alerts" checked={agent.chat_alerts_enabled} onChange={(v) => updateField("chat_alerts_enabled", v)} />
            <Toggle label="Direct Message Alerts" checked={agent.dm_alerts_enabled} onChange={(v) => updateField("dm_alerts_enabled", v)} />
            <Toggle label="Mention Alerts" checked={agent.mention_alerts_enabled} onChange={(v) => updateField("mention_alerts_enabled", v)} />
            <div className="mt-4 rounded-xl bg-[#f6eee7] p-4 text-sm font-bold text-[#6f2b31]">
              Announcements are always enabled for company updates.
            </div>
          </Card>

          <Card icon={LayoutDashboard} title="System Preferences">
            <Toggle label="Compact Layout" checked={agent.compact_layout} onChange={(v) => updateField("compact_layout", v)} />

            <label className="mt-4 block">
              <span className="text-sm font-black">Default Landing Page</span>
              <select
                value={agent.default_landing_page}
                onChange={(e) => updateField("default_landing_page", e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#4b0008]/15 bg-white px-4 py-3 outline-none"
              >
                <option value="/dashboard">Dashboard</option>
                <option value="/inbox">Inbox</option>
                <option value="/connect">FRBS Connect</option>
                <option value="/agents">Agents</option>
              </select>
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-black">Time Format</span>
              <select
                value={agent.time_format}
                onChange={(e) => updateField("time_format", e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#4b0008]/15 bg-white px-4 py-3 outline-none"
              >
                <option value="12h">12 Hour</option>
                <option value="24h">24 Hour</option>
              </select>
            </label>
          </Card>

          <Card icon={ShieldCheck} title="Account & Security">
            <StatusRow label="Account Active" value={agent.is_active ? "Active" : "Inactive"} good={agent.is_active} />
            <StatusRow label="Suspended" value={agent.suspended ? "Yes" : "No"} good={!agent.suspended} />
            <StatusRow label="Last Login" value={agent.last_login_at ? new Date(agent.last_login_at).toLocaleString() : "Not recorded"} />
            <StatusRow label="Last Password Reset" value={agent.last_password_reset ? new Date(agent.last_password_reset).toLocaleString() : "Not recorded"} />
          </Card>
        </section>
      </div>
    </main>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#4b0008]">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm">{children}</div>
      </div>
    </main>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#4b0008]/15 bg-white p-7 shadow-md">
      <div className="mb-6 flex items-center gap-3">
        <Icon className="h-7 w-7 text-[#4b0008]" />
        <h2 className="text-2xl font-black">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string | null;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black">{label}</span>
      <input
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-2 w-full rounded-xl border border-[#4b0008]/15 bg-white px-4 py-3 outline-none disabled:bg-gray-100 disabled:text-gray-500"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border border-[#4b0008]/10 bg-[#fbfaf8] px-5 py-4"
    >
      <span className="font-black">{label}</span>
      <span
        className={`rounded-full px-4 py-1 text-sm font-black ${
          checked ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}

function StatusRow({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#fbfaf8] px-4 py-3">
      <span className="font-bold">{label}</span>
      <span className="flex items-center gap-2 font-black">
        {typeof good === "boolean" && (
          <CheckCircle
            size={16}
            className={good ? "text-green-600" : "text-red-600"}
          />
        )}
        {value}
      </span>
    </div>
  );
}