import { NextRequest, NextResponse } from "next/server";
import { LocalAuthDb, DbUser } from "./db";
import { UserResponse } from "@/types";

export const SESSION_COOKIE_NAME = "truyendex_token";

export function getSessionTokenFromRequest(
  request: NextRequest,
): string | null {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value || null;
}

export function getCurrentUser(request: NextRequest): DbUser | null {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;
  return LocalAuthDb.getUserBySession(token);
}

export function isSecureRequest(request?: NextRequest): boolean {
  if (request) {
    const proto =
      request.headers.get("x-forwarded-proto") ||
      request.nextUrl?.protocol?.replace(":", "");
    if (proto === "https") return true;
    if (proto === "http") return false;
  }
  if (process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")) {
    return true;
  }
  return false;
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
  expires: Date,
  request?: NextRequest,
): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export function clearSessionCookie(
  response: NextResponse,
  request?: NextRequest,
): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function toUserResponse(user: DbUser): UserResponse {
  return {
    id: user.id,
    name: user.username,
    email: `${user.username}@truyendex.local`,
    avatar_path: null,
    created_at: new Date().toISOString(),
    email_verified_at: new Date().toISOString(),
    comment_count: 0,
    display_roles: ["Thành viên"],
  };
}
