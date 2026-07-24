"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { supabaseClient } from "@/lib/supabaseClient";
import {
  Bell,
  CheckCircle,
  Cloud,
  LayoutDashboard,
  Link2,
  Mail,
  RefreshCw,
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

type MicrosoftConnection = {
  email: string | null;
  display_name: string | null;
  tenant_id: string | null;
  connected_at: string | null;
  updated_at: string | null;
  expires_at: string | null;
};

type MicrosoftStatusResponse = {
  connected: boolean;
  connection: MicrosoftConnection | null;
  error?: string;
};

export default function SettingsPage() {
  const [agent, setAgent] = useState<AgentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const [microsoftConnected, setMicrosoftConnected] =
    useState(false);
  const [microsoftConnection, setMicrosoftConnection] =
    useState<MicrosoftConnection | null>(null);
  const [microsoftLoading, setMicrosoftLoading] =
    useState(true);
  const [microsoftConnecting, setMicrosoftConnecting] =
    useState(false);
  const [microsoftMessage, setMicrosoftMessage] =
    useState("");

  useEffect(() => {
    void initializeSettings();
  }, []);

  async function initializeSettings() {
    readMicrosoftRedirectStatus();

    await Promise.all([
      loadSettings(),
      loadMicrosoftStatus(),
    ]);
  }

  function readMicrosoftRedirectStatus() {
    const params = new URLSearchParams(
      window.location.search
    );

    const microsoftResult = params.get("microsoft");
    const message = params.get("message");

    if (microsoftResult === "connected") {
      setMicrosoftMessage(
        "Microsoft 365 connected successfully."
      );
    }

    if (microsoftResult === "error") {
      setMicrosoftMessage(
        message ||
          "Microsoft 365 could not be connected."
      );
    }

    if (microsoftResult || message) {
      const cleanUrl = `${window.location.pathname}${window.location.hash}`;

      window.history.replaceState(
        {},
        document.title,
        cleanUrl
      );
    }
  }

  async function getAccessToken(): Promise<string | null> {
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();

    if (error || !session?.access_token) {
      return null;
    }

    return session.access_token;
  }

  async function loadSettings() {
    setLoading(true);

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      setStatus(
        "You must be signed in to view settings."
      );
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

  async function loadMicrosoftStatus() {
    setMicrosoftLoading(true);

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        setMicrosoftConnected(false);
        setMicrosoftConnection(null);
        setMicrosoftMessage(
          "Sign in again to manage your Microsoft connection."
        );
        return;
      }

      const response = await fetch(
        "/api/auth/microsoft/status",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const result =
        (await response.json()) as MicrosoftStatusResponse;

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load Microsoft connection status."
        );
      }

      setMicrosoftConnected(result.connected);
      setMicrosoftConnection(result.connection);
    } catch (error) {
      setMicrosoftConnected(false);
      setMicrosoftConnection(null);
      setMicrosoftMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Microsoft connection status."
      );
    } finally {
      setMicrosoftLoading(false);
    }
  }

  async function connectMicrosoft365() {
    if (microsoftConnecting) return;

    setMicrosoftConnecting(true);
    setMicrosoftMessage("");

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      const response = await fetch(
        "/api/auth/microsoft/connect",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = (await response.json()) as {
        authorizationUrl?: string;
        error?: string;
      };

      if (!response.ok || !result.authorizationUrl) {
        throw new Error(
          result.error ||
            "Unable to start Microsoft authorization."
        );
      }

      window.location.assign(result.authorizationUrl);
    } catch (error) {
      setMicrosoftMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect Microsoft 365."
      );
      setMicrosoftConnecting(false);
    }
  }

  function updateField<K extends keyof AgentSettings>(
    field: K,
    value: AgentSettings[K]
  ) {
    if (!agent) return;

    setAgent({
      ...agent,
      [field]: value,
    });
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
        primary_sender_email:
          agent.primary_sender_email,
        chat_alerts_enabled:
          agent.chat_alerts_enabled,
        dm_alerts_enabled:
          agent.dm_alerts_enabled,
        mention_alerts_enabled:
          agent.mention_alerts_enabled,
        compact_layout: agent.compact_layout,
        default_landing_page:
          agent.default_landing_page,
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
    return (
      <Shell>
        {status || "No agent settings found."}
      </Shell>
    );
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

            <h1 className="mt-3 text-5xl font-black">
              Settings
            </h1>

            <p className="mt-3 text-lg text-[#6f2b31]">
              Manage your profile, email identity,
              Microsoft 365 connection, signature,
              alerts, and system preferences.
            </p>
          </div>

          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#4b0008] px-6 py-4 font-black text-white shadow-sm transition hover:bg-[#65000b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />
            {saving
              ? "Saving..."
              : "Save Settings"}
          </button>
        </header>

        {status && (
          <div className="mt-6 rounded-2xl border border-[#4b0008]/10 bg-white p-4 font-bold text-[#7a1118] shadow-sm">
            {status}
          </div>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card
            icon={Cloud}
            title="Microsoft 365"
            className="lg:col-span-2"
          >
            <div className="rounded-2xl border border-[#4b0008]/10 bg-[#fbfaf8] p-5">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      microsoftConnected
                        ? "bg-green-100 text-green-700"
                        : "bg-[#f3e7e2] text-[#7a1118]"
                    }`}
                  >
                    {microsoftConnected ? (
                      <CheckCircle size={25} />
                    ) : (
                      <Link2 size={25} />
                    )}
                  </div>

                  <div>
                    <p className="text-lg font-black">
                      {microsoftLoading
                        ? "Checking Microsoft connection..."
                        : microsoftConnected
                          ? "Microsoft 365 Connected"
                          : "Microsoft 365 Not Connected"}
                    </p>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6f2b31]">
                      Connect your FRBS Microsoft
                      mailbox so Outlook and FRBS Mail
                      can use the same Microsoft 365
                      account.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={loadMicrosoftStatus}
                    disabled={
                      microsoftLoading ||
                      microsoftConnecting
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#4b0008]/15 bg-white px-5 py-3 font-black text-[#4b0008] transition hover:bg-[#f8f1ed] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw size={17} />
                    Refresh Status
                  </button>

                  <button
                    type="button"
                    onClick={connectMicrosoft365}
                    disabled={
                      microsoftLoading ||
                      microsoftConnecting
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#4b0008] px-5 py-3 font-black text-white transition hover:bg-[#65000b] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Cloud size={17} />

                    {microsoftConnecting
                      ? "Opening Microsoft..."
                      : microsoftConnected
                        ? "Reconnect Microsoft 365"
                        : "Connect Microsoft 365"}
                  </button>
                </div>
              </div>
            </div>

            {microsoftMessage && (
              <div
                className={`rounded-2xl border p-4 text-sm font-bold ${
                  microsoftConnected &&
                  microsoftMessage
                    .toLowerCase()
                    .includes("success")
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-[#4b0008]/10 bg-[#f8f1ed] text-[#7a1118]"
                }`}
              >
                {microsoftMessage}
              </div>
            )}

            {microsoftConnected &&
              microsoftConnection && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <ConnectionDetail
                    label="Microsoft Account"
                    value={
                      microsoftConnection.display_name ||
                      "Connected account"
                    }
                  />

                  <ConnectionDetail
                    label="Mailbox"
                    value={
                      microsoftConnection.email ||
                      "Email unavailable"
                    }
                  />

                  <ConnectionDetail
                    label="Connected"
                    value={formatDate(
                      microsoftConnection.connected_at
                    )}
                  />

                  <ConnectionDetail
                    label="Connection Updated"
                    value={formatDate(
                      microsoftConnection.updated_at
                    )}
                  />
                </div>
              )}

            <div className="rounded-2xl bg-[#f6eee7] p-4 text-sm font-bold leading-6 text-[#6f2b31]">
              Microsoft 365 authorization is stored
              securely for this FRBS Mail agent. No
              Microsoft password is saved inside FRBS
              Mail.
            </div>
          </Card>

          <Card icon={User} title="Profile Settings">
            <Input
              label="Full Name"
              value={agent.full_name}
              onChange={(value) =>
                updateField("full_name", value)
              }
            />

            <Input
              label="First Name"
              value={agent.first_name}
              onChange={(value) =>
                updateField("first_name", value)
              }
            />

            <Input
              label="Last Name"
              value={agent.last_name}
              onChange={(value) =>
                updateField("last_name", value)
              }
            />

            <Input
              label="Phone"
              value={agent.phone}
              onChange={(value) =>
                updateField("phone", value)
              }
            />

            <Input
              label="Role / Title"
              value={agent.role}
              onChange={(value) =>
                updateField("role", value)
              }
            />
          </Card>

          <Card icon={Mail} title="Email Identity">
            <Input
              label="Company Email"
              value={agent.company_email}
              disabled
            />

            <Input
              label="Auth Email"
              value={agent.auth_email}
              disabled
            />

            <Input
              label="Primary Sender Email"
              value={agent.primary_sender_email}
              onChange={(value) =>
                updateField(
                  "primary_sender_email",
                  value
                )
              }
            />

            <Input
              label="Forwarding Email"
              value={agent.forwarding_email}
              onChange={(value) =>
                updateField(
                  "forwarding_email",
                  value
                )
              }
            />
          </Card>

          <Card
            icon={Signature}
            title="Email Signature"
          >
            <Input
              label="Signature Title"
              value={agent.signature_title}
              onChange={(value) =>
                updateField(
                  "signature_title",
                  value
                )
              }
            />

            <Input
              label="Signature Phone"
              value={agent.signature_phone}
              onChange={(value) =>
                updateField(
                  "signature_phone",
                  value
                )
              }
            />

            <Input
              label="Signature Website"
              value={agent.signature_website}
              onChange={(value) =>
                updateField(
                  "signature_website",
                  value
                )
              }
            />
          </Card>

          <Card
            icon={Bell}
            title="FRBS Connect Alerts"
          >
            <Toggle
              label="Chat Alerts"
              checked={agent.chat_alerts_enabled}
              onChange={(value) =>
                updateField(
                  "chat_alerts_enabled",
                  value
                )
              }
            />

            <Toggle
              label="Direct Message Alerts"
              checked={agent.dm_alerts_enabled}
              onChange={(value) =>
                updateField(
                  "dm_alerts_enabled",
                  value
                )
              }
            />

            <Toggle
              label="Mention Alerts"
              checked={agent.mention_alerts_enabled}
              onChange={(value) =>
                updateField(
                  "mention_alerts_enabled",
                  value
                )
              }
            />

            <div className="mt-4 rounded-xl bg-[#f6eee7] p-4 text-sm font-bold text-[#6f2b31]">
              Announcements are always enabled for
              company updates.
            </div>
          </Card>

          <Card
            icon={LayoutDashboard}
            title="System Preferences"
          >
            <Toggle
              label="Compact Layout"
              checked={agent.compact_layout}
              onChange={(value) =>
                updateField(
                  "compact_layout",
                  value
                )
              }
            />

            <label className="mt-4 block">
              <span className="text-sm font-black">
                Default Landing Page
              </span>

              <select
                value={agent.default_landing_page}
                onChange={(event) =>
                  updateField(
                    "default_landing_page",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-[#4b0008]/15 bg-white px-4 py-3 outline-none focus:border-[#7a1118]"
              >
                <option value="/dashboard">
                  Dashboard
                </option>
                <option value="/inbox">
                  Inbox
                </option>
                <option value="/connect">
                  FRBS Connect
                </option>
                <option value="/agents">
                  Agents
                </option>
              </select>
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-black">
                Time Format
              </span>

              <select
                value={agent.time_format}
                onChange={(event) =>
                  updateField(
                    "time_format",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-[#4b0008]/15 bg-white px-4 py-3 outline-none focus:border-[#7a1118]"
              >
                <option value="12h">
                  12 Hour
                </option>
                <option value="24h">
                  24 Hour
                </option>
              </select>
            </label>
          </Card>

          <Card
            icon={ShieldCheck}
            title="Account & Security"
          >
            <StatusRow
              label="Account Active"
              value={
                agent.is_active
                  ? "Active"
                  : "Inactive"
              }
              good={agent.is_active}
            />

            <StatusRow
              label="Suspended"
              value={
                agent.suspended ? "Yes" : "No"
              }
              good={!agent.suspended}
            />

            <StatusRow
              label="Last Login"
              value={
                agent.last_login_at
                  ? new Date(
                      agent.last_login_at
                    ).toLocaleString()
                  : "Not recorded"
              }
            />

            <StatusRow
              label="Last Password Reset"
              value={
                agent.last_password_reset
                  ? new Date(
                      agent.last_password_reset
                    ).toLocaleString()
                  : "Not recorded"
              }
            />
          </Card>
        </section>
      </div>
    </main>
  );
}

function Shell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#4b0008]">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );
}

function Card({
  icon: Icon,
  title,
  children,
  className = "",
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-[#4b0008]/15 bg-white p-7 shadow-md ${className}`}
    >
      <div className="mb-6 flex items-center gap-3">
        <Icon className="h-7 w-7 text-[#4b0008]" />
        <h2 className="text-2xl font-black">
          {title}
        </h2>
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function ConnectionDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#4b0008]/10 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b5559]">
        {label}
      </p>

      <p className="mt-2 break-words font-black text-[#4b0008]">
        {value}
      </p>
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
      <span className="text-sm font-black">
        {label}
      </span>

      <input
        value={value || ""}
        disabled={disabled}
        onChange={(event) =>
          onChange?.(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-[#4b0008]/15 bg-white px-4 py-3 outline-none focus:border-[#7a1118] disabled:bg-gray-100 disabled:text-gray-500"
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
      className="flex w-full items-center justify-between rounded-2xl border border-[#4b0008]/10 bg-[#fbfaf8] px-5 py-4 transition hover:bg-[#f8f1ed]"
    >
      <span className="font-black">
        {label}
      </span>

      <span
        className={`rounded-full px-4 py-1 text-sm font-black ${
          checked
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
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
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#fbfaf8] px-4 py-3">
      <span className="font-bold">
        {label}
      </span>

      <span className="flex items-center gap-2 text-right font-black">
        {typeof good === "boolean" && (
          <CheckCircle
            size={16}
            className={
              good
                ? "text-green-600"
                : "text-red-600"
            }
          />
        )}

        {value}
      </span>
    </div>
  );
}

function formatDate(
  value: string | null
): string {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleString();
}