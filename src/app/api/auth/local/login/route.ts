import { NextRequest, NextResponse } from "next/server";
import { LocalAuthDb } from "@/lib/db";
import { setSessionCookie, toUserResponse } from "@/lib/local-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = body.username || body.log;
    const password = body.password || body.pwd;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên người dùng và mật khẩu" },
        { status: 400 },
      );
    }

    const user = LocalAuthDb.verifyUser(String(username), String(password));
    if (!user) {
      return NextResponse.json(
        { error: "Tên người dùng hoặc mật khẩu không chính xác" },
        { status: 401 },
      );
    }

    const session = LocalAuthDb.createSession(user.id);
    const userResponse = toUserResponse(user);

    const response = NextResponse.json({
      success: true,
      user: userResponse,
      message: "Đăng nhập thành công!",
    });

    setSessionCookie(response, session.token, session.expiresAt, request);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Đăng nhập thất bại" },
      { status: 500 },
    );
  }
}
