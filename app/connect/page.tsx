"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import ConnectShell from "@/components/connect/ConnectShell";
import AgentAvatar from "@/components/connect/AgentAvatar";
import ConnectEmptyState from "@/components/connect/ConnectEmptyState";
import { supabaseClient } from "@/lib/supabaseClient";
import {
  Bell,
  Hash,
  Lock,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";

type Channel = {
  id: string;
  name: string;
  type: string;
  is_locked: boolean;
};

type ChatMessage = {
  id: string;
  channel_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type Agent = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  company_email: string | null;
  auth_email: string | null;
  role: string | null;
};

export default function ConnectPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  const activeChannel = useMemo(
    () => channels.find((channel) => channel.id === activeChannelId),
    [channels, activeChannelId]
  );

  const filteredMessages = useMemo(() => {
    if (!search.trim()) return messages;

    return messages.filter((message) =>
      message.message.toLowerCase().includes(search.toLowerCase())
    );
  }, [messages, search]);

  useEffect(() => {
    loadUserAndAccess();
  }, []);

  useEffect(() => {
    if (!hasAccess) return;
    loadChannels();
    loadAgents();
  }, [hasAccess]);

  useEffect(() => {
    if (!activeChannelId || !hasAccess) return;

    loadMessages(activeChannelId);

    const channel = supabaseClient
      .channel(`frbs-connect-${activeChannelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${activeChannelId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [activeChannelId, hasAccess]);

  async function loadUserAndAccess() {
    setCheckingAccess(true);

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      setHasAccess(false);
      setCheckingAccess(false);
      return;
    }

    setUserId(user.id);

    const { data } = await supabaseClient
      .from("agents")
      .select("id")
      .or(
        `user_id.eq.${user.id},auth_email.eq.${user.email},company_email.eq.${user.email}`
      )
      .eq("is_active", true)
      .eq("suspended", false)
      .maybeSingle();

    setHasAccess(!!data);
    setCheckingAccess(false);
  }

  async function loadChannels() {
    const { data, error } = await supabaseClient
      .from("chat_channels")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setChannels(data || []);

    if (!activeChannelId && data && data.length > 0) {
      setActiveChannelId(data[0].id);
    }
  }

  async function loadAgents() {
    const { data, error } = await supabaseClient
      .from("agents")
      .select(
        "id,user_id,full_name,first_name,last_name,company_email,auth_email,role"
      )
      .eq("is_active", true)
      .eq("suspended", false)
      .order("full_name", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setAgents(data || []);
  }

  async function loadMessages(channelId: string) {
    const { data, error } = await supabaseClient
      .from("chat_messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setMessages(data || []);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeChannelId || !userId || sending) return;

    if (activeChannel?.is_locked) {
      alert("This channel is locked.");
      return;
    }

    setSending(true);

    const { error } = await supabaseClient.from("chat_messages").insert({
      channel_id: activeChannelId,
      sender_id: userId,
      message: newMessage.trim(),
    });

    if (error) {
      alert(error.message);
      setSending(false);
      return;
    }

    setNewMessage("");
    setSending(false);
  }

  function getAgentByUserId(senderId: string) {
    return agents.find((agent) => agent.user_id === senderId);
  }

  function getAgentName(senderId: string) {
    const agent = getAgentByUserId(senderId);

    if (!agent) return "FRBS Agent";
    if (agent.full_name) return agent.full_name;

    const name = `${agent.first_name || ""} ${agent.last_name || ""}`.trim();

    return name || agent.company_email || agent.auth_email || "FRBS Agent";
  }

  function getAgentRole(senderId: string) {
    return getAgentByUserId(senderId)?.role || "FORWARD Agent";
  }

  function getAgentDisplayName(agent: Agent) {
    if (agent.full_name) return agent.full_name;

    const name = `${agent.first_name || ""} ${agent.last_name || ""}`.trim();

    return name || agent.company_email || agent.auth_email || "FORWARD Agent";
  }

  if (checkingAccess) {
    return (
      <AppLayout
        title="FRBS Connect"
        subtitle="Secure internal chat for active agents."
      >
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          Checking access...
        </div>
      </AppLayout>
    );
  }

  if (!hasAccess) {
    return (
      <AppLayout
        title="FRBS Connect"
        subtitle="Secure internal chat for active agents."
      >
        <div className="rounded-3xl border border-red-200 bg-white p-8 text-red-700 shadow-sm">
          You do not currently have access to FRBS Connect. Only active agents
          can use this feature.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="FRBS Connect"
      subtitle="Private Discord-style communication for existing agents."
    >
      <ConnectShell
        left={
          <div className="flex h-full flex-col p-5">
            <div className="mb-6 rounded-2xl bg-[#4b0008] p-5 text-white">
              <div className="flex items-center gap-3">
                <MessageCircle />
                <div>
                  <p className="text-lg font-black">FRBS Connect</p>
                  <p className="text-xs font-semibold text-white/70">
                    Internal agent workspace
                  </p>
                </div>
              </div>
            </div>

            <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#7a1118]">
              Channels
            </p>

            <div className="space-y-2">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannelId(channel.id)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left font-black transition ${
                    activeChannelId === channel.id
                      ? "bg-[#4b0008] text-white"
                      : "text-[#4b0008] hover:bg-[#f6eee7]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {channel.is_locked ? <Lock size={16} /> : <Hash size={16} />}
                    {channel.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-8 border-t border-[#4b0008]/10 pt-6">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#7a1118]">
                Direct Messages
              </p>

              <div className="space-y-2">
                {agents.slice(0, 5).map((agent) => (
                  <button
                    key={agent.id}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-[#f6eee7]"
                  >
                    <AgentAvatar name={getAgentDisplayName(agent)} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">
                        {getAgentDisplayName(agent)}
                      </p>
                      <p className="truncate text-xs font-semibold text-[#6f2b31]">
                        Coming soon
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        }
        center={
          <>
            <div className="border-b border-[#4b0008]/10 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">
                    #{activeChannel?.name || "Channel"}
                  </h2>
                  <p className="text-sm font-semibold text-[#6f2b31]">
                    {activeChannel?.is_locked
                      ? "Announcements are locked for admin updates."
                      : "Talk with other FORWARD agents in real time."}
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-[#4b0008]/10 bg-[#fbfaf8] px-4 py-3">
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search messages"
                    className="w-40 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {filteredMessages.length === 0 ? (
                <ConnectEmptyState
                  title="No messages yet"
                  text="Start the conversation with your fellow agents."
                />
              ) : (
                filteredMessages.map((message) => {
                  const mine = message.sender_id === userId;
                  const name = getAgentName(message.sender_id);

                  return (
                    <div key={message.id} className="flex gap-3">
                      <AgentAvatar name={name} />

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="font-black text-[#4b0008]">{name}</p>

                          {mine && (
                            <span className="rounded-full bg-[#f6eee7] px-2 py-0.5 text-[11px] font-bold text-[#7a1118]">
                              You
                            </span>
                          )}

                          <p className="text-xs font-semibold text-[#6f2b31]">
                            {getAgentRole(message.sender_id)}
                          </p>

                          <p className="text-xs text-[#6f2b31]">
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#f6eee7] px-5 py-3 text-[#4b0008]">
                          <p className="whitespace-pre-wrap text-sm font-semibold leading-6">
                            {message.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-[#4b0008]/10 p-5">
              <div className="flex gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={activeChannel?.is_locked}
                  placeholder={
                    activeChannel?.is_locked
                      ? "This channel is locked."
                      : `Message #${activeChannel?.name || "channel"}`
                  }
                  className="min-h-[56px] flex-1 resize-none rounded-2xl border border-[#4b0008]/15 px-4 py-3 outline-none focus:border-[#4b0008]"
                />

                <button
                  onClick={sendMessage}
                  disabled={sending || activeChannel?.is_locked}
                  className="flex items-center gap-2 rounded-2xl bg-[#4b0008] px-6 py-3 font-black text-white disabled:opacity-50"
                >
                  <Send size={18} />
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </>
        }
        right={
          <div className="flex h-full flex-col p-5">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-[#7a1118]">
              Online Agents
            </p>

            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
                >
                  <div className="relative">
                    <AgentAvatar name={getAgentDisplayName(agent)} size="sm" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">
                      {getAgentDisplayName(agent)}
                    </p>
                    <p className="truncate text-xs font-semibold text-[#6f2b31]">
                      {agent.role || "FORWARD Agent"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-[#4b0008]/10 bg-white p-5 shadow-sm">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-[#7a1118]">
                Quick Actions
              </p>

              <div className="space-y-3">
                <button className="flex w-full items-center gap-3 rounded-2xl bg-[#f6eee7] px-4 py-3 text-left font-black text-[#4b0008]">
                  <Users size={18} />
                  Start Direct Message
                </button>

                <button className="flex w-full items-center gap-3 rounded-2xl bg-[#f6eee7] px-4 py-3 text-left font-black text-[#4b0008]">
                  <Bell size={18} />
                  Alert Preferences
                </button>

                <button className="flex w-full items-center gap-3 rounded-2xl bg-[#f6eee7] px-4 py-3 text-left font-black text-[#4b0008]">
                  <ShieldCheck size={18} />
                  Company Only
                </button>
              </div>
            </div>
          </div>
        }
      />
    </AppLayout>
  );
}