import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { extractTextFromFile, chunkText } from "~/server/lib/text-extract";
import { embedText } from "~/server/ai/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!orgId)
      return NextResponse.json({ error: "No organization selected. Use the org switcher in the navbar." }, { status: 400 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract and validate text
    const text = await extractTextFromFile(buffer, file.type || "application/octet-stream");
    if (!text.trim()) return NextResponse.json({ error: "No extractable text found in file" }, { status: 422 });

    // Chunk and embed
    const chunks = chunkText(text);
    if (chunks.length === 0) return NextResponse.json({ error: "No chunks generated from file" }, { status: 422 });
    const vectors = await embedText(chunks);

    // Create document record
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
        await db.embedding.upsert({
          where: { chunkId: c.id },
          update: {},
          create: { chunkId: c.id },
        });
        try {
          await db.$executeRawUnsafe(
            `UPDATE "Embedding" SET vector_vec = $1 WHERE "chunkId" = $2`,
            vecLiteral,
            c.id,
          );
        } catch (e) {
          // Likely pgvector not installed; continue without vector to avoid full failure
          console.error("Failed to write vector, ensure pgvector extension is enabled", e);
        }
      }
    }

    return NextResponse.json({ id: document.id, chunks: chunks.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}


