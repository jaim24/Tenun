import {
  Plus,
  ArrowRight,
  ArrowUp,
  Paperclip,
  BarChart3,
  CheckCircle2,
  LayoutDashboard,
  Trash2,
  NotebookPen,
  CircleAlert,
  Heart,
  MessagesSquare,
  Quote,
  Link,
  LogOut,
  SlidersHorizontal,
  Bell,
  Play,
  Clock,
  Search,
  Activity,
  Tag,
  Settings2,
  ShieldCheck,
  LockOpen,
  X,
  Pause,
  Repeat,
  Radio,
  SquarePen,
  ArrowUpRight,
  Copy,
  RefreshCw,
  CloudCheck,
  KeyRound,
  Sparkles,
  WandSparkles,
  Loader2,
  Bot,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  add: Plus,
  arrow_forward: ArrowRight,
  arrow_upward: ArrowUp,
  attachment: Paperclip,
  bar_chart: BarChart3,
  check_circle: CheckCircle2,
  dashboard: LayoutDashboard,
  delete: Trash2,
  edit_note: NotebookPen,
  error: CircleAlert,
  favorite: Heart,
  forum: MessagesSquare,
  format_quote: Quote,
  link: Link,
  logout: LogOut,
  manage_search: SlidersHorizontal,
  notifications: Bell,
  play_arrow: Play,
  schedule: Clock,
  search: Search,
  signal_cellular_alt: Activity,
  tag: Tag,
  tune: Settings2,
  verified_user: ShieldCheck,
  lock_open: LockOpen,
  close: X,
  pause: Pause,
  repeat: Repeat,
  stream: Radio,
  edit: SquarePen,
  north_east: ArrowUpRight,
  content_copy: Copy,
  refresh: RefreshCw,
  cloud_done: CloudCheck,
  token: KeyRound,
  sparkles: Sparkles,
  auto_awesome: WandSparkles,
  loader: Loader2,
  bot: Bot,
};

export type IconName = keyof typeof ICONS;

export default function Icon({
  name,
  className = "",
  filled = false,
}: {
  name: string & IconName;
  className?: string;
  filled?: boolean;
}) {
  const Lucide = ICONS[name] ?? CircleAlert;
  return (
    <Lucide
      aria-hidden
      className={`shrink-0 select-none ${className}`}
      size={16}
      strokeWidth={1.75}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
    />
  );
}