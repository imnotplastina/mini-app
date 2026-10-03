import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ConflictError } from "./repository";

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    throw new Error("BAD_ORIGIN");
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new Error("BAD_REQUEST");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("BAD_REQUEST");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 300000) {
      await reader.cancel();
      throw new Error("TOO_LARGE");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("BAD_REQUEST");
  }
}
export function apiError(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message || "Проверьте поля формы" },
      { status: 400 },
    );
  if (error instanceof ConflictError)
    return NextResponse.json({ error: error.message }, { status: 409 });
  const code = error instanceof Error ? error.message : "";
  const errors: Record<string, [number, string]> = {
    UNAUTHORIZED: [401, "Откройте приложение через Telegram и войдите снова."],
    FORBIDDEN: [403, "У вас нет прав редактора."],
    BAD_ORIGIN: [403, "Запрос должен быть отправлен из приложения."],
    BAD_REQUEST: [400, "Неверный формат запроса."],
    TOO_LARGE: [413, "Файл или запрос слишком большой."],
    INVALID_AUTH: [401, "Не удалось подтвердить вход через Telegram."],
    EXPIRED_AUTH: [
      401,
      "Вход устарел. Закройте и заново откройте приложение в Telegram.",
    ],
    AUTH_NOT_CONFIGURED: [
      503,
      "Вход через Telegram ещё не настроен владельцем приложения.",
    ],
    DATABASE_NOT_CONFIGURED: [
      503,
      "Для сохранения материалов подключите SQLite.",
    ],
    LOCAL_DATABASE_ON_VERCEL: [
      503,
      "На Vercel подключите удалённую SQLite через libSQL.",
    ],
    SECTION_NOT_FOUND: [400, "Сначала сохраните раздел для этого урока."],
    STORAGE_NOT_CONFIGURED: [
      503,
      "Хранилище изображений ещё не подключено. Можно указать HTTPS-ссылку.",
    ],
    INVALID_IMAGE: [400, "Выберите JPEG, PNG, WebP или GIF до 4 МБ."],
  };
  const [status, message] = errors[code] || [
    500,
    "Не удалось выполнить запрос. Попробуйте ещё раз.",
  ];
  if (status === 500)
    console.error(
      "Application request failed",
      error instanceof Error ? error.name : "UnknownError",
    );
  return NextResponse.json({ error: message }, { status });
}
