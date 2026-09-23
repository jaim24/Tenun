import { prisma } from "./db";
import { logActivity } from "./activity";
import { createContainer, getPrimaryAccount, publishContainer, requireAccount, ApiError } from "./threads";

export type ReplyDraftLike = {
  id: string;
  accountId: string | null;
  targetThreadId: string;
  targetUsername: string | null;
  suggestedText: string;
  status: string;
  creationId: string | null;
  permalink: string | null;
  error: string | null;
};

export async function sendReplyDraft(draft: ReplyDraftLike): Promise<ReplyDraftLike> {
  const account = await getPrimaryAccount(prisma);
  requireAccount(account);

  if (draft.status === "SENT") {
    throw new ApiError("Balasan ini sudah terkirim", "ALREADY_SENT", 409);
  }

  const approving = await prisma.replyDraft.update({
    where: { id: draft.id },
    data: { status: "APPROVED", error: null },
  });

  try {
    const container = await createContainer(account.threadsUserId, account.accessToken, {
      text: draft.suggestedText,
      replyToId: draft.targetThreadId,
    });
    const published = await publishContainer(account.threadsUserId, account.accessToken, container.id);

    const updated = await prisma.replyDraft.update({
      where: { id: draft.id },
      data: {
        status: "SENT",
        creationId: container.id,
        permalink: published.permalink ?? null,
        repliedAt: new Date(),
        error: null,
      },
    });

    await prisma.replyLog.create({
      data: {
        accountId: account.id,
        replyMediaId: published.id ?? container.id,
        targetThreadId: draft.targetThreadId,
        targetUsername: draft.targetUsername,
        text: draft.suggestedText,
        permalink: published.permalink ?? null,
      },
    });

    await logActivity("REPLY", `Balasan terkirim ke @${draft.targetUsername ?? "thread"}`, {
      draftId: draft.id,
      permalink: published.permalink ?? null,
    });
    return updated;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Pengiriman balasan gagal";
    await prisma.replyDraft.update({
      where: { id: draft.id },
      data: { status: "FAILED", error: message.slice(0, 2000) },
    });
    await logActivity("ERROR", `Balasan gagal terkirim: ${message}`, { draftId: draft.id });
    throw e;
  } finally {
    void approving;
  }
}