import { NextRequest, NextResponse } from "next/server";
import { getMeosssCookieFromRequest } from "@/lib/meosss-auth";

// Cache user followed lists in memory: cookieHash -> { ids: Set<number>, timestamp: number }
const userFollowCache = new Map<
  string,
  { ids: Set<number>; timestamp: number }
>();

export async function POST(request: NextRequest) {
  const cookie = getMeosssCookieFromRequest(request);
  const body = await request.json().catch(() => ({}));
  const rawId = body?.series_uuid || body?.seriesId || body?.manga_id;
  const mangaId = parseInt(String(rawId), 10);

  if (!cookie) {
    return NextResponse.json({
      followed: null,
      comment_count: 0,
    });
  }

  try {
    // Check if we have cached followed IDs
    const cookieKey = cookie.slice(0, 50);
    const cached = userFollowCache.get(cookieKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < 5 * 60 * 1000) {
      const isFollowed = cached.ids.has(mangaId);
      return NextResponse.json({
        followed: isFollowed,
        comment_count: 0,
      });
    }

    // Otherwise, probe manga page or follow endpoint
    // We can fetch the manga page with cookie and check for data-followed=1
    const res = await fetch(
      `https://meosss.com/wp-json/wp/v2/manga/${mangaId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://meosss.com/",
        },
      },
    );

    let slug = "";
    if (res.ok) {
      const data = await res.json();
      slug = data?.slug || "";
    }

    let isFollowed = false;
    if (slug) {
      const pageRes = await fetch(`https://meosss.com/truyen/${slug}/`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Cookie: cookie,
        },
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        isFollowed = /data-followed=["']?1["']?/i.test(html);
        if (isFollowed) {
          if (!cached) {
            userFollowCache.set(cookieKey, {
              ids: new Set([mangaId]),
              timestamp: now,
            });
          } else {
            cached.ids.add(mangaId);
          }
        }
      }
    }

    return NextResponse.json({
      followed: isFollowed,
      comment_count: 0,
    });
  } catch {
    return NextResponse.json({
      followed: false,
      comment_count: 0,
    });
  }
}
