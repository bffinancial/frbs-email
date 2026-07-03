type Email = {
  id: string;
  from_email?: string;
  to_email?: string;
  body?: string;
  created_at: string;
};

type MessageCardProps = {
  email: Email;
};

export default function MessageCard({ email }: MessageCardProps) {
  return (
    <div className="rounded-2xl border border-[#4b0008]/10 bg-[#fbfaf8] p-6">
      <div className="border-b border-[#4b0008]/10 pb-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-black">
              {email.from_email || "Unknown sender"}
            </p>

            {email.to_email && (
              <p className="mt-1 text-sm text-[#6f2b31]">
                To: {email.to_email}
              </p>
            )}
          </div>

          <p className="text-sm text-[#6f2b31]">
            {new Date(email.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-5 whitespace-pre-wrap leading-8 text-[#3b0006]">
        {email.body || "No message content."}
      </div>
    </div>
  );
}