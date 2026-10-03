import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const telegramUserSchema = z.object({
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  first_name: z.string().max(256),
  last_name: z.string().max(256).optional(),
  username: z.string().max(256).optional(),
});
export type TelegramUser = z.infer<typeof telegramUserSchema>;
export function validateTelegramData(
  initData: string,
  token: string,
  now = Math.floor(Date.now() / 1000),
): TelegramUser {
  if (!token || !initData || initData.length > 16384)
    throw new Error("INVALID_AUTH");
  const params = new URLSearchParams(initData);
  const keys = [...params.keys()];
  if (new Set(keys).size !== keys.length) throw new Error("INVALID_AUTH");
  const hash = params.get("hash");
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) throw new Error("INVALID_AUTH");
  params.delete("hash");
  const check = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const expected = createHmac("sha256", secret).update(check).digest();
  if (!timingSafeEqual(expected, Buffer.from(hash, "hex")))
    throw new Error("INVALID_AUTH");
  const authDate = Number(params.get("auth_date"));
  if (
    !Number.isSafeInteger(authDate) ||
    authDate <= 0 ||
    now - authDate > 3600 ||
    authDate - now > 30
  )
    throw new Error("EXPIRED_AUTH");
  return telegramUserSchema.parse(JSON.parse(params.get("user") || "{}"));
}
export function isAdmin(id: number) {
  return (process.env.ADMIN_TELEGRAM_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(String(id));
}
