import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";

function initData(id: number) {
  const params = new URLSearchParams({
    auth_date: String(Math.floor(Date.now() / 1000)),
    user: JSON.stringify({
      id,
      first_name: "Редактор",
      username: "test_editor",
    }),
  });
  const data = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const key = createHmac("sha256", "WebAppData")
    .update("12345:local-e2e-only")
    .digest();
  params.set("hash", createHmac("sha256", key).update(data).digest("hex"));
  return params.toString();
}
test("catalog, filters, article navigation and mobile layout", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Рады вас видеть" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Видео", exact: true }).click();
  await expect(page.locator(".lesson-row")).toHaveCount(1);
  await page.getByLabel("Поиск уроков").fill("несуществующий урок");
  await expect(page.getByText("Пока ничего не нашлось")).toBeVisible();
  await page.getByRole("button", { name: "Сбросить фильтры" }).click();
  await expect(page.locator(".lesson-row")).toHaveCount(6);
  await page
    .locator(".lesson-row")
    .filter({ hasText: "Большие перемены" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Начните с вопроса «зачем?»" }),
  ).toBeVisible();
  await expect(page.locator(".prose img")).toBeVisible();
  await page.getByRole("link", { name: /Следующий урок/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Подготовьте место для обучения",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "Мобильная навигация" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: ".artifacts/mobile.png", fullPage: true });
  await page.setViewportSize({ width: 360, height: 780 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.screenshot({ path: ".artifacts/desktop.png", fullPage: true });
});
test("video renders controls and handles unavailable media", async ({
  page,
}) => {
  await page.route("**/flower.mp4", (route) => route.abort());
  await page.goto("/lessons/video-example");
  await expect(page.getByText("Не удалось загрузить видео")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Повторить", exact: true }),
  ).toBeVisible();
});
test("unauthorized and non-admin writes are denied", async ({ request }) => {
  expect((await request.get("/api/admin/content")).status()).toBe(401);
  expect(
    (
      await request.put("/api/admin/content", {
        headers: { Origin: "http://localhost:3100" },
        data: {},
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/auth", {
        headers: { Origin: "http://localhost:3100" },
        data: { initData: initData(999) },
      })
    ).status(),
  ).toBe(200);
  expect((await request.get("/api/admin/content")).status()).toBe(403);
  expect(
    (
      await request.put("/api/admin/content", {
        headers: { Origin: "http://evil.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/admin/upload", {
        headers: {
          Origin: "http://localhost:3100",
          "Content-Type": "application/octet-stream",
        },
        data: "fake-image",
      })
    ).status(),
  ).toBe(403);
});
test("admin publishes an article and persists a draft without leaking it", async ({
  page,
  context,
}) => {
  const response = await context.request.post("/api/auth", {
    headers: { Origin: "http://localhost:3100" },
    data: { initData: initData(111222333) },
  });
  expect(response.status()).toBe(200);
  await page.route("https://telegram.org/**", (route) => route.abort());
  await page.goto("/admin");
  await page
    .getByRole("button", { name: "Добавить урок", exact: true })
    .click();
  await page
    .getByLabel("Название", { exact: true })
    .fill("Новый учебный материал");
  await page
    .getByLabel(/^Текст урока/)
    .fill(
      "## Проверка редактора\n\nТекст с **выделением**.\n\n<script>window.__unsafeContent = true</script>\n\n[Опасная ссылка](javascript:alert(1))",
    );
  await page
    .getByRole("button", { name: "Предварительный просмотр", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Проверка редактора" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Сохранить черновик" }).click();
  await expect(page.getByText("Материал сохранён.")).toBeVisible();
  const content = await (
    await context.request.get("/api/admin/content")
  ).json();
  const draft = content.lessons.find(
    (l: { title: string }) => l.title === "Новый учебный материал",
  );
  await page.goto(`/lessons/${draft.id}`);
  await expect(
    page.getByRole("heading", { name: "Материал недоступен" }),
  ).toBeVisible();
  await page.goto("/admin");
  await page.getByRole("button", { name: /Новый учебный материал/ }).click();
  await page
    .getByRole("combobox", { name: "Статус", exact: true })
    .selectOption("published");
  await page.getByRole("button", { name: "Сохранить и опубликовать" }).click();
  await expect(page.getByText("Материал сохранён.")).toBeVisible();
  await page.goto(`/lessons/${draft.id}`);
  await expect(
    page.getByRole("heading", { name: "Новый учебный материал" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Проверка редактора" }),
  ).toBeVisible();
  await expect(page.locator(".prose script")).toHaveCount(0);
  await expect(page.locator('.prose a[href^="javascript:"]')).toHaveCount(0);
  expect(
    await page.evaluate(() => Object.hasOwn(window, "__unsafeContent")),
  ).toBe(false);
});
