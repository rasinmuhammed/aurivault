import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { supabaseAdmin } from "~/server/lib/supabase";
import { nanoid } from "nanoid";
import { extractTextFromFile, chunkText } from "~/server/lib/text-extract";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!orgId) {
      return NextResponse.json({ error: "No organization selected" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Max size is 50MB." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "File type not supported" }, { status: 400 });
    }

    // Generate unique file path
    const fileId = nanoid();
    const fileExtension = file.name.split(".").pop();
    const fileName = `${fileId}.${fileExtension}`;
    const filePath = `${orgId}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          userId,
          orgId,
          uploadedAt: new Date().toISOString(),
        },
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Save metadata in DB
    const document = await db.document.create({
      data: {
        organizationId: orgId,
        title: file.name.split(".").slice(0, -1).join("."),
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        userId,
        storageKey: filePath,
        status: "processing",
      },
    });

    // --- NEW: Extract text and chunk it ---
    const text = await extractTextFromFile(buffer, file.type);
    const chunks = chunkText(text);

    // Save chunks
    await db.$transaction(
      chunks.map((chunk, index) =>
        db.chunk.create({
          data: {
            documentId: document.id,
            text: chunk,
            chunkIndex: index,
          },
        })
      )
    );

    // Update status
    await db.document.update({
      where: { id: document.id },
      data: { status: "processed" },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        filename: document.filename,
        chunks: chunks.length,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
