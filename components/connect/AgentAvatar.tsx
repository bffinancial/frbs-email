export default function AgentAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base",
  };

  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-[#4b0008] font-black text-white`}
    >
      {initials || "FA"}
    </div>
  );
}