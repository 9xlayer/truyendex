import { NextRequest, NextResponse } from "next/server";
import { MEOSSS_COOKIE_NAME } from "@/lib/meosss-auth";
import { isSecureRequest } from "@/lib/local-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { log, pwd, remember } = body;

    if (!log || !pwd) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên tài khoản/email và mật khẩu." },
        { status: 400 },
      );
    }

    const params = new URLSearchParams();
    params.append("log", log);
    params.append("pwd", pwd);
    params.append("rememberme", remember ? "forever" : "");
    params.append("wp-submit", "Đăng nhập");
    params.append("redirect_to", "https://meosss.com/");

    // Attempt direct login
    const loginRes = await fetch(
      "https://meosss.com/wp-login.php?itsec-hb-token=ms-login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://meosss.com/",
        },
        body: params.toString(),
        redirect: "manual",
      },
    );

    if (loginRes.status === 403 || loginRes.status === 503) {
      return NextResponse.json(
        {
          requiresCookieSync: true,
          error:
            "Meosss được bảo vệ bởi Cloudflare chống bot, nên không thể gửi mật khẩu trực tiếp qua máy chủ. Vui lòng chuyển sang tab 'Đồng bộ Cookie Meosss' để kết nối tài khoản tức thì!",
        },
        { status: 403 },
      );
    }

    const rawCookies: string[] = loginRes.headers.getSetCookie
      ? loginRes.headers.getSetCookie()
      : [loginRes.headers.get("set-cookie") || ""];

    const loggedInCookie = rawCookies.find((c) =>
      c.includes("wordpress_logged_in_"),
    );
    const secCookie = rawCookies.find((c) => c.includes("wordpress_sec_"));

    if (!loggedInCookie) {
      return NextResponse.json(
        {
          error: "Tên đăng nhập hoặc mật khẩu không chính xác trên Meosss.",
        },
        { status: 400 },
      );
    }

    const combinedCookieParts: string[] = [loggedInCookie.split(";")[0]];
    if (secCookie) combinedCookieParts.push(secCookie.split(";")[0]);
    const sessionCookie = combinedCookieParts.join("; ");

    const response = NextResponse.json({
      success: true,
      message: "Đăng nhập thành công!",
    });

    response.cookies.set({
      name: MEOSSS_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
      secure: isSecureRequest(request),
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: "Lỗi kết nối khi đăng nhập: " + err.message },
      { status: 500 },
    );
  }
}
