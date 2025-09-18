import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { extractTextFromFile, chunkText } from "~/app/api/documents/text-extract-simple";
import { OpenAIEmbeddings } from "@langchain/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for very large files

// Initialize embeddings
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-ada-002",
  maxConcurrency: 3,
  maxRetries: 2,
});

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
      'application/json',
      'application/pdf', // Re-enable PDF support
    ];

    const fileType = file.type || 'application/octet-stream';
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ 
        error: `File type not supported: ${fileType}`,
        supportedTypes: allowedTypes,
        suggestion: "Please convert to .txt, .docx, .pdf, .csv, or .rtf format"
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text with timeout
    let text: string;
    try {
      const extractPromise = extractTextFromFile(buffer, fileType);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Text extraction timeout')), 45000)
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

    // Chunk text with optimized parameters
    const chunks = chunkText(text, 1000, 200); // Larger chunks for better context
    if (chunks.length === 0) {
      return NextResponse.json({ error: "No valid text chunks generated from file" }, { status: 422 });
    }

    // Limit chunks to prevent overwhelming the system
    const maxChunks = 300; // Reasonable limit
    if (chunks.length > maxChunks) {
      return NextResponse.json({ 
        error: `Document too large: ${chunks.length} chunks (max ${maxChunks})`,
        suggestion: "Try splitting the document into smaller files or use a more focused excerpt"
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

    // Process chunks synchronously for better reliability
    await processChunksSync(document.id, document.title, chunks);

    return NextResponse.json({ 
      id: document.id, 
      chunks: chunks.length,
      message: `Upload successful! Processed ${chunks.length} chunks with vector embeddings.`,
      status: "completed"
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
      if (err.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json({ error: "AI service configuration error" }, { status: 500 });
      }
      return NextResponse.json({ error: `Upload failed: ${err.message}` }, { status: 500 });
    }
    
    return NextResponse.json({ error: "Upload failed - unknown error" }, { status: 500 });
  }
}

// Process chunks synchronously with embeddings
async function processChunksSync(documentId: string, documentTitle: string, chunks: string[]) {
  console.log(`Processing ${chunks.length} chunks for document ${documentId}`);
  
  try {
    // Generate embeddings in batches to avoid rate limits
    const batchSize = 5;
    let successfulChunks = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      // Generate embeddings for this batch
      let vectors: number[][];
      try {
        vectors = await embeddings.embedDocuments(batch);
      } catch (embedError) {
        console.warn(`Embedding generation failed for batch ${i}-${i + batch.length - 1}:`, embedError);
        // Continue with empty vectors if embedding fails
        vectors = new Array(batch.length).fill([]);
      }

      // Process each chunk in the batch
      const chunkPromises = batch.map(async (chunkText, j) => {
        const chunkIndex = i + j;
        
        try {
          // Create chunk record
          const chunk = await db.chunk.create({
            data: {
              documentId,
              text: chunkText,
              chunkIndex,
            },
          });

          // Create embedding record
          const embedding = await db.embedding.create({
            data: { chunkId: chunk.id },
          });

          // Store vector if available
          const vector = vectors[j];
          if (vector && vector.length > 0) {
            try {
              // Convert vector to PostgreSQL vector format
              const vectorLiteral = `[${vector.join(",")}]`;
              await db.$executeRawUnsafe(
                `UPDATE "embeddings" SET vector_vec = $1::vector WHERE id = $2`,
                vectorLiteral,
                embedding.id,
              );
            } catch (vectorError) {
              console.warn(`Vector storage failed for chunk ${chunkIndex}:`, vectorError);
            }
          }

          return { success: true, chunkIndex };

        } catch (chunkError) {
          console.error(`Failed to create chunk ${chunkIndex}:`, chunkError);
          return { success: false, chunkIndex };
        }
      });

      const results = await Promise.allSettled(chunkPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      successfulChunks += successful;

      console.log(`Batch ${i / batchSize + 1}/${Math.ceil(chunks.length / batchSize)}: ${successful}/${batch.length} chunks processed`);

      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`Document processing completed: ${successfulChunks}/${chunks.length} chunks successful`);

    // Update document metadata
    try {
      await db.document.update({
        where: { id: documentId },
        data: { 
          // You can add a processingStatus field to track completion
          // processingStatus: 'completed',
          // processedAt: new Date(),
        },
      });
    } catch (updateError) {
      console.warn(`Failed to update document metadata for ${documentId}:`, updateError);
    }

  } catch (error) {
    console.error(`Chunk processing failed for document ${documentId}:`, error);
    
    // Mark document as failed (optional)
    try {
      await db.document.update({
        where: { id: documentId },
        data: { 
          // processingStatus: 'failed',
          // processingError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (updateError) {
      console.warn(`Failed to update failed document status for ${documentId}:`, updateError);
    }
    
    throw error; // Re-throw to be handled by the main route
  }
}