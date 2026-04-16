import { prisma } from "@/lib/prisma";
import { EngagementType } from "@/generated/prisma/client";

/**
 * Toggle a Like or Bookmark.
 * Uses upsert + atomic increment/decrement to ensure idempotency
 * and prevent race conditions on the count columns.
 */
export async function toggleEngagement(
  userId: string,
  contentId: string,
  type: "LIKE" | "BOOKMARK"
) {
  const engType = type as EngagementType;
  const countField = type === "LIKE" ? "likeCount" : "bookmarkCount";

  // Check if engagement already exists
  const existing = await prisma.engagement.findUnique({
    where: { userId_contentId_type: { userId, contentId, type: engType } },
  });

  if (existing) {
    // Remove engagement + atomic decrement
    await prisma.$transaction([
      prisma.engagement.delete({
        where: { userId_contentId_type: { userId, contentId, type: engType } },
      }),
      prisma.content.update({
        where: { id: contentId },
        data: { [countField]: { decrement: 1 } },
      }),
    ]);
    return { action: "removed" as const };
  }

  // Create engagement + atomic increment
  // If user clicks twice in rapid succession, the unique constraint
  // on @@id([userId, contentId, type]) will catch it gracefully.
  await prisma.$transaction([
    prisma.engagement.create({
      data: { userId, contentId, type: engType },
    }),
    prisma.content.update({
      where: { id: contentId },
      data: { [countField]: { increment: 1 } },
    }),
  ]);

  return { action: "added" as const };
}

/**
 * Get all engagements for a user across a list of content IDs.
 * Called once per feed page — no N+1.
 */
export async function getUserEngagementsForContent(
  userId: string,
  contentIds: string[]
) {
  return prisma.engagement.findMany({
    where: { userId, contentId: { in: contentIds } },
    select: { contentId: true, type: true },
  });
}
