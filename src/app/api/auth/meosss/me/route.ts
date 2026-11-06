import { NextRequest, NextResponse } from "next/server";
import { fetchMeosssUser, getMeosssCookieFromRequest } from "@/lib/meosss-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookie = getMeosssCookieFromRequest(request);

  if (!cookie) {
    return NextResponse.json({ user: null });
  }

  const user = await fetchMeosssUser(cookie);
  return NextResponse.json({ user });
}
