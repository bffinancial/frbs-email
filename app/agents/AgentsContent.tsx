"use client";

import Header from "@/components/Header";
import {
  CheckCircle2,
  Mail,
  Plus,
  RefreshCcw,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Agent = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  forwarding_email: string;
  company_email: string;
  phone: string | null;
  role: string | null;
  status: string;
  is_active: boolean;
};

const EMAIL_DOMAIN = "@frbsmail.com";

function createSuggestedUsername(
  firstName: string,
  lastName: string
): string {
  const cleanFirstName = firstName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const cleanLastName = lastName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (cleanFirstName && cleanLastName) {
    return `${cleanFirstName}.${cleanLastName}`;
  }

  return cleanFirstName || cleanLastName;
}

function sanitizeEmailUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/@frbsmail\.com$/i, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "");
}

function isValidEmailUsername(value: string): boolean {
  if (value.length < 1 || value.length > 64) {
    return false;
  }

  if (!/^[a-z0-9]/.test(value)) {
    return false;
  }

  if (!/[a-z0-9]$/.test(value)) {
    return false;
  }

  if (/[._-]{2,}/.test(value)) {
    return false;
  }

  return /^[a-z0-9._-]+$/.test(value);
}

export default function AgentsContent() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailUsername, setEmailUsername] = useState("");
  const [emailUsernameEdited, setEmailUsernameEdited] =
    useState(false);
  const [forwardingEmail, setForwardingEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Agent");
  const [status, setStatus] = useState("");

  const suggestedUsername = useMemo(
    () => createSuggestedUsername(firstName, lastName),
    [firstName, lastName]
  );

  const effectiveUsername =
    emailUsername || suggestedUsername;

  const companyEmail = effectiveUsername
    ? `${effectiveUsername}${EMAIL_DOMAIN}`
    : `username${EMAIL_DOMAIN}`;

  const usernameIsValid =
    effectiveUsername.length > 0 &&
    isValidEmailUsername(effectiveUsername);

  const usernameAlreadyExists = agents.some(
    (agent) =>
      agent.company_email?.toLowerCase() ===
      companyEmail.toLowerCase()
  );

  useEffect(() => {
    if (!emailUsernameEdited) {
      setEmailUsername(suggestedUsername);
    }
  }, [suggestedUsername, emailUsernameEdited]);

  useEffect(() => {
    void loadAgents();
  }, []);

  async function loadAgents() {
    setLoading(true);

    try {
      const response = await fetch("/api/agents", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Unable to load agents.");
        return;
      }

      setAgents(data.agents || []);
    } catch {
      setStatus("Unable to load agents.");
    } finally {
      setLoading(false);
    }
  }

  function handleEmailUsernameChange(value: string) {
    setEmailUsernameEdited(true);
    setEmailUsername(sanitizeEmailUsername(value));
  }

  function useSuggestedUsername() {
    setEmailUsernameEdited(false);
    setEmailUsername(suggestedUsername);
  }

  async function addAgent() {
    if (saving) return;

    const normalizedUsername =
      sanitizeEmailUsername(effectiveUsername);

    if (!firstName.trim() || !lastName.trim()) {
      setStatus("First name and last name are required.");
      return;
    }

    if (!forwardingEmail.trim()) {
      setStatus(
        "A personal or forwarding email is required for the invitation."
      );
      return;
    }

    if (!isValidEmailUsername(normalizedUsername)) {
      setStatus(
        "Enter a valid FRBS email username using letters, numbers, periods, hyphens, or underscores."
      );
      return;
    }

    if (usernameAlreadyExists) {
      setStatus(
        `${normalizedUsername}${EMAIL_DOMAIN} is already in use.`
      );
      return;
    }

    setSaving(true);
    setStatus("Creating agent and sending invite...");

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          emailUsername: normalizedUsername,
          forwardingEmail,
          phone,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Something went wrong.");
        return;
      }

      setFirstName("");
      setLastName("");
      setEmailUsername("");
      setEmailUsernameEdited(false);
      setForwardingEmail("");
      setPhone("");
      setRole("Agent");
      setStatus(
        data.message ||
          `Created ${data.agent.company_email}`
      );

      await loadAgents();
    } catch {
      setStatus("Unable to create the agent.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAgent(agent: Agent) {
    const confirmed = window.confirm(
      `Permanently delete ${agent.full_name}?\n\nThis will remove the agent from FORWARD Mail and Supabase Auth.`
    );

    if (!confirmed) return;

    setDeletingId(agent.id);
    setStatus(`Deleting ${agent.full_name}...`);

    try {
      const response = await fetch("/api/agents", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: agent.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Failed to delete agent.");
        return;
      }

      setStatus(data.message || "Agent deleted.");
      await loadAgents();
    } catch {
      setStatus("Failed to delete agent.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#4b0008]">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="flex flex-col gap-5 border-b border-[#4b0008]/15 pb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bold uppercase tracking-[0.25em] text-[#7a1118]">
              FORWARD Mail
            </p>

            <h1 className="mt-3 text-5xl font-black">
              Agents
            </h1>

            <p className="mt-3 text-lg text-[#6f2b31]">
              Create and manage FRBS agent email
              identities.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAgents}
            disabled={loading}
            className="flex w-fit items-center gap-2 rounded-xl border border-[#4b0008]/20 px-5 py-3 font-bold text-[#4b0008] transition hover:bg-[#f5eee7] disabled:opacity-60"
          >
            <RefreshCcw
              className={`h-5 w-5 ${
                loading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </header>

        <section className="mt-8 grid gap-8 lg:grid-cols-[440px_1fr]">
          <div className="rounded-2xl border border-[#4b0008]/15 bg-white p-8 shadow-md">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5eee7]">
                <Plus className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  Add Agent
                </h2>
                <p className="mt-1 text-sm text-[#6f2b31]">
                  Create the login and choose the exact
                  FRBS Mail address.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledInput
                  label="First Name"
                  value={firstName}
                  onChange={setFirstName}
                  placeholder="Robin"
                />

                <LabeledInput
                  label="Last Name"
                  value={lastName}
                  onChange={setLastName}
                  placeholder="Denny"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-sm font-black">
                    FRBS Email Username
                  </label>

                  {suggestedUsername &&
                    emailUsernameEdited && (
                      <button
                        type="button"
                        onClick={useSuggestedUsername}
                        className="text-xs font-black text-[#7a1118] underline underline-offset-4"
                      >
                        Use suggested
                      </button>
                    )}
                </div>

                <div className="flex overflow-hidden rounded-xl border border-[#4b0008]/20 bg-[#fbfaf8] focus-within:border-[#7a1118]">
                  <input
                    value={emailUsername}
                    onChange={(event) =>
                      handleEmailUsernameChange(
                        event.target.value
                      )
                    }
                    placeholder="hello"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
                  />

                  <div className="flex items-center border-l border-[#4b0008]/15 bg-[#f5eee7] px-4 font-bold text-[#6f2b31]">
                    @frbsmail.com
                  </div>
                </div>

                <div className="mt-2 flex items-start gap-2 text-sm">
                  {!effectiveUsername ? (
                    <span className="text-[#6f2b31]">
                      Enter a username such as hello,
                      robin, support, or sales.
                    </span>
                  ) : !usernameIsValid ? (
                    <>
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      <span className="font-bold text-red-700">
                        Use letters, numbers, periods,
                        hyphens, or underscores. The
                        username must begin and end with
                        a letter or number.
                      </span>
                    </>
                  ) : usernameAlreadyExists ? (
                    <>
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      <span className="font-bold text-red-700">
                        {companyEmail} is already in use.
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span className="font-bold text-green-700">
                        {companyEmail} is available in
                        the current agent directory.
                      </span>
                    </>
                  )}
                </div>
              </div>

              <LabeledInput
                label="Personal / Forwarding Email"
                value={forwardingEmail}
                onChange={setForwardingEmail}
                placeholder="robin@hotmail.com"
                type="email"
                helperText="The invitation and forwarded email notifications will be sent here."
              />

              <LabeledInput
                label="Phone Number"
                value={phone}
                onChange={setPhone}
                placeholder="Optional"
                type="tel"
              />

              <label className="block">
                <span className="text-sm font-black">
                  Role
                </span>

                <select
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#4b0008]/20 bg-[#fbfaf8] px-4 py-3 outline-none focus:border-[#7a1118]"
                >
                  <option value="Agent">Agent</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </label>

              <div className="rounded-xl border border-dashed border-[#4b0008]/25 bg-[#fbfaf8] p-4">
                <p className="text-sm font-bold">
                  Final FORWARD Email
                </p>

                <p className="mt-2 break-all text-lg font-black">
                  {companyEmail}
                </p>

                <p className="mt-2 text-sm text-[#6f2b31]">
                  This address will be used as the
                  agent’s FRBS Mail login and company
                  email identity.
                </p>
              </div>

              <button
                type="button"
                onClick={addAgent}
                disabled={
                  saving ||
                  !usernameIsValid ||
                  usernameAlreadyExists
                }
                className="w-full rounded-xl bg-[#4b0008] px-5 py-3 font-bold text-white transition hover:bg-[#6b1018] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Creating..."
                  : "Create Agent + Send Invite"}
              </button>

              {status && (
                <p className="rounded-xl bg-[#f5eee7] p-3 text-sm font-semibold">
                  {status}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#4b0008]/15 bg-white p-8 shadow-md">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5eee7]">
                <UserCheck className="h-7 w-7" />
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  FRBS Agent Directory
                </h2>

                <p className="mt-1 text-[#6f2b31]">
                  Agents with active @frbsmail.com
                  identities.
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-[#6f2b31]">
                Loading agents...
              </p>
            ) : agents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#4b0008]/25 bg-[#fbfaf8] p-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-6 w-6" />
                  <p className="font-bold">
                    No agents added yet
                  </p>
                </div>

                <p className="mt-3 text-[#6f2b31]">
                  Add your first FRBS agent to create
                  their professional email identity.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#4b0008]/15">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead className="bg-[#f5eee7]">
                    <tr>
                      <th className="p-4">Agent</th>
                      <th className="p-4">
                        FORWARD Email
                      </th>
                      <th className="p-4">
                        Personal / Forwarding
                      </th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {agents.map((agent) => (
                      <tr
                        key={agent.id}
                        className="border-t border-[#4b0008]/10"
                      >
                        <td className="p-4">
                          <p className="font-bold">
                            {agent.full_name}
                          </p>

                          {agent.phone && (
                            <p className="text-sm text-[#6f2b31]">
                              {agent.phone}
                            </p>
                          )}
                        </td>

                        <td className="p-4 font-semibold">
                          {agent.company_email}
                        </td>

                        <td className="p-4">
                          {agent.forwarding_email}
                        </td>

                        <td className="p-4">
                          {agent.role}
                        </td>

                        <td className="p-4">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-bold ${
                              agent.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {agent.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              deleteAgent(agent)
                            }
                            disabled={
                              deletingId === agent.id
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />

                            {deletingId === agent.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  helperText?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-[#4b0008]/20 bg-[#fbfaf8] px-4 py-3 outline-none focus:border-[#7a1118]"
      />

      {helperText && (
        <span className="mt-2 block text-xs leading-5 text-[#6f2b31]">
          {helperText}
        </span>
      )}
    </label>
  );
}