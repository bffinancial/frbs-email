"use client";

import Header from "@/components/Header";
import { Mail, Plus, RefreshCcw, Trash2, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";

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

export default function AgentsContent() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [forwardingEmail, setForwardingEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Agent");
  const [status, setStatus] = useState("");

  async function loadAgents() {
    setLoading(true);

    const res = await fetch("/api/agents");
    const data = await res.json();

    setAgents(data.agents || []);
    setLoading(false);
  }

  async function addAgent() {
    setSaving(true);
    setStatus("Creating agent and sending invite...");

    const res = await fetch("/api/agents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName,
        lastName,
        forwardingEmail,
        phone,
        role,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || "Something went wrong.");
      setSaving(false);
      return;
    }

    setFirstName("");
    setLastName("");
    setForwardingEmail("");
    setPhone("");
    setRole("Agent");
    setStatus(data.message || `Created ${data.agent.company_email}`);
    setSaving(false);
    loadAgents();
  }

  async function deleteAgent(agent: Agent) {
    const confirmed = window.confirm(
      `Permanently delete ${agent.full_name}?\n\nThis will remove the agent from FORWARD Mail and Supabase Auth.`
    );

    if (!confirmed) return;

    setDeletingId(agent.id);
    setStatus(`Deleting ${agent.full_name}...`);

    const res = await fetch("/api/agents", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId: agent.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || "Failed to delete agent.");
      setDeletingId("");
      return;
    }

    setStatus(data.message || "Agent deleted.");
    setDeletingId("");
    loadAgents();
  }

  useEffect(() => {
    loadAgents();
  }, []);

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#4b0008]">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="flex flex-col gap-5 border-b border-[#4b0008]/15 pb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bold uppercase tracking-[0.25em] text-[#7a1118]">
              FORWARD Mail
            </p>
            <h1 className="mt-3 text-5xl font-black">Agents</h1>
            <p className="mt-3 text-lg text-[#6f2b31]">
              Create and manage FRBS agent email identities.
            </p>
          </div>

          <button
            onClick={loadAgents}
            className="flex w-fit items-center gap-2 rounded-xl border border-[#4b0008]/20 px-5 py-3 font-bold text-[#4b0008] transition hover:bg-[#f5eee7]"
          >
            <RefreshCcw className="h-5 w-5" />
            Refresh
          </button>
        </header>

        <section className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <div className="rounded-2xl border border-[#4b0008]/15 bg-white p-8 shadow-md">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5eee7]">
                <Plus className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold">Add Agent</h2>
            </div>

            <div className="space-y-4">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full rounded-xl border border-[#4b0008]/20 bg-[#fbfaf8] px-4 py-3 outline-none"
              />

              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full rounded-xl border border-[#4b0008]/20 bg-[#fbfaf8] px-4 py-3 outline-none"
              />

              <input
                value={forwardingEmail}
                onChange={(e) => setForwardingEmail(e.target.value)}
                placeholder="Login / forwarding email"
                className="w-full rounded-xl border border-[#4b0008]/20 bg-[#fbfaf8] px-4 py-3 outline-none"
              />

              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number optional"
                className="w-full rounded-xl border border-[#4b0008]/20 bg-[#fbfaf8] px-4 py-3 outline-none"
              />

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-[#4b0008]/20 bg-[#fbfaf8] px-4 py-3 outline-none"
              >
                <option>Agent</option>
                <option>Manager</option>
                <option>Admin</option>
              </select>

              <div className="rounded-xl border border-dashed border-[#4b0008]/25 bg-[#fbfaf8] p-4">
                <p className="text-sm font-bold">Generated FORWARD Email</p>
                <p className="mt-2 text-lg">
                  {firstName && lastName
                    ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@frbsmail.com`
                    : "first.last@frbsmail.com"}
                </p>
              </div>

              <button
                onClick={addAgent}
                disabled={saving}
                className="w-full rounded-xl bg-[#4b0008] px-5 py-3 font-bold text-white transition hover:bg-[#6b1018] disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create Agent + Send Invite"}
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
                <h2 className="text-2xl font-bold">FRBS Agent Directory</h2>
                <p className="mt-1 text-[#6f2b31]">
                  Agents with active @frbsmail.com identities.
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-[#6f2b31]">Loading agents...</p>
            ) : agents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#4b0008]/25 bg-[#fbfaf8] p-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-6 w-6" />
                  <p className="font-bold">No agents added yet</p>
                </div>
                <p className="mt-3 text-[#6f2b31]">
                  Add your first FRBS agent to create their professional email
                  identity.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#4b0008]/15">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#f5eee7]">
                    <tr>
                      <th className="p-4">Agent</th>
                      <th className="p-4">FORWARD Email</th>
                      <th className="p-4">Login / Forwarding</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {agents.map((agent) => (
                      <tr
                        key={agent.id}
                        className="border-t border-[#4b0008]/10"
                      >
                        <td className="p-4">
                          <p className="font-bold">{agent.full_name}</p>
                          {agent.phone && (
                            <p className="text-sm text-[#6f2b31]">
                              {agent.phone}
                            </p>
                          )}
                        </td>

                        <td className="p-4 font-semibold">
                          {agent.company_email}
                        </td>

                        <td className="p-4">{agent.forwarding_email}</td>

                        <td className="p-4">{agent.role}</td>

                        <td className="p-4">
                          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                            Active
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => deleteAgent(agent)}
                            disabled={deletingId === agent.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingId === agent.id ? "Deleting..." : "Delete"}
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