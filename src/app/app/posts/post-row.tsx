"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge, { postStatusTone } from "@/components/badge";
import Icon from "@/components/icon";
import { api, toLocalInputValue } from "@/lib/client";
import { clockUtc, timeAgo } from "@/lib/format";

export type PostRowData = {
  id: string;
  text: string;
  imageUrl: string | null;
  scheduledFor: Date | null;
  status: string;
  permalink: string | null;
  error: string | null;
  createdAt: Date;
  publishedAt: Date | null;
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  PROCESSING: "PROCESSING",
  PUBLISHED: "PUBLISHED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
};

export default function PostRow({
  post,
  accountUsername,
}: {
  post: PostRowData;
  accountUsername: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState(post.text);
  const [scheduleAt, setScheduleAt] = useState(toLocalInputValue(post.scheduledFor));
  const [imageUrl, setImageUrl] = useState(post.imageUrl ?? "");

  const editable = ["DRAFT", "SCHEDULED", "FAILED", "CANCELLED"].includes(post.status);

  async function act(action: "publish" | "cancel" | "delete") {
    setBusy(action);
    setError(null);
    try {
      if (action === "publish") await api(`/api/posts/${post.id}/publish`, { method: "POST" });
      if (action === "cancel") await api(`/api/posts/${post.id}`, { method: "PATCH", body: { status: "CANCELLED" } });
      if (action === "delete") await api(`/api/posts/${post.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    setBusy("save");
    setError(null);
    try {
      await api(`/api/posts/${post.id}`, {
        method: "PATCH",
        body: { text, imageUrl: imageUrl.trim() || null, scheduledFor: scheduleAt ? new Date(scheduleAt).toISOString() : null },
      });
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="p-4 hover:bg-ash-rise/40 transition-colors flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-mute whitespace-nowrap overflow-hidden">
          <Badge tone={postStatusTone(post.status)} pulse={post.status === "PROCESSING"}>
            {STATUS_LABEL[post.status] ?? post.status}
          </Badge>
          <span className="text-dim-veil">·</span>
          <span>
            {post.status === "SCHEDULED" && post.scheduledFor
              ? `jadwal ${clockUtc(post.scheduledFor)} UTC`
              : post.status === "PUBLISHED" && post.publishedAt
              ? `terbit ${timeAgo(post.publishedAt)}`
              : `dibuat ${timeAgo(post.createdAt)}`}
          </span>
        </div>
        {post.permalink ? (
          <a
            href={post.permalink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-mute hover:text-foam-ink transition-colors whitespace-nowrap"
          >
            <span>Buka di Threads</span>
            <Icon name="north_east" className="text-[12px]" />
          </a>
        ) : null}
      </div>

      {editing ? (
        <div className="space-y-2 p-3 rounded bg-ash-rise border border-hairline">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            rows={3}
            className="w-full bg-umbra-canvas text-foam-ink text-[12px] rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember p-2.5"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL gambar (opsional)"
              className="flex-1 h-9 px-3 bg-umbra-canvas text-[12px] rounded border border-hairline focus:outline-none focus:border-ember"
            />
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="sm:w-56 h-9 px-3 bg-umbra-canvas font-mono text-[11px] rounded border border-hairline focus:outline-none focus:border-ember"
            />
          </div>
          {error && <p className="font-mono text-[11px] text-coral-alert">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-3 h-8 rounded bg-ash-rise text-slate-mute font-mono text-[11px] border border-hairline"
              type="button"
            >
              Batal
            </button>
            <button
              onClick={save}
              disabled={busy === "save"}
              className="px-3 h-8 rounded bg-ember text-umbra-canvas font-semibold text-[11px] disabled:opacity-50"
              type="button"
            >
              Simpan
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-[13px] text-foam-ink leading-normal whitespace-pre-wrap">{post.text}</p>
          {post.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrl} alt="" className="max-h-40 rounded border border-hairline object-cover" />
          )}
          {post.error && <p className="font-mono text-[11px] text-coral-alert">ERR: {post.error}</p>}
          <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-slate-mute">
            <span className="flex items-center gap-2">
              <span className="text-dim-veil">{accountUsername ? `@${accountUsername}` : "tenun"}</span>
            </span>
            <div className="flex items-center gap-2">
              {editable && (
                <>
                  <button onClick={() => setEditing(true)} className="text-slate-mute hover:text-foam-ink transition-colors" type="button">
                    <Icon name="edit" className="text-[15px]" />
                  </button>
                  {(post.status === "DRAFT" || post.status === "SCHEDULED" || post.status === "FAILED") && (
                    <button
                      onClick={() => act("publish")}
                      disabled={busy !== null}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ember text-umbra-canvas font-semibold text-[11px] hover:opacity-90 disabled:opacity-50"
                      type="button"
                    >
                      <Icon name="play_arrow" className="text-[14px]" />
                      {busy === "publish" ? "…" : "Terbitkan"}
                    </button>
                  )}
                  {post.status === "SCHEDULED" && (
                    <button onClick={() => act("cancel")} disabled={busy !== null} className="text-slate-mute hover:text-caution-amber transition-colors" type="button" title="Batalkan">
                      <Icon name="pause" className="text-[15px]" />
                    </button>
                  )}
                  {(post.status === "DRAFT" || post.status === "SCHEDULED" || post.status === "FAILED" || post.status === "CANCELLED") && (
                    <button onClick={() => act("delete")} disabled={busy !== null} className="text-slate-mute hover:text-coral-alert transition-colors" type="button" title="Hapus">
                      <Icon name="delete" className="text-[15px]" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </article>
  );
}