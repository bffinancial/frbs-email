import MessageCard from "./MessageCard";

type Email = {
  id: string;
  from_email?: string;
  to_email?: string;
  subject?: string;
  body?: string;
  created_at: string;
  direction?: string;
};

type Thread = {
  id: string;
  subject?: string;
  created_at?: string;
  updated_at?: string;
};

type ConversationViewProps = {
  thread: Thread;
  emails: Email[];
};

export default function ConversationView({
  thread,
  emails,
}: ConversationViewProps) {
  return (
    <section>
      <div className="sticky top-24 z-10 border-b border-[#4b0008]/10 bg-white/95 pb-5 backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7a1118]">
          Conversation
        </p>

        <h2 className="mt-2 line-clamp-2 text-2xl font-black text-[#4b0008]">
          {thread.subject || "(No subject)"}
        </h2>

        <p className="mt-2 text-sm text-[#6f2b31]">
          {emails.length} message{emails.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {emails.map((email) => (
          <MessageCard key={email.id} email={email} />
        ))}
      </div>
    </section>
  );
}