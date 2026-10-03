import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { db, initializeDatabase } from "../lib/db";
import {
  getCatalog,
  saveLesson,
  saveSection,
  ConflictError,
} from "../lib/repository";
import { demoCatalog } from "../lib/demo";

test("SQLite persists edits, rejects conflicts and filters unpublished material", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mini-app-db-test-"));
  process.env.DATABASE_URL = `file:${join(directory, "content.db").replaceAll("\\", "/")}`;
  await initializeDatabase();
  await initializeDatabase();
  const section = await saveSection({
    ...demoCatalog.sections[0],
    revision: 0,
  });
  const lesson = await saveLesson({ ...demoCatalog.lessons[0], revision: 0 });
  assert.equal((await getCatalog()).lessons.length, 1);
  const hidden = await saveSection({ ...section, status: "draft" });
  assert.equal((await getCatalog()).lessons.length, 0);
  assert.equal((await getCatalog(true)).lessons.length, 1);
  await assert.rejects(
    saveSection({ ...section, title: "Outdated edit" }),
    ConflictError,
  );
  await saveSection({ ...hidden, status: "published" });
  await saveLesson({ ...lesson, title: "Сохранённое название" });
  await assert.rejects(
    saveLesson({ ...lesson, title: "Old lesson" }),
    ConflictError,
  );
  await assert.rejects(
    saveLesson({ ...lesson, id: "orphan", sectionId: "missing", revision: 0 }),
    /SECTION_NOT_FOUND/,
  );
  const independentClient = createClient({ url: process.env.DATABASE_URL });
  const persisted = await independentClient.execute(
    "SELECT data FROM learning_lessons",
  );
  assert.equal(
    JSON.parse(String(persisted.rows[0].data)).title,
    "Сохранённое название",
  );
  independentClient.close();
  db().close();
});
