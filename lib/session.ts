import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import {
  isAdmin,
  telegramUserSchema,
  type TelegramUser,
} from "./telegram-auth";

export const SESSION_COOKIE = "learning_session";
const options = { issuer: "mini-app-learning", audience: "mini-app" };
export function authConfigured() {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN &&
      (process.env.SESSION_SECRET?.length || 0) >= 32,
  );
}
function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_NOT_CONFIGURED");
  return new TextEncoder().encode(secret);
}
export async function createSession(user: TelegramUser) {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .setIssuer(options.issuer)
    .setAudience(options.audience)
    .sign(key());
}
export async function currentUser(): Promise<TelegramUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !authConfigured()) return null;
  try {
    const { payload } = await jwtVerify(token, key(), {
      ...options,
      algorithms: ["HS256"],
    });
    return telegramUserSchema.parse(payload.user);
  } catch {
    return null;
  }
}
export async function requireAdmin() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (!isAdmin(user.id)) throw new Error("FORBIDDEN");
  return user;
}
