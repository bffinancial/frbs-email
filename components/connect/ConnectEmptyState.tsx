export default function ConnectEmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#4b0008]/20 bg-[#fbfaf8] p-8 text-center">
      <h3 className="text-xl font-black text-[#4b0008]">{title}</h3>
      <p className="mt-2 text-sm font-semibold text-[#6f2b31]">{text}</p>
    </div>
  );
}