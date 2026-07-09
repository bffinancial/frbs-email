type Email = {
  id: string;
  from_email?: string;
  to_email?: string;
  subject?: string;
  body?: string;
  created_at: string;
  direction?: string;
};

type MessageCardProps = {
  email: Email;
};

function getInitial(value?: string) {
  return (value || "?").trim().charAt(0).toUpperCase();
}

export default function MessageCard({ email }: MessageCardProps) {
  const isOutbound = email.direction === "outbound";

  return (
    <div className="rounded-2xl border border-[#4b0008]/10 bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#4b0008] font-black text-white">
          {getInitial(email.from_email)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 border-b border-[#4b0008]/10 pb-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="truncate font-black text-[#4b0008]">
                {email.from_email || "Unknown sender"}
              </p>

              <p className="mt-1 text-sm text-[#6f2b31]">
                {isOutbound ? "Sent to" : "To"}: {email.to_email || "Unknown"}
              </p>
            </div>

            <p className="shrink-0 text-xs font-semibold text-[#6f2b31]">
              {new Date(email.created_at).toLocaleString()}
            </p>
          </div>

          <div className="mt-4 whitespace-pre-wrap break-words leading-7 text-[#2c0004]">
            {email.body || "No message content."}
          </div>
        </div>
      </div>
    </div>
  );
}