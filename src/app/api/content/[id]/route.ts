import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UpdateContentSchema } from "@/lib/validations";
import {
  getContentById,
  updateContent,
  deleteContent,
  incrementViewCount,
} from "@/services/content";

// GET /api/content/[id] — fetch + increment view count
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const content = await getContentById(id);
  if (!content) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Atomic view count increment
  await incrementViewCount(id);

  return NextResponse.json(content);
}

// PATCH /api/content/[id] — update (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const updated = await updateContent(id, parsed.data);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }
}

// DELETE /api/content/[id] — delete (admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await deleteContent(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }
}
