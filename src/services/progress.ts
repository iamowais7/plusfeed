import { prisma } from "@/lib/prisma";

/**
 * Upsert progress for a user on a piece of content.
 * Called by debounced frontend tracker (every 5-10s or on unmount).
 */
export async function upsertProgress(
  userId: string,
  contentId: string,
  lastPosition: number,
  isCompleted: boolean
) {
  return prisma.progress.upsert({
    where: { userId_contentId: { userId, contentId } },
    create: { userId, contentId, lastPosition, isCompleted },
    update: { lastPosition, isCompleted },
  });
}

/**
 * Get "Continue Watching/Reading" items for a user.
 * Excludes completed content.
 */
export async function getContinueWatching(userId: string, limit = 10) {
  return prisma.progress.findMany({
    where: { userId, isCompleted: false },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      content: {
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          thumbnail: true,
          url: true,
          description: true,
        },
      },
    },
  });
}

/**
 * Get the progress for a single piece of content for a user.
 */
export async function getProgress(userId: string, contentId: string) {
  return prisma.progress.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });
}
