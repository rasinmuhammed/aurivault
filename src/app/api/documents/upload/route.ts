import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { extractTextFromFile, chunkText } from "~/server/lib/text-extract";
import { embedText } from "~/server/ai/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!orgId)
    return NextResponse.json({ error: "No organization selected" }, { status: 400 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const text = await extractTextFromFile(buffer, file.type);
  const chunks = chunkText(text);
  const vectors = await embedText(chunks);

  const document = await db.document.create({
    data: {
      tenantId: orgId,
      title: file.name,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      size: buffer.length,
      uploadedBy: userId,
    },
  });

  for (let i = 0; i < chunks.length; i++) {
    const c = await db.chunk.create({
      data: {
        documentId: document.id,
        text: chunks[i]!,
        chunkIndex: i,
      },
    });
    const vec = vectors[i];
    if (vec) {
      const vecLiteral = `[${vec.join(",")}]`;
      await db.$executeRawUnsafe(
        `UPDATE "Embedding" SET vector_vec = $1 WHERE "chunkId" = $2`,
        vecLiteral,
        c.id,
      );
      // If no embedding row exists, create then update vector
      await db.embedding.upsert({
        where: { chunkId: c.id },
        update: {},
        create: { chunkId: c.id },
      });
      await db.$executeRawUnsafe(
        `UPDATE "Embedding" SET vector_vec = $1 WHERE "chunkId" = $2`,
        vecLiteral,
        c.id,
      );
    }
  }

  return NextResponse.json({ id: document.id });
}


