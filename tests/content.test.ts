import { test } from "node:test";
import assert from "node:assert/strict";
import { demoCatalog } from "../lib/demo";
import {
  publicCatalog,
  lessonSchema,
  sectionSchema,
  assetUrl,
} from "../lib/content";
test("demo content validates", () => {
  demoCatalog.sections.forEach((s) => sectionSchema.parse(s));
  demoCatalog.lessons.forEach((l) => lessonSchema.parse(l));
});
test("hides draft sections and their published lessons, preserves order", () => {
  const catalog = structuredClone(demoCatalog);
  catalog.sections[0].status = "draft";
  catalog.lessons[2].status = "draft";
  catalog.lessons.reverse();
  const visible = publicCatalog(catalog);
  assert.equal(
    visible.sections.some((s) => s.id === "start"),
    false,
  );
  assert.equal(
    visible.lessons.some(
      (l) => l.sectionId === "start" || l.id === "video-example",
    ),
    false,
  );
  assert.equal(visible.lessons[0].id, "small-routine");
});
test("rejects unsafe media and empty published lessons", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,a",
    "//example.com/a",
    "http://example.com/a",
    "https://user:password@example.com/image",
  ])
    assert.equal(assetUrl.safeParse(value).success, false);
  assert.equal(
    lessonSchema.safeParse({ ...demoCatalog.lessons[0], body: "" }).success,
    false,
  );
  assert.equal(
    lessonSchema.safeParse({ ...demoCatalog.lessons[2], videoUrl: "" }).success,
    false,
  );
  assert.equal(
    lessonSchema.safeParse({
      ...demoCatalog.lessons[2],
      videoUrl: "",
      status: "draft",
    }).success,
    true,
  );
});
