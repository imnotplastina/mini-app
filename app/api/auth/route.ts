import { NextResponse } from "next/server";
import { z } from "zod";
import { validateTelegramData, isAdmin } from "@/lib/telegram-auth";
import {
  authConfigured,
  createSession,
  currentUser,
  SESSION_COOKIE,
} from "@/lib/session";
import { apiError, readJson, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    if (!authConfigured()) throw new Error("AUTH_NOT_CONFIGURED");
    const { initData } = z
      .object({ initData: z.string().max(16384) })
      .parse(await readJson(request));
    const user = validateTelegramData(
      initData,
      process.env.TELEGRAM_BOT_TOKEN!,
    );
    const response = NextResponse.json({
      user,
      admin: isAdmin(user.id),
      configured: true,
    });
    response.cookies.set(SESSION_COOKIE, await createSession(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 28800,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return apiError(error);
  }
}
export async function GET() {
  const user = await currentUser();
  return NextResponse.json(
    {
      user,
      admin: Boolean(user && isAdmin(user.id)),
      configured: authConfigured(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
