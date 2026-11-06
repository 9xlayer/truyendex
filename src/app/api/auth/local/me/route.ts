import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, toUserResponse } from "@/lib/local-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: toUserResponse(user) });
}

