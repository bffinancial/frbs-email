import {
  Archive,
  Forward,
  Mail,
  MailPlus,
  RefreshCcw,
  Star,
  Trash2,
} from "lucide-react";

type MailToolbarProps = {
  onRefresh?: () => void;
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onStar?: () => void;
};

export default function MailToolbar({
  onRefresh,
  onReply,
  onReplyAll,
  onForward,
  onArchive,
  onDelete,
  onStar,
}: MailToolbarProps) {
  const buttonClass =
    "flex items-center gap-2 rounded-xl border border-[#4b0008]/15 px-4 py-2 text-sm font-bold transition hover:bg-[#f5eee7]";

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#4b0008]/10 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={onReply} className={buttonClass}>
          <Mail className="h-4 w-4" />
          Reply
        </button>

        <button onClick={onReplyAll} className={buttonClass}>
          <MailPlus className="h-4 w-4" />
          Reply All
        </button>

        <button onClick={onForward} className={buttonClass}>
          <Forward className="h-4 w-4" />
          Forward
        </button>

        <button onClick={onArchive} className={buttonClass}>
          <Archive className="h-4 w-4" />
          Archive
        </button>

        <button onClick={onDelete} className={buttonClass}>
          <Trash2 className="h-4 w-4" />
          Delete
        </button>

        <button onClick={onStar} className={buttonClass}>
          <Star className="h-4 w-4" />
          Star
        </button>
      </div>

      <button onClick={onRefresh} className={buttonClass}>
        <RefreshCcw className="h-4 w-4" />
        Refresh
      </button>
    </div>
  );
}