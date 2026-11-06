import { NextRequest } from "next/server";
import { UserResponse } from "@/types";

let cachedNonce: { nonce: string; expiresAt: number } | null = null;

export const MEOSSS_COOKIE_NAME = "meosss_session";

export function getMeosssCookieFromRequest(
  request: NextRequest,
): string | null {
  const cookie = request.cookies.get(MEOSSS_COOKIE_NAME);
  return cookie?.value || null;
}

export async function getFreshNonce(cookie?: string): Promise<string> {
  const now = Date.now();
  if (cachedNonce && cachedNonce.expiresAt > now && !cookie) {
    return cachedNonce.nonce;
  }

  try {
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };
    if (cookie) {
      headers["Cookie"] = cookie;
    }
    const res = await fetch("https://meosss.com/", {
      headers,
      next: { revalidate: 3600 },
    });
    const html = await res.text();
    const nonceMatch = html.match(/"nonce":"([a-f0-9]+)"/);
    if (nonceMatch && nonceMatch[1]) {
      const nonce = nonceMatch[1];
      if (!cookie) {
        cachedNonce = { nonce, expiresAt: now + 30 * 60 * 1000 };
      }
      return nonce;
    }
  } catch (err) {
    console.error("Failed to fetch fresh nonce from Meosss:", err);
  }
  return cachedNonce?.nonce || "";
}

export async function fetchMeosssUser(
  cookie: string,
): Promise<UserResponse | null> {
  try {
    const nonce = await getFreshNonce(cookie);

    // Step 1: Fetch HTML to get user id, avatar, and username from InitChatEngineData or InitUserEngineData
    const homeRes = await fetch("https://meosss.com/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Cookie: cookie,
      },
      next: { revalidate: 60 },
    });
    const html = await homeRes.text();

    const chatMatch = html.match(/InitChatEngineData=({[\s\S]*?});/);
    const userMatch = html.match(/InitUserEngineData=({[\s\S]*?});/);

    const chatData = chatMatch ? JSON.parse(chatMatch[1]) : null;
    const userData = userMatch ? JSON.parse(userMatch[1]) : null;

    if (!userData || !userData.current_user || userData.current_user === "0") {
      return null;
    }

    const userId =
      parseInt(userData.current_user, 10) ||
      parseInt(chatData?.current_user_id || "0", 10);
    const userName = chatData?.current_user || "Thành viên";
    const userAvatar = chatData?.user_avatar || null;
    const isVip = !!userData.is_vip;

    // Step 2: Fetch profile/me from REST API
    let profileData: any = null;
    try {
      const profileRes = await fetch(
        "https://meosss.com/wp-json/inituser/v1/profile/me",
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Cookie: cookie,
            "X-WP-Nonce": nonce,
          },
        },
      );
      if (profileRes.ok) {
        profileData = await profileRes.json();
      }
    } catch {}

    const displayName = profileData?.display_name || userName;

    return {
      id: userId,
      name: displayName,
      email: "",
      avatar_path: userAvatar,
      created_at: new Date().toISOString(),
      email_verified_at: new Date().toISOString(),
      comment_count: 0,
      display_roles: isVip ? ["VIP", "Meosss"] : ["Thành viên", "Meosss"],
    };
  } catch (err) {
    console.error("Error fetching Meosss user:", err);
    return null;
  }
}
