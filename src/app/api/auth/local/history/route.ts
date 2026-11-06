import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { LocalAuthDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ history: {} });
  }

  const history = LocalAuthDb.getHistory(user.id);
  return NextResponse.json({ history });
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    // If not logged in, ignore or return ok so client still saves locally
    return NextResponse.json({ success: true, guest: true });
  }

  try {
    const body = await request.json();

    if (body.action === "delete" && body.manga_id) {
      LocalAuthDb.deleteHistory(user.id, String(body.manga_id));
      return NextResponse.json({ success: true });
    }

    if (body.batch && typeof body.batch === "object") {
      LocalAuthDb.syncBatchHistory(user.id, body.batch);
      return NextResponse.json({ success: true });
    }

    if (body.manga_id && body.chapter_id) {
      LocalAuthDb.upsertHistory(user.id, {
        manga_id: String(body.manga_id),
        manga_title: body.manga_title || "Truyện",
        cover: body.cover,
        chapter_id: String(body.chapter_id),
        chapter_title: body.chapter_title || "Chương",
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update history" },
      { status: 500 },
    );
  }
}
