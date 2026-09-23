type Tone = "lime" | "amber" | "coral" | "slate" | "foam" | "ember";

const TONES: Record<Tone, string> = {
  lime: "bg-healthy-lime/10 text-healthy-lime border-healthy-lime/20",
  amber: "bg-caution-amber/10 text-caution-amber border-caution-amber/20",
  coral: "bg-coral-alert/10 text-coral-alert border-coral-alert/20",
  slate: "bg-ash-rise text-slate-mute border-hairline",
  foam: "bg-foam-ink/10 text-foam-ink border-foam-ink/20",
  ember: "bg-ember/10 text-ember border-ember/20",
};

export default function Badge({
  children,
  tone = "slate",
  className = "",
  pulse = false,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] border ${TONES[tone]} ${className}`}
    >
      {pulse && <span className={`w-1.5 h-1.5 rounded-full animate-breathing-dot bg-current`} />}
      {children}
    </span>
  );
}

export function postStatusTone(status: string): Tone {
  switch (status) {
    case "PUBLISHED":
      return "lime";
    case "SCHEDULED":
      return "amber";
    case "PROCESSING":
      return "amber";
    case "FAILED":
      return "coral";
    default:
      return "slate";
  }
}

export function replyStatusTone(status: string): Tone {
  switch (status) {
    case "SENT":
      return "lime";
    case "PENDING":
      return "amber";
    case "APPROVED":
      return "foam";
    case "FAILED":
      return "coral";
    default:
      return "slate";
  }
}