import { NextRequest, NextResponse } from "next/server";
import { LocalAuthDb } from "@/lib/db";
import { setSessionCookie, toUserResponse } from "@/lib/local-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Vui lòng nhập tên người dùng" },
        { status: 400 },
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Vui lòng nhập mật khẩu" },
        { status: 400 },
      );
    }

    const user = LocalAuthDb.createUser(username, password);
    const session = LocalAuthDb.createSession(user.id);

    const userResponse = toUserResponse(user);
    const response = NextResponse.json({
      success: true,
      user: userResponse,
      message: "Đăng ký tài khoản thành công!",
    });

    setSessionCookie(response, session.token, session.expiresAt);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Đăng ký thất bại" },
      { status: 400 },
    );
  }
}

