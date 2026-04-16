import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ProgressSchema } from "@/lib/validations";
import { upsertProgress, getContinueWatching } from "@/services/progress";

// GET /api/progress — get continue watching list
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await getContinueWatching(session.user.id);
  return NextResponse.json(items);
}

// POST /api/progress — upsert progress (debounced from frontend)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { contentId, lastPosition, isCompleted } = parsed.data;

  const progress = await upsertProgress(
    session.user.id,
    contentId,
    lastPosition,
    isCompleted
  );

  return NextResponse.json(progress);
}
