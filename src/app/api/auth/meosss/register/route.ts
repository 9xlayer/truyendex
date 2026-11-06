import { NextRequest, NextResponse } from "next/server";
import { MEOSSS_COOKIE_NAME } from "@/lib/meosss-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, captcha_token, captcha_answer } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ tên người dùng, email và mật khẩu." },
        { status: 400 },
      );
    }

    if (!captcha_token || !captcha_answer) {
      return NextResponse.json(
        { error: "Vui lòng trả lời câu hỏi bảo vệ (captcha)." },
        { status: 400 },
      );
    }

    const regRes = await fetch(
      "https://meosss.com/wp-json/inituser/v1/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://meosss.com/",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          captcha_token,
          captcha_answer,
        }),
      },
    );

    const data = await regRes.json();

    if (!regRes.ok) {
      return NextResponse.json(
        { error: data.message || "Đăng ký thất bại trên Meosss." },
        { status: regRes.status },
      );
    }

    // Capture set-cookie headers
    const rawCookies: string[] = regRes.headers.getSetCookie
      ? regRes.headers.getSetCookie()
      : [regRes.headers.get("set-cookie") || ""];

    // Find the logged in cookie
    const loggedInCookie = rawCookies.find((c) =>
      c.includes("wordpress_logged_in_"),
    );
    const secCookie = rawCookies.find((c) => c.includes("wordpress_sec_"));

    const combinedCookieParts: string[] = [];
    if (loggedInCookie) {
      combinedCookieParts.push(loggedInCookie.split(";")[0]);
    }
    if (secCookie) {
      combinedCookieParts.push(secCookie.split(";")[0]);
    }

    const sessionCookie = combinedCookieParts.join("; ");

    const response = NextResponse.json({
      success: true,
      message: data.message || "Đăng ký thành công!",
      auto_login: !!data.auto_login,
    });

    if (sessionCookie) {
      response.cookies.set({
        name: MEOSSS_COOKIE_NAME,
        value: sessionCookie,
        httpOnly: true,
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Lỗi kết nối khi đăng ký: " + err.message },
      { status: 500 },
    );
  }
}
