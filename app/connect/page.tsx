"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabaseClient } from "@/lib/supabaseClient";
import { Send } from "lucide-react";

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

export default function ConnectPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const activeChannel = useMemo(
    () => channels.find((channel) => channel.id === activeChannelId),
    [channels, activeChannelId]
  );

  useEffect(() => {
    loadUserAndAccess();
  }, []);

  useEffect(() => {
    if (!hasAccess) return;
    loadChannels();
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
          setMessages((current) => [
            ...current,
            payload.new as ChatMessage,
          ]);
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

    const { data: agentByUserId } = await supabaseClient
      .from("agents")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (agentByUserId) {
      setHasAccess(true);
      setCheckingAccess(false);
      return;
    }

    const { data: agentByEmail } = await supabaseClient
      .from("agents")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    setHasAccess(!!agentByEmail);
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

  if (checkingAccess) {
    return (
      <AppLayout
        title="FRBS Connect"
        subtitle="Secure internal chat for active agents."
      >
        <div className="rounded-2xl bg-white p-8 shadow-sm">
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
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-red-700 shadow-sm">
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
      <div className="grid min-h-[650px] grid-cols-12 overflow-hidden rounded-3xl border border-[#4b0008]/10 bg-white shadow-sm">
        <aside className="col-span-3 border-r border-[#4b0008]/10 bg-[#fbfaf8] p-5">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-[#7a1118]">
            Channels
          </p>

          <div className="space-y-2">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setActiveChannelId(channel.id)}
                className={`w-full rounded-xl px-4 py-3 text-left font-bold transition ${
                  activeChannelId === channel.id
                    ? "bg-[#4b0008] text-white"
                    : "hover:bg-[#f6eee7]"
                }`}
              >
                # {channel.name}
              </button>
            ))}
          </div>
        </aside>

        <section className="col-span-9 flex flex-col">
          <div className="border-b border-[#4b0008]/10 px-6 py-5">
            <h2 className="text-2xl font-black">
              #{activeChannel?.name || "Channel"}
            </h2>
            <p className="text-sm text-[#6f2b31]">
              {activeChannel?.is_locked
                ? "Announcements channel is currently locked."
                : "Talk with other FRBS agents in real time."}
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#4b0008]/20 p-8 text-center text-[#6f2b31]">
                No messages yet. Start the conversation.
              </div>
            ) : (
              messages.map((message) => {
                const mine = message.sender_id === userId;

                return (
                  <div
                    key={message.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                        mine
                          ? "bg-[#4b0008] text-white"
                          : "bg-[#f6eee7] text-[#4b0008]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm font-semibold">
                        {message.message}
                      </p>
                      <p className="mt-2 text-[11px] opacity-70">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
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
                    : "Message FRBS Connect..."
                }
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-[#4b0008]/15 px-4 py-3 outline-none focus:border-[#4b0008]"
              />

              <button
                onClick={sendMessage}
                disabled={sending || activeChannel?.is_locked}
                className="flex items-center gap-2 rounded-2xl bg-[#4b0008] px-6 py-3 font-black text-white disabled:opacity-50"
              >
                <Send size={18} />
                Send
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}