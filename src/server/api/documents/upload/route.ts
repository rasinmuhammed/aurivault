import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '~/server/db';
import { supabaseAdmin } from '~/lib/supabase';
import { nanoid } from 'nanoid';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/jpg'
];

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No organization selected' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Max size is 50MB.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 });
    }

    // Generate unique filename
    const fileId = nanoid();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${fileId}.${fileExtension}`;
    const filePath = `${orgId}/${fileName}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          userId,
          orgId,
          uploadedAt: new Date().toISOString()
        }
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Save to database
    const document = await db.document.create({
      data: {
        id: fileId,
        title: file.name.split('.').slice(0, -1).join('.'), // filename without extension
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        userId,
        organizationId: orgId,
        storageKey: filePath,
        url: urlData.publicUrl,
        status: 'processing'
      }
    });

    // TODO: Trigger background processing job here
    // This would typically involve:
    // 1. Text extraction (pdf-parse, mammoth, etc.)
    // 2. Chunking the content
    // 3. Generating embeddings
    // 4. Storing in vector database
    // 5. Updating document status to 'processed'

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        filename: document.filename,
        status: document.status
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}