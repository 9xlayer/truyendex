import { NextRequest, NextResponse } from "next/server";
import { fetchMeosssUser, MEOSSS_COOKIE_NAME } from "@/lib/meosss-auth";
import { isSecureRequest } from "@/lib/local-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let rawCookie = body?.cookie?.trim() || "";

    if (!rawCookie) {
      return NextResponse.json(
        { error: "Vui lòng nhập cookie Meosss." },
        { status: 400 },
      );
    }

    // Extract wordpress_logged_in and wordpress_sec if full string given
    let cookieToUse = rawCookie;
    if (!rawCookie.includes("=")) {
      // If user pasted just the token value
      return NextResponse.json(
        {
          error:
            "Định dạng cookie không hợp lệ. Vui lòng copy chuỗi cookie có chứa wordpress_logged_in_...",
        },
        { status: 400 },
      );
    }

    const user = await fetchMeosssUser(cookieToUse);
    if (!user) {
      return NextResponse.json(
        {
          error:
            "Không thể xác thực với Meosss. Cookie có thể đã hết hạn hoặc không chính xác.",
        },
        { status: 400 },
      );
    }

    const response = NextResponse.json({
      success: true,
      message: `Đồng bộ thành công tài khoản ${user.name}!`,
      user,
    });

    // Save cookie for 30 days
    response.cookies.set({
      name: MEOSSS_COOKIE_NAME,
      value: cookieToUse,
      httpOnly: true,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
      secure: isSecureRequest(request),
    });

    return response;
  } catch (error: any) {
    console.error("Sync cookie error:", error);
    return NextResponse.json(
      { error: "Lỗi xử lý đồng bộ cookie: " + (error.message || "Unknown") },
      { status: 500 },
    );
  }
}
