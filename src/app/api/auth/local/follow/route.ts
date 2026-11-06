import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { LocalAuthDb } from "@/lib/db";
import { ReadListResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({
      current_page: 1,
      from: 0,
      last_page: 1,
      per_page: 20,
      total: 0,
      to: 0,
      data: [],
    } as ReadListResponse);
  }

  const followedItems = LocalAuthDb.getFollowing(user.id);
  const formattedData = followedItems.map((item) => ({
    series_uuid: item.series_uuid,
    title: item.title,
    chapter_title: "Chương mới nhất",
    chapter_updated_at: item.created_at,
    latest_chapter_uuid: "",
    cover: item.cover,
  }));

  return NextResponse.json({
    current_page: 1,
    from: 1,
    last_page: 1,
    per_page: Math.max(20, formattedData.length),
    total: formattedData.length,
    to: formattedData.length,
    data: formattedData,
  } as ReadListResponse);
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để theo dõi truyện" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const mangaId = body.manga_id || body.series_uuid;
    if (!mangaId) {
      return NextResponse.json({ error: "Thiếu ID truyện" }, { status: 400 });
    }

    const followed = LocalAuthDb.toggleFollow(
      user.id,
      String(mangaId),
      body.manga_title || body.title,
      body.cover,
    );

    return NextResponse.json({
      success: true,
      followed,
      manga_id: mangaId,
      message: followed ? "Theo dõi thành công" : "Đã bỏ theo dõi",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Lỗi thao tác theo dõi" },
      { status: 500 },
    );
  }
}
