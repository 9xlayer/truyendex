import { NextResponse } from "next/server";
import { MEOSSS_COOKIE_NAME } from "@/lib/meosss-auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Đăng xuất thành công",
  });
  response.cookies.delete(MEOSSS_COOKIE_NAME);
  return response;
}
