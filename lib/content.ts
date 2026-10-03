import { z } from "zod";

export const assetUrl = z
  .string()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    if (/^\/images\/[a-z0-9/_\-.]+$/i.test(value)) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Используйте HTTPS-ссылку на файл");
const base = {
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{0,79}$/, "ID: латинские буквы, цифры и дефис"),
  title: z.string().trim().min(1, "Укажите название").max(160),
  description: z.string().trim().max(600),
  cover: assetUrl,
  position: z.number().int().min(0).max(10000),
  status: z.enum(["draft", "published"]),
  revision: z.number().int().min(0),
};
export const sectionSchema = z.object({
  ...base,
  color: z.enum(["sage", "peach", "lavender"]),
});
export const lessonSchema = z
  .object({
    ...base,
    sectionId: base.id,
    type: z.enum(["article", "video"]),
    minutes: z.number().int().min(1).max(600),
    body: z.string().max(100000),
    videoUrl: assetUrl,
  })
  .superRefine((value, ctx) => {
    if (
      value.status === "published" &&
      value.type === "video" &&
      !value.videoUrl.startsWith("https://")
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["videoUrl"],
        message: "Для публикации видео нужна HTTPS-ссылка",
      });
    }
    if (
      value.status === "published" &&
      value.type === "article" &&
      !value.body.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: "Добавьте текст статьи",
      });
    }
  });
export type Section = z.infer<typeof sectionSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Catalog = { sections: Section[]; lessons: Lesson[]; demo: boolean };
export function sortContent<T extends { position: number; id: string }>(
  items: T[],
) {
  return [...items].sort(
    (a, b) => a.position - b.position || a.id.localeCompare(b.id),
  );
}
export function publicCatalog(catalog: Catalog): Catalog {
  const sections = sortContent(
    catalog.sections.filter((s) => s.status === "published"),
  );
  const ids = new Set(sections.map((s) => s.id));
  return {
    ...catalog,
    sections,
    lessons: sortContent(
      catalog.lessons.filter(
        (l) => l.status === "published" && ids.has(l.sectionId),
      ),
    ),
  };
}
