import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { extractTextFromFile, chunkText } from "src/app/api/documents/text-extract-simple.ts";
import { embedText } from "~/server/ai/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for very large files

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

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/csv',
      'text/markdown',
      'application/rtf',
      'text/rtf',
      'application/json'
    ];

    const fileType = file.type || 'application/octet-stream';
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ 
        error: `File type not supported: ${fileType}`,
        supportedTypes: allowedTypes,
        suggestion: "Please convert to .txt, .docx, .csv, or .rtf format"
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text with timeout
    let text: string;
    try {
      const extractPromise = extractTextFromFile(buffer, fileType);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Text extraction timeout')), 30000)
      );
      
      text = await Promise.race([extractPromise, timeoutPromise]);
    } catch (extractError) {
      console.error("Text extraction failed:", extractError);
      const errorMessage = extractError instanceof Error ? extractError.message : 'Unknown extraction error';
      
      return NextResponse.json({ 
        error: `Text extraction failed`,
        details: errorMessage
      }, { status: 422 });
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "No extractable text found in file" }, { status: 422 });
    }

    // Chunk text
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "No valid text chunks generated from file" }, { status: 422 });
    }

    // Limit chunks to prevent overwhelming the system
    const maxChunks = 500; // Reduced limit for better performance
    if (chunks.length > maxChunks) {
      return NextResponse.json({ 
        error: `Document too large: ${chunks.length} chunks (max ${maxChunks})`,
        suggestion: "Try splitting the document into smaller files"
      }, { status: 413 });
    }

    // Create document record first (quick operation)
    const document = await db.document.create({
      data: {
        organizationId: orgId,
        title: file.name,
        filename: file.name,
        mimeType: fileType,
        size: buffer.length,
        userId,
        storageKey: `${orgId}/${Date.now()}-${file.name}`,
      },
    });

    // Process chunks asynchronously to avoid blocking the response
    processChunksAsync(document.id, chunks).catch((error) => {
      console.error(`Async processing failed for document ${document.id}:`, error);
    });

    return NextResponse.json({ 
      id: document.id, 
      chunks: chunks.length,
      message: `Upload successful! Processing ${chunks.length} chunks in the background.`,
      status: "processing"
    });

  } catch (err) {
    console.error("Upload error:", err);
    
    if (err instanceof Error) {
      if (err.message.includes('timeout')) {
        return NextResponse.json({ error: "Upload timeout - file may be too large or complex" }, { status: 408 });
      }
      if (err.message.includes('database') || err.message.includes('prisma')) {
        return NextResponse.json({ error: "Database error - please try again" }, { status: 500 });
      }
      return NextResponse.json({ error: `Upload failed: ${err.message}` }, { status: 500 });
    }
    
    return NextResponse.json({ error: "Upload failed - unknown error" }, { status: 500 });
  }
}

// Process chunks asynchronously after responding to the user
async function processChunksAsync(documentId: string, chunks: string[]) {
  console.log(`Starting async processing for document ${documentId} with ${chunks.length} chunks`);
  
  try {
    // Generate embeddings (this is the slow part)
    let vectors: number[][];
    try {
      vectors = await embedText(chunks);
    } catch (embedError) {
      console.warn(`Embedding generation failed for document ${documentId}:`, embedError);
      vectors = new Array(chunks.length).fill([]);
    }

    // Process chunks in small batches
    const batchSize = 5;
    let successfulChunks = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const vectorBatch = vectors.slice(i, i + batchSize);

      try {
        // Create chunks in batch
        const chunkPromises = batch.map(async (chunk, j) => {
          const chunkIndex = i + j;
          if (!chunk) return null;

          try {
            const c = await db.chunk.create({
              data: {
                documentId,
                text: chunk,
                chunkIndex,
              },
            });

            // Create embedding
            const embedding = await db.embedding.create({
              data: { chunkId: c.id },
            });

            // Add vector if available
            const vector = vectorBatch[j];
            if (vector && vector.length > 0) {
              try {
                const vectorLiteral = `[${vector.join(",")}]`;
                await db.$executeRawUnsafe(
                  `UPDATE "Embedding" SET vector_vec = $1::vector WHERE id = $2`,
                  vectorLiteral,
                  embedding.id,
                );
              } catch (vectorError) {
                console.warn(`Vector storage failed for chunk ${chunkIndex}:`, vectorError);
              }
            }

            return c;
          } catch (chunkError) {
            console.error(`Failed to create chunk ${chunkIndex}:`, chunkError);
            return null;
          }
        });

        const results = await Promise.all(chunkPromises);
        successfulChunks += results.filter(r => r !== null).length;

        // Small delay between batches to avoid overwhelming the database
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (batchError) {
        console.error(`Batch processing failed for chunks ${i}-${i + batch.length - 1}:`, batchError);
      }
    }

    console.log(`Async processing completed for document ${documentId}: ${successfulChunks}/${chunks.length} chunks successful`);

    // Update document status
    try {
      await db.document.update({
        where: { id: documentId },
        data: { 
          // Add a status field to your schema if you want to track processing state
          // status: 'completed'
        },
      });
    } catch (updateError) {
      console.warn(`Failed to update document status for ${documentId}:`, updateError);
    }

  } catch (error) {
    console.error(`Async processing failed for document ${documentId}:`, error);
    
    // Mark document as failed if needed
    try {
      await db.document.update({
        where: { id: documentId },
        data: { 
          // status: 'failed'
        },
      });
    } catch (updateError) {
      console.warn(`Failed to update failed document status for ${documentId}:`, updateError);
    }
  }
}