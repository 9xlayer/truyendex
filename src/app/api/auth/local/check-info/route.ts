import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { LocalAuthDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ followed: null, comment_count: 0 });
  }

  try {
    const body = await request.json();
    const mangaId = body.series_uuid || body.manga_id;
    if (!mangaId) {
      return NextResponse.json({ followed: null, comment_count: 0 });
    }

    const followed = LocalAuthDb.isFollowing(user.id, String(mangaId));
    return NextResponse.json({ followed, comment_count: 0 });
  } catch {
    return NextResponse.json({ followed: null, comment_count: 0 });
  }
}
