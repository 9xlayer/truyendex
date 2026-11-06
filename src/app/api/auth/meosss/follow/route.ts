import { NextRequest, NextResponse } from "next/server";
import { getFreshNonce, getMeosssCookieFromRequest } from "@/lib/meosss-auth";

export async function POST(request: NextRequest) {
  const cookie = getMeosssCookieFromRequest(request);

  if (!cookie) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để theo dõi truyện." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const rawId = body?.manga_id || body?.series_uuid || body?.seriesId;
    const mangaId = parseInt(String(rawId), 10);

    if (isNaN(mangaId) || mangaId <= 0) {
      return NextResponse.json(
        { error: "ID truyện không hợp lệ." },
        { status: 400 },
      );
    }

    const nonce = await getFreshNonce(cookie);

    const res = await fetch("https://meosss.com/wp-json/initmanga/v1/follow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Cookie: cookie,
        "X-WP-Nonce": nonce,
        Referer: "https://meosss.com/",
      },
      body: JSON.stringify({ manga_id: mangaId }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || "Thao tác theo dõi thất bại." },
        { status: res.status },
      );
    }

    return NextResponse.json({
      success: true,
      followed: data.action === "followed",
      action: data.action,
      follower_count: data.follower_count,
      followed_ids: data.followed || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Lỗi kết nối khi theo dõi: " + err.message },
      { status: 500 },
    );
  }
}
