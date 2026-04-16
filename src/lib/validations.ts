import { z } from "zod";

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

// ─── Content ───────────────────────────────────────────────────────────────────

export const CreateContentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200).trim(),
  type: z.enum(["VIDEO", "ARTICLE"]),
  description: z.string().max(2000).optional(),
  thumbnail: z.string().url("Invalid thumbnail URL").optional().or(z.literal("")),
  url: z.string().min(1, "Content URL or body is required"),
  tags: z.array(z.string().trim()).max(10).default([]),
  published: z.boolean().default(false),
  authorName: z.string().max(100).optional(),
  // updateSlug lets admin explicitly request a slug regeneration
  updateSlug: z.boolean().default(false),
});

export const UpdateContentSchema = CreateContentSchema.partial().extend({
  updateSlug: z.boolean().default(false),
});

// ─── Engagement ────────────────────────────────────────────────────────────────

export const EngagementSchema = z.object({
  contentId: z.string().cuid("Invalid content ID"),
  type: z.enum(["LIKE", "BOOKMARK"]),
});

// ─── Progress ──────────────────────────────────────────────────────────────────

export const ProgressSchema = z.object({
  contentId: z.string().cuid("Invalid content ID"),
  lastPosition: z.number().int().min(0),
  isCompleted: z.boolean().default(false),
});

// ─── Feed / Pagination ─────────────────────────────────────────────────────────

export const FeedQuerySchema = z.object({
  cursor: z.string().optional(),
  type: z.enum(["VIDEO", "ARTICLE", "ALL"]).default("ALL"),
  sort: z.enum(["latest", "trending"]).default("latest"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1, "Query required").max(200),
  type: z.enum(["VIDEO", "ARTICLE", "ALL"]).default("ALL"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
