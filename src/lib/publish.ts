import { prisma } from "./db";
import { logActivity } from "./activity";
import { createContainer, getPrimaryAccount, publishContainer, requireAccount, ApiError } from "./threads";

export type ThreadPostLike = {
  id: string;
  accountId: string | null;
  text: string;
  imageUrl: string | null;
  status: string;
  creationId: string | null;
  publishedMediaId: string | null;
  permalink: string | null;
  error: string | null;
};

export async function publishPostRecord(post: ThreadPostLike): Promise<ThreadPostLike> {
  const account = await getPrimaryAccount(prisma);
  requireAccount(account);

  if (post.status === "PUBLISHED") {
    throw new ApiError("Post ini sudah terbit", "ALREADY_PUBLISHED", 409);
  }

  const processing = await prisma.threadPost.update({
    where: { id: post.id },
    data: { status: "PROCESSING", error: null },
  });

  try {
    const container = await createContainer(account.threadsUserId, account.accessToken, {
      text: post.text,
      imageUrl: post.imageUrl,
    });
    const published = await publishContainer(account.threadsUserId, account.accessToken, container.id);

    const updated = await prisma.threadPost.update({
      where: { id: post.id },
      data: {
        status: "PUBLISHED",
        creationId: container.id,
        publishedMediaId: published.id ?? null,
        permalink: published.permalink ?? null,
        scheduledFor: null,
        publishedAt: new Date(),
        error: null,
      },
    });

    await logActivity("DISPATCH", "Thread terbit via alur terjadwal/instan", {
      postId: post.id,
      permalink: published.permalink ?? null,
    });
    return updated;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Publikasi gagal";
    await prisma.threadPost.update({
      where: { id: post.id },
      data: { status: "FAILED", error: message.slice(0, 2000) },
    });
    await logActivity("ERROR", `Publikasi thread gagal: ${message}`, { postId: post.id });
    throw e;
  } finally {
    void processing;
  }
}