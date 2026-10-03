import { db, initializeDatabase, databaseConfigured } from "../lib/db";
import { demoCatalog } from "../lib/demo";
async function main() {
  const action = process.argv[2];
  if (!["init", "seed"].includes(action)) throw new Error("Use init or seed");
  await initializeDatabase();
  if (action === "seed") {
    await db().batch(
      [
        ...demoCatalog.sections.map((s) => ({
          sql: "INSERT INTO learning_sections (id, data) VALUES (?, ?) ON CONFLICT DO NOTHING",
          args: [s.id, JSON.stringify(s)],
        })),
        ...demoCatalog.lessons.map((l) => ({
          sql: "INSERT INTO learning_lessons (id, section_id, data) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
          args: [l.id, l.sectionId, JSON.stringify(l)],
        })),
      ],
      "write",
    );
  }
  console.log(
    action === "seed"
      ? "Демонстрационные материалы добавлены. Существующие записи сохранены."
      : "Таблицы SQLite готовы.",
  );
}
main()
  .catch(() => {
    console.error(
      "Не удалось подготовить базу. Проверьте DATABASE_URL и права доступа.",
    );
    process.exitCode = 1;
  })
  .finally(() => {
    if (databaseConfigured()) db().close();
  });
