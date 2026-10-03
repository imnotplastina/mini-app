import { db, databaseConfigured } from "./db";
import { demoCatalog } from "./demo";
import {
  publicCatalog,
  sectionSchema,
  lessonSchema,
  type Catalog,
  type Section,
  type Lesson,
} from "./content";

export class ConflictError extends Error {}
export async function getCatalog(admin = false): Promise<Catalog> {
  let catalog: Catalog;
  if (!databaseConfigured()) catalog = structuredClone(demoCatalog);
  else {
    const [sections, lessons] = await db().batch(
      [
        "SELECT data, revision FROM learning_sections",
        "SELECT data, revision FROM learning_lessons",
      ],
      "read",
    );
    catalog = {
      demo: false,
      sections: sections.rows.map((row) =>
        sectionSchema.parse({
          ...JSON.parse(String(row.data)),
          revision: Number(row.revision),
        }),
      ),
      lessons: lessons.rows.map((row) =>
        lessonSchema.parse({
          ...JSON.parse(String(row.data)),
          revision: Number(row.revision),
        }),
      ),
    };
  }
  return admin ? catalog : publicCatalog(catalog);
}
export async function saveSection(section: Section) {
  const result = await db().execute(
    section.revision === 0
      ? {
          sql: "INSERT INTO learning_sections (id, data) VALUES (?, ?) ON CONFLICT DO NOTHING RETURNING revision",
          args: [section.id, JSON.stringify(section)],
        }
      : {
          sql: "UPDATE learning_sections SET data = ?, revision = revision + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND revision = ? RETURNING revision",
          args: [JSON.stringify(section), section.id, section.revision],
        },
  );
  if (!result.rows.length)
    throw new ConflictError(
      "Материал уже изменён. Обновите список перед редактированием.",
    );
  return { ...section, revision: Number(result.rows[0].revision) };
}
export async function saveLesson(lesson: Lesson) {
  const parent = await db().execute({
    sql: "SELECT id FROM learning_sections WHERE id = ?",
    args: [lesson.sectionId],
  });
  if (!parent.rows.length) throw new Error("SECTION_NOT_FOUND");
  const result = await db().execute(
    lesson.revision === 0
      ? {
          sql: "INSERT INTO learning_lessons (id, section_id, data) VALUES (?, ?, ?) ON CONFLICT DO NOTHING RETURNING revision",
          args: [lesson.id, lesson.sectionId, JSON.stringify(lesson)],
        }
      : {
          sql: "UPDATE learning_lessons SET section_id = ?, data = ?, revision = revision + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND revision = ? RETURNING revision",
          args: [
            lesson.sectionId,
            JSON.stringify(lesson),
            lesson.id,
            lesson.revision,
          ],
        },
  );
  if (!result.rows.length)
    throw new ConflictError(
      "Материал уже изменён. Обновите список перед редактированием.",
    );
  return { ...lesson, revision: Number(result.rows[0].revision) };
}
