import { NextRequest, NextResponse } from "next/server";
import { LocalAuthDb } from "@/lib/db";
import {
  clearSessionCookie,
  getSessionTokenFromRequest,
} from "@/lib/local-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = getSessionTokenFromRequest(request);
  if (token) {
    LocalAuthDb.deleteSession(token);
  }

  const response = NextResponse.json({
    success: true,
    message: "Đã đăng xuất",
  });
  clearSessionCookie(response);
  return response;
}
