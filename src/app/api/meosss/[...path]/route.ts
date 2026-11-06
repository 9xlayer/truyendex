import { NextRequest, NextResponse } from "next/server";
import { getFreshNonce, getMeosssCookieFromRequest } from "@/lib/meosss-auth";

interface CacheItem {
  status: number;
  data: any;
  headers: Record<string, string>;
  expiresAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __meosss_api_cache: Map<string, CacheItem> | undefined;
}

const apiCache = global.__meosss_api_cache || new Map<string, CacheItem>();
if (process.env.NODE_ENV !== "production") {
  global.__meosss_api_cache = apiCache;
}

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

  // Check in-memory cache for fast sub-millisecond response
  const now = Date.now();
  const cached = apiCache.get(targetUrl);
  if (cached && cached.expiresAt > now) {
    const cachedHeaders = new Headers();
    for (const [k, v] of Object.entries(cached.headers)) {
      cachedHeaders.set(k, v);
    }
    cachedHeaders.set("X-Cache", "HIT");
    return new NextResponse(
      typeof cached.data === "string"
        ? cached.data
        : JSON.stringify(cached.data),
      {
        status: cached.status,
        headers: cachedHeaders,
      },
    );
  }

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
    }

    let upstreamRes = await fetch(targetUrl, {
      headers: forwardHeaders,
      next: { revalidate: 120 },
    });

    const contentType =
      upstreamRes.headers.get("content-type") || "application/json";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Expose-Headers", "x-wp-total, x-wp-totalpages");
    headers.set("X-Cache", "MISS");

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

      // Store in in-memory cache
      if (upstreamRes.ok) {
        let ttl = 120 * 1000; // 2 minutes default
        if (subPath.includes("chapters")) {
          ttl = 300 * 1000; // 5 minutes for chapter list
        } else if (subPath.includes("genre") || subPath.includes("tag")) {
          ttl = 1800 * 1000; // 30 minutes for taxonomies
        }
        apiCache.set(targetUrl, {
          status: upstreamRes.status,
          data,
          headers: Object.fromEntries(headers.entries()),
          expiresAt: now + ttl,
        });
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

    if (cookie) {
      forwardHeaders["Cookie"] = cookie;
      const nonce = await getFreshNonce(cookie);
      if (nonce) {
        forwardHeaders["X-WP-Nonce"] = nonce;
      }
    }

    const contentType = request.headers.get("content-type") || "";
    let body: any = undefined;

    if (contentType.includes("application/json")) {
      body = await request.text();
      forwardHeaders["Content-Type"] = "application/json";
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      body = await request.text();
      forwardHeaders["Content-Type"] = "application/x-www-form-urlencoded";
    } else {
      body = await request.arrayBuffer();
      if (contentType) forwardHeaders["Content-Type"] = contentType;
    }

    const upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers: forwardHeaders,
      body,
    });

    const resContentType =
      upstreamRes.headers.get("content-type") || "application/json";

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", resContentType);
    responseHeaders.set("Access-Control-Allow-Origin", "*");

    const resBody = await upstreamRes.text();
    return new NextResponse(resBody, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Meosss POST proxy error:", error);
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
