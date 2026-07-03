import MessageCard from "./MessageCard";

type Email = {
  id: string;
  from_email?: string;
  to_email?: string;
  body?: string;
  created_at: string;
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
    <div>
      <div className="border-b border-[#4b0008]/10 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7a1118]">
          Conversation Thread
        </p>

        <h2 className="mt-3 text-3xl font-black">
          {thread.subject || "(No subject)"}
        </h2>

        <p className="mt-4 text-sm text-[#6f2b31]">
          {emails.length} message{emails.length === 1 ? "" : "s"} in this
          conversation
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {emails.map((email) => (
          <MessageCard key={email.id} email={email} />
        ))}
      </div>
    </div>
  );
}