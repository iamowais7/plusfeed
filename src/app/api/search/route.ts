import { NextRequest, NextResponse } from "next/server";
import { SearchQuerySchema } from "@/lib/validations";
import { searchContent } from "@/services/content";

// GET /api/search?q=...&type=...
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const parsed = SearchQuerySchema.safeParse({
    q: searchParams.get("q") ?? "",
    type: searchParams.get("type") ?? "ALL",
    limit: searchParams.get("limit") ?? 20,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { q, type, limit } = parsed.data;
  const results = await searchContent({ query: q, type, limit });

  return NextResponse.json({ results });
}
