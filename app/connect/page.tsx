"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  UserRoundPlus,
  Users,
} from "lucide-react";

type ConversationType =
  | "channel"
  | "announcement"
  | "direct"
  | "group";

type Conversation = {
  id: string;
  type: ConversationType;
  name: string | null;
  slug: string | null;
  is_locked: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type ConversationMember = {
  conversation_id: string;
  agent_id: string;
  member_role: "owner" | "admin" | "member";
  notifications_enabled: boolean;
  last_read_at: string | null;
  joined_at: string;
};

type ConversationMessage = {
  id: string;
  conversation_id: string;
  sender_agent_id: string | null;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
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
  is_active: boolean;
  suspended: boolean;
};

export default function ConnectPage() {
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [memberships, setMemberships] = useState<ConversationMember[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [startingDirectMessage, setStartingDirectMessage] = useState<
    string | null
  >(null);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId
      ) || null,
    [conversations, activeConversationId]
  );

  const channelConversations = useMemo(
    () =>
      conversations.filter(
        (conversation) =>
          conversation.type === "channel" ||
          conversation.type === "announcement"
      ),
    [conversations]
  );

  const directConversations = useMemo(
    () =>
      conversations.filter(
        (conversation) => conversation.type === "direct"
      ),
    [conversations]
  );

  const filteredMessages = useMemo(() => {
    if (!search.trim()) return messages;

    const query = search.toLowerCase();

    return messages.filter((message) =>
      message.body.toLowerCase().includes(query)
    );
  }, [messages, search]);

  const canPostInActiveConversation = useMemo(() => {
    if (!activeConversation) return false;

    if (!activeConversation.is_locked) return true;

    return isCurrentAgentAdmin();
  }, [activeConversation, currentAgent]);

  useEffect(() => {
    initializeConnect();
  }, []);

  useEffect(() => {
    if (!activeConversationId || !hasAccess) return;

    loadMessages(activeConversationId);

    const realtimeChannel = supabaseClient
      .channel(`conversation-${activeConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const incomingMessage =
            payload.new as ConversationMessage;

          setMessages((current) => {
            const alreadyExists = current.some(
              (message) => message.id === incomingMessage.id
            );

            if (alreadyExists) return current;

            return [...current, incomingMessage];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const updatedMessage =
            payload.new as ConversationMessage;

          setMessages((current) =>
            current.map((message) =>
              message.id === updatedMessage.id
                ? updatedMessage
                : message
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(realtimeChannel);
    };
  }, [activeConversationId, hasAccess]);

  async function initializeConnect() {
    setCheckingAccess(true);

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      setHasAccess(false);
      setCheckingAccess(false);
      return;
    }

    const { data: agent, error: agentError } = await supabaseClient
      .from("agents")
      .select(
        "id,user_id,full_name,first_name,last_name,company_email,auth_email,role,is_active,suspended"
      )
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("suspended", false)
      .maybeSingle();

    if (agentError || !agent) {
      console.error("Agent access error:", agentError);
      setHasAccess(false);
      setCheckingAccess(false);
      return;
    }

    setCurrentAgent(agent);
    setHasAccess(true);

    await loadWorkspace(agent.id);

    setCheckingAccess(false);
  }

  async function loadWorkspace(
    currentAgentId: string,
    preferredConversationId?: string
  ) {
    const { data: memberRows, error: membershipError } =
      await supabaseClient
        .from("conversation_members")
        .select("*")
        .eq("agent_id", currentAgentId)
        .order("joined_at", { ascending: true });

    if (membershipError) {
      console.error("Membership error:", membershipError);
      return;
    }

    const loadedMemberships =
      (memberRows as ConversationMember[]) || [];

    setMemberships(loadedMemberships);

    const conversationIds = loadedMemberships.map(
      (membership) => membership.conversation_id
    );

    let loadedConversations: Conversation[] = [];

    if (conversationIds.length > 0) {
      const { data: conversationRows, error: conversationError } =
        await supabaseClient
          .from("conversations")
          .select("*")
          .in("id", conversationIds)
          .order("created_at", { ascending: true });

      if (conversationError) {
        console.error("Conversation error:", conversationError);
        return;
      }

      loadedConversations =
        (conversationRows as Conversation[]) || [];
    }

    const { data: agentRows, error: agentsError } =
      await supabaseClient
        .from("agents")
        .select(
          "id,user_id,full_name,first_name,last_name,company_email,auth_email,role,is_active,suspended"
        )
        .eq("is_active", true)
        .eq("suspended", false)
        .order("full_name", { ascending: true });

    if (agentsError) {
      console.error("Agents error:", agentsError);
      return;
    }

    setAgents((agentRows as Agent[]) || []);
    setConversations(loadedConversations);

    const nextConversationId =
      preferredConversationId ||
      activeConversationId ||
      loadedConversations.find(
        (conversation) => conversation.slug === "general"
      )?.id ||
      loadedConversations[0]?.id ||
      null;

    setActiveConversationId(nextConversationId);
  }

  async function loadMessages(conversationId: string) {
    setMessages([]);

    const { data, error } = await supabaseClient
      .from("conversation_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Message loading error:", error);
      return;
    }

    setMessages((data as ConversationMessage[]) || []);
  }

  async function sendMessage() {
    if (
      !newMessage.trim() ||
      !activeConversationId ||
      !currentAgent ||
      sending ||
      !canPostInActiveConversation
    ) {
      return;
    }

    setSending(true);

    const messageBody = newMessage.trim();

    const { error } = await supabaseClient
      .from("conversation_messages")
      .insert({
        conversation_id: activeConversationId,
        sender_agent_id: currentAgent.id,
        body: messageBody,
      });

    if (error) {
      alert(error.message);
      setSending(false);
      return;
    }

    setNewMessage("");
    setSending(false);
  }

  async function startDirectMessage(targetAgentId: string) {
    if (!currentAgent || targetAgentId === currentAgent.id) return;

    setStartingDirectMessage(targetAgentId);

    const { data, error } = await supabaseClient.rpc(
      "get_or_create_direct_conversation",
      {
        target_agent_id: targetAgentId,
      }
    );

    if (error) {
      alert(error.message);
      setStartingDirectMessage(null);
      return;
    }

    const conversationId = data as string;

    await loadWorkspace(currentAgent.id, conversationId);

    setActiveConversationId(conversationId);
    setStartingDirectMessage(null);
  }

  function isCurrentAgentAdmin() {
    const role = currentAgent?.role?.toLowerCase() || "";

    return role.includes("admin") || role.includes("owner");
  }

  function getAgentName(agent: Agent | undefined | null) {
    if (!agent) return "FORWARD Agent";

    if (agent.full_name?.trim()) {
      return agent.full_name.trim();
    }

    const combinedName = `${agent.first_name || ""} ${
      agent.last_name || ""
    }`.trim();

    return (
      combinedName ||
      agent.company_email ||
      agent.auth_email ||
      "FORWARD Agent"
    );
  }

  function getAgentById(agentId: string | null) {
    if (!agentId) return null;

    if (currentAgent?.id === agentId) {
      return currentAgent;
    }

    return agents.find((agent) => agent.id === agentId) || null;
  }

  function getConversationMembers(conversationId: string) {
    return memberships.filter(
      (membership) =>
        membership.conversation_id === conversationId
    );
  }

  function getDirectMessageAgent(conversationId: string) {
    const directMembers = getConversationMembers(conversationId);

    const otherMember = directMembers.find(
      (membership) => membership.agent_id !== currentAgent?.id
    );

    return getAgentById(otherMember?.agent_id || null);
  }

  function getConversationTitle(conversation: Conversation | null) {
    if (!conversation) return "Conversation";

    if (conversation.type === "direct") {
      return getAgentName(
        getDirectMessageAgent(conversation.id)
      );
    }

    return conversation.name || "Conversation";
  }

  function getConversationSubtitle(
    conversation: Conversation | null
  ) {
    if (!conversation) return "";

    if (conversation.type === "direct") {
      const otherAgent = getDirectMessageAgent(conversation.id);

      return (
        otherAgent?.role ||
        otherAgent?.company_email ||
        "Private direct message"
      );
    }

    if (conversation.type === "announcement") {
      return "Official FORWARD company announcements.";
    }

    if (conversation.slug === "help-desk") {
      return "Ask fellow agents for assistance.";
    }

    return "Talk with other FORWARD agents in real time.";
  }

  function formatMessageTime(value: string) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  }

  if (checkingAccess) {
    return (
      <AppLayout
        title="FRBS Connect"
        subtitle="Secure internal communication for active agents."
      >
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          Loading FRBS Connect...
        </div>
      </AppLayout>
    );
  }

  if (!hasAccess || !currentAgent) {
    return (
      <AppLayout
        title="FRBS Connect"
        subtitle="Secure internal communication for active agents."
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
      subtitle="Channels and private conversations for FORWARD agents."
    >
      <ConnectShell
        left={
          <div className="flex h-full flex-col p-5">
            <div className="mb-6 rounded-2xl bg-[#4b0008] p-5 text-white">
              <div className="flex items-center gap-3">
                <MessageCircle />

                <div>
                  <p className="text-lg font-black">
                    FRBS Connect
                  </p>

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
              {channelConversations.map((conversation) => {
                const active =
                  conversation.id === activeConversationId;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() =>
                      setActiveConversationId(conversation.id)
                    }
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left font-black transition ${
                      active
                        ? "bg-[#4b0008] text-white"
                        : "text-[#4b0008] hover:bg-[#f6eee7]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {conversation.is_locked ? (
                        <Lock size={16} />
                      ) : (
                        <Hash size={16} />
                      )}

                      {conversation.name || "Channel"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 border-t border-[#4b0008]/10 pt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7a1118]">
                  Direct Messages
                </p>

                <UserRoundPlus size={16} />
              </div>

              {directConversations.length === 0 ? (
                <p className="rounded-xl bg-[#f6eee7] p-3 text-xs font-semibold text-[#6f2b31]">
                  Select an agent to start a private message.
                </p>
              ) : (
                <div className="space-y-2">
                  {directConversations.map((conversation) => {
                    const otherAgent =
                      getDirectMessageAgent(conversation.id);

                    const agentName =
                      getAgentName(otherAgent);

                    const active =
                      conversation.id === activeConversationId;

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() =>
                          setActiveConversationId(conversation.id)
                        }
                        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                          active
                            ? "bg-[#4b0008] text-white"
                            : "hover:bg-[#f6eee7]"
                        }`}
                      >
                        <AgentAvatar
                          name={agentName}
                          size="sm"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {agentName}
                          </p>

                          <p
                            className={`truncate text-xs font-semibold ${
                              active
                                ? "text-white/70"
                                : "text-[#6f2b31]"
                            }`}
                          >
                            {otherAgent?.role ||
                              "Private conversation"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        }
        center={
          <>
            <div className="border-b border-[#4b0008]/10 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-black">
                    {activeConversation?.type === "direct"
                      ? getConversationTitle(activeConversation)
                      : `#${getConversationTitle(
                          activeConversation
                        )}`}
                  </h2>

                  <p className="truncate text-sm font-semibold text-[#6f2b31]">
                    {getConversationSubtitle(
                      activeConversation
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-[#4b0008]/10 bg-[#fbfaf8] px-4 py-3">
                  <Search size={16} />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search messages"
                    className="w-40 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {!activeConversation ? (
                <ConnectEmptyState
                  title="Choose a conversation"
                  text="Select a channel or start a direct message."
                />
              ) : filteredMessages.length === 0 ? (
                <ConnectEmptyState
                  title={
                    search
                      ? "No matching messages"
                      : "No messages yet"
                  }
                  text={
                    search
                      ? "Try another search."
                      : "Start the conversation."
                  }
                />
              ) : (
                filteredMessages.map((message) => {
                  const sender = getAgentById(
                    message.sender_agent_id
                  );

                  const senderName = getAgentName(sender);
                  const mine =
                    message.sender_agent_id === currentAgent.id;

                  return (
                    <div
                      key={message.id}
                      className="flex gap-3"
                    >
                      <AgentAvatar name={senderName} />

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="font-black text-[#4b0008]">
                            {senderName}
                          </p>

                          {mine && (
                            <span className="rounded-full bg-[#f6eee7] px-2 py-0.5 text-[11px] font-bold text-[#7a1118]">
                              You
                            </span>
                          )}

                          <p className="text-xs font-semibold text-[#6f2b31]">
                            {sender?.role ||
                              "FORWARD Agent"}
                          </p>

                          <p className="text-xs text-[#6f2b31]">
                            {formatMessageTime(
                              message.created_at
                            )}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#f6eee7] px-5 py-3 text-[#4b0008]">
                          <p className="whitespace-pre-wrap text-sm font-semibold leading-6">
                            {message.body}
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
                  onChange={(event) =>
                    setNewMessage(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={
                    !activeConversation ||
                    !canPostInActiveConversation
                  }
                  placeholder={
                    !activeConversation
                      ? "Select a conversation."
                      : !canPostInActiveConversation
                        ? "Only administrators can post here."
                        : `Message ${getConversationTitle(
                            activeConversation
                          )}`
                  }
                  className="min-h-[56px] flex-1 resize-none rounded-2xl border border-[#4b0008]/15 px-4 py-3 outline-none focus:border-[#4b0008] disabled:bg-gray-100"
                />

                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={
                    sending ||
                    !activeConversation ||
                    !canPostInActiveConversation ||
                    !newMessage.trim()
                  }
                  className="flex items-center gap-2 rounded-2xl bg-[#4b0008] px-6 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
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
              Available Agents
            </p>

            <div className="space-y-3">
              {agents
                .filter(
                  (agent) => agent.id !== currentAgent.id
                )
                .map((agent) => {
                  const agentName = getAgentName(agent);
                  const loading =
                    startingDirectMessage === agent.id;

                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() =>
                        startDirectMessage(agent.id)
                      }
                      disabled={loading}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition hover:bg-[#f6eee7] disabled:opacity-60"
                    >
                      <AgentAvatar
                        name={agentName}
                        size="sm"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">
                          {agentName}
                        </p>

                        <p className="truncate text-xs font-semibold text-[#6f2b31]">
                          {loading
                            ? "Opening conversation..."
                            : agent.role ||
                              agent.company_email ||
                              "FORWARD Agent"}
                        </p>
                      </div>

                      <MessageCircle size={16} />
                    </button>
                  );
                })}
            </div>

            <div className="mt-6 rounded-3xl border border-[#4b0008]/10 bg-white p-5 shadow-sm">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-[#7a1118]">
                Quick Actions
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-[#f6eee7] px-4 py-3 font-black text-[#4b0008]">
                  <Users size={18} />
                  Select an agent to message
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/settings")}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#f6eee7] px-4 py-3 text-left font-black text-[#4b0008]"
                >
                  <Bell size={18} />
                  Alert Preferences
                </button>

                <div className="flex items-center gap-3 rounded-2xl bg-[#f6eee7] px-4 py-3 font-black text-[#4b0008]">
                  <ShieldCheck size={18} />
                  Company agents only
                </div>
              </div>
            </div>
          </div>
        }
      />
    </AppLayout>
  );
}