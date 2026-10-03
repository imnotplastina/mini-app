import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { apiError, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";
function imageType(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return ["jpg", "image/jpeg"];
  if (
    Buffer.from(bytes.subarray(0, 8)).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    )
  )
    return ["png", "image/png"];
  const start = Buffer.from(bytes.subarray(0, 12)).toString("ascii");
  if (start.startsWith("GIF87a") || start.startsWith("GIF89a"))
    return ["gif", "image/gif"];
  if (start.startsWith("RIFF") && start.substring(8, 12) === "WEBP")
    return ["webp", "image/webp"];
  return null;
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requireAdmin();
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      throw new Error("STORAGE_NOT_CONFIGURED");
    const reader = request.body?.getReader();
    if (!reader) throw new Error("INVALID_IMAGE");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4_000_000) {
        await reader.cancel();
        throw new Error("TOO_LARGE");
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    const type = imageType(bytes);
    if (!type) throw new Error("INVALID_IMAGE");
    const blob = await put(
      `learning/${crypto.randomUUID()}.${type[0]}`,
      bytes,
      { access: "public", contentType: type[1], addRandomSuffix: true },
    );
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    return apiError(error);
  }
}
