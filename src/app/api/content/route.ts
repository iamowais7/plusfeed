import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { FeedQuerySchema, CreateContentSchema } from "@/lib/validations";
import { getFeed, createContent } from "@/services/content";

// GET /api/content — paginated feed
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const parsed = FeedQuerySchema.safeParse({
    cursor: searchParams.get("cursor") ?? undefined,
    type: searchParams.get("type") ?? "ALL",
    sort: searchParams.get("sort") ?? "latest",
    limit: searchParams.get("limit") ?? 20,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const session = await auth();
  const { cursor, type, sort, limit } = parsed.data;

  const result = await getFeed({
    cursor,
    type,
    sort,
    limit,
    userId: session?.user?.id,
  });

  return NextResponse.json(result);
}

// POST /api/content — create content (admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const content = await createContent(parsed.data);
  return NextResponse.json(content, { status: 201 });
}
