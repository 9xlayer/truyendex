import { NextRequest, NextResponse } from "next/server";
import { getFreshNonce, getMeosssCookieFromRequest } from "@/lib/meosss-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const subPath = params.path.join("/");
  const searchParams = new URLSearchParams(request.nextUrl.search);
  const rawSearch = searchParams.get("search");
  let potentialSlug = "";

  if (rawSearch) {
    let clean = rawSearch.trim();
    try {
      while (clean.includes("%")) {
        const decoded = decodeURIComponent(clean);
        if (decoded === clean) break;
        clean = decoded;
      }
    } catch {}

    const urlMatch = clean.match(/(?:meosss\.com)?\/truyen\/([^/?#\s]+)/i);
    if (urlMatch) {
      clean = urlMatch[1];
    }
    clean = clean
      .replace(/[/_]?(?:chap(?:ter)?|chuong)[-_ ]*\d+.*$/i, "")
      .trim();

    if (/^[a-z0-9-]+$/i.test(clean) && clean.includes("-")) {
      potentialSlug = clean.toLowerCase();
    }

    const normalized = clean.replace(/[-_]+/g, " ").trim();
    if (normalized) {
      searchParams.set("search", normalized);
    }
  }

  const searchStr = searchParams.toString()
    ? `?${searchParams.toString()}`
    : "";
  const targetUrl = `https://meosss.com/${subPath}${searchStr}`;

  try {
    const cookie = getMeosssCookieFromRequest(request);
    const forwardHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, text/html, */*",
      Referer: "https://meosss.com/",
    };

    if (cookie) {
      forwardHeaders["Cookie"] = cookie;
      const nonce = await getFreshNonce(cookie);
      if (nonce) {
        forwardHeaders["X-WP-Nonce"] = nonce;
      }
    }

    let upstreamRes = await fetch(targetUrl, {
      headers: forwardHeaders,
      next: { revalidate: cookie ? 0 : 120 },
    });

    const contentType =
      upstreamRes.headers.get("content-type") || "application/json";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Expose-Headers", "x-wp-total, x-wp-totalpages");

    if (upstreamRes.headers.has("x-wp-total")) {
      headers.set("x-wp-total", upstreamRes.headers.get("x-wp-total")!);
    }
    if (upstreamRes.headers.has("x-wp-totalpages")) {
      headers.set(
        "x-wp-totalpages",
        upstreamRes.headers.get("x-wp-totalpages")!,
      );
    }

    if (contentType.includes("application/json")) {
      let data = await upstreamRes.json();

      // Fallback: If 0 search results and we had a slug, query by slug directly
      if (
        Array.isArray(data) &&
        data.length === 0 &&
        potentialSlug &&
        subPath.includes("manga")
      ) {
        try {
          const fallbackRes = await fetch(
            `https://meosss.com/wp-json/wp/v2/manga?_embed&slug=${encodeURIComponent(potentialSlug)}`,
            {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Accept: "application/json",
                Referer: "https://meosss.com/",
              },
            },
          );
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (Array.isArray(fallbackData) && fallbackData.length > 0) {
              data = fallbackData;
              headers.set("x-wp-total", String(fallbackData.length));
              headers.set("x-wp-totalpages", "1");
            }
          }
        } catch {}
      }

      return new NextResponse(JSON.stringify(data), {
        status: upstreamRes.status,
        headers,
      });
    } else {
      const text = await upstreamRes.text();
      return new NextResponse(text, {
        status: upstreamRes.status,
        headers,
      });
    }
  } catch (error) {
    console.error("Meosss API proxy error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch from Meosss" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const subPath = params.path.join("/");
  const targetUrl = `https://meosss.com/${subPath}`;

  try {
    const cookie = getMeosssCookieFromRequest(request);
    const forwardHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, */*",
      Referer: "https://meosss.com/",
    };

    const reqContentType = request.headers.get("content-type");
    if (reqContentType) {
      forwardHeaders["Content-Type"] = reqContentType;
    }

    if (cookie) {
      forwardHeaders["Cookie"] = cookie;
      const nonce = await getFreshNonce(cookie);
      if (nonce) {
        forwardHeaders["X-WP-Nonce"] = nonce;
      }
    }

    const bodyText = await request.text();

    const upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers: forwardHeaders,
      body: bodyText,
    });

    const resContentType =
      upstreamRes.headers.get("content-type") || "application/json";

    const text = await upstreamRes.text();

    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: {
        "Content-Type": resContentType,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Meosss API proxy POST error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to post to Meosss" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}
