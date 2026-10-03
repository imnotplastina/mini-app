import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { apiError, sameOrigin, readJson } from "@/lib/http";
import { getCatalog, saveLesson, saveSection } from "@/lib/repository";
import { sectionSchema, lessonSchema } from "@/lib/content";
import { databaseConfigured } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(
      {
        ...(await getCatalog(true)),
        database: databaseConfigured(),
        storage: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    await requireAdmin();
    const { kind, data } = z
      .object({ kind: z.enum(["section", "lesson"]), data: z.unknown() })
      .parse(await readJson(request));
    const result =
      kind === "section"
        ? await saveSection(sectionSchema.parse(data))
        : await saveLesson(lessonSchema.parse(data));
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
