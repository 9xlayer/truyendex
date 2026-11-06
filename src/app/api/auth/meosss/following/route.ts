import { NextRequest, NextResponse } from "next/server";
import { getFreshNonce, getMeosssCookieFromRequest } from "@/lib/meosss-auth";
import { ReadListResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookie = getMeosssCookieFromRequest(request);

  if (!cookie) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để xem danh sách theo dõi." },
      { status: 401 },
    );
  }

  try {
    const nonce = await getFreshNonce(cookie);

    // Call unread-followed-manga to get posts
    const res = await fetch(
      "https://meosss.com/wp-json/initmanga/v1/unread-followed-manga",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Cookie: cookie,
          "X-WP-Nonce": nonce,
          Referer: "https://meosss.com/",
        },
      },
    );

    let followedPosts: any[] = [];
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.posts)) {
        followedPosts = data.posts;
      }
    }

    const formattedData = followedPosts.map((p) => ({
      series_uuid: String(p.id || p.post_id || p.manga_id),
      chapter_updated_at: p.updated_at || p.date || new Date().toISOString(),
      latest_chapter_uuid: String(p.latest_chapter_id || p.chapter_id || ""),
      title: p.title || p.post_title || "Truyện Meosss",
      chapter_title: p.chapter_title || "Chương mới",
    }));

    const responseData: ReadListResponse = {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: Math.max(10, formattedData.length),
      total: formattedData.length,
      to: formattedData.length,
      data: formattedData,
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("Error fetching following manga:", err);
    return NextResponse.json(
      {
        current_page: 1,
        from: 0,
        last_page: 1,
        per_page: 10,
        total: 0,
        to: 0,
        data: [],
      },
      { status: 200 },
    );
  }
}
