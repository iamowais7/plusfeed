import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slugify";
import { ContentType, Prisma } from "@/generated/prisma/client";
import type { z } from "zod";
import type { CreateContentSchema, UpdateContentSchema } from "@/lib/validations";

type CreateInput = z.infer<typeof CreateContentSchema>;
type UpdateInput = z.infer<typeof UpdateContentSchema>;

// ─── Feed (cursor-based, no N+1) ──────────────────────────────────────────────

export async function getFeed({
  cursor,
  type,
  sort,
  limit = 20,
  userId,
}: {
  cursor?: string;
  type: "VIDEO" | "ARTICLE" | "ALL";
  sort: "latest" | "trending";
  limit?: number;
  userId?: string;
}) {
  const where: Prisma.ContentWhereInput = {
    published: true,
    ...(type !== "ALL" && { type: type as ContentType }),
  };

  const orderBy: Prisma.ContentOrderByWithRelationInput =
    sort === "trending"
      ? { likeCount: "desc" }
      : { createdAt: "desc" };

  const items = await prisma.content.findMany({
    where,
    orderBy,
    take: limit + 1, // fetch one extra to determine if there's a next page
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      description: true,
      thumbnail: true,
      viewCount: true,
      likeCount: true,
      bookmarkCount: true,
      tags: true,
      authorName: true,
      createdAt: true,
      // Include engagement status for current user without N+1
      engagements: userId
        ? {
            where: { userId },
            select: { type: true },
          }
        : false,
    },
  });

  const hasNextPage = items.length > limit;
  const feed = hasNextPage ? items.slice(0, -1) : items;
  const nextCursor = hasNextPage ? feed[feed.length - 1].id : null;

  return { feed, nextCursor };
}

// ─── Single Content ────────────────────────────────────────────────────────────

export async function getContentBySlug(slug: string, userId?: string) {
  const content = await prisma.content.findUnique({
    where: { slug },
    include: {
      engagements: userId
        ? { where: { userId }, select: { type: true } }
        : false,
    },
  });
  return content;
}

export async function getContentById(id: string) {
  return prisma.content.findUnique({ where: { id } });
}

// ─── View Count ───────────────────────────────────────────────────────────────

export async function incrementViewCount(id: string) {
  // Atomic increment — prevents race conditions
  return prisma.content.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
    select: { viewCount: true },
  });
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export async function createContent(data: CreateInput) {
  const slug = await generateUniqueSlug(data.title, async (s) => {
    const existing = await prisma.content.findUnique({ where: { slug: s } });
    return !!existing;
  });

  return prisma.content.create({
    data: {
      title: data.title,
      slug,
      type: data.type as ContentType,
      description: data.description,
      thumbnail: data.thumbnail || null,
      url: data.url,
      tags: data.tags,
      published: data.published,
      authorName: data.authorName,
    },
  });
}

export async function updateContent(id: string, data: UpdateInput) {
  const existing = await prisma.content.findUniqueOrThrow({ where: { id } });

  let slug = existing.slug;

  // Only regenerate slug if explicitly requested (Slug Integrity requirement)
  if (data.updateSlug && data.title) {
    slug = await generateUniqueSlug(data.title, async (s) => {
      const conflict = await prisma.content.findUnique({ where: { slug: s } });
      return !!conflict && conflict.id !== id;
    });
  }

  return prisma.content.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      slug,
      ...(data.type && { type: data.type as ContentType }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail || null }),
      ...(data.url && { url: data.url }),
      ...(data.tags && { tags: data.tags }),
      ...(data.published !== undefined && { published: data.published }),
      ...(data.authorName !== undefined && { authorName: data.authorName }),
    },
  });
}

export async function deleteContent(id: string) {
  return prisma.content.delete({ where: { id } });
}

// ─── Admin List ───────────────────────────────────────────────────────────────

export async function getAllContentAdmin(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total] = await prisma.$transaction([
    prisma.content.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        published: true,
        viewCount: true,
        likeCount: true,
        bookmarkCount: true,
        createdAt: true,
      },
    }),
    prisma.content.count(),
  ]);
  return { items, total, pages: Math.ceil(total / limit) };
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchContent({
  query,
  type,
  limit = 20,
}: {
  query: string;
  type: "VIDEO" | "ARTICLE" | "ALL";
  limit?: number;
}) {
  // Uses the pg_trgm GIN index for sub-10ms search
  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      title: string;
      slug: string;
      type: string;
      description: string | null;
      thumbnail: string | null;
      viewCount: number;
      likeCount: number;
      createdAt: Date;
    }>
  >`
    SELECT id, title, slug, type, description, thumbnail, "viewCount", "likeCount", "createdAt"
    FROM "Content"
    WHERE published = true
      AND (title % ${query} OR title ILIKE ${`%${query}%`})
      ${type !== "ALL" ? Prisma.sql`AND type = ${type}::"ContentType"` : Prisma.empty}
    ORDER BY similarity(title, ${query}) DESC
    LIMIT ${limit}
  `;
  return results;
}
