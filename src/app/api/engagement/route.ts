import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { EngagementSchema } from "@/lib/validations";
import { toggleEngagement } from "@/services/engagement";

// POST /api/engagement — toggle like or bookmark
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

  const parsed = EngagementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { contentId, type } = parsed.data;

  try {
    const result = await toggleEngagement(session.user.id, contentId, type);
    return NextResponse.json(result);
  } catch (err: unknown) {
    // Unique constraint violation — user clicked too rapidly, treat as already engaged
    if (
      err instanceof Error &&
      err.message.includes("Unique constraint failed")
    ) {
      return NextResponse.json({ action: "added" });
    }
    return NextResponse.json({ error: "Failed to toggle engagement" }, { status: 500 });
  }
}
