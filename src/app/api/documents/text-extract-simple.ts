// Simple text extraction that avoids problematic PDF libraries
let mammothLib: any | null = null;

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  
  // Handle PDF files with a simple, reliable approach
  if (mimeType === "application/pdf") {
    try {
      // Use a simple PDF text extraction that doesn't require external binaries
      const text = extractPdfTextSimple(buffer);
      
      if (text && text.trim().length > 0) {
        return text.trim();
      }
      
      // If no text found, provide helpful guidance
      throw new Error(
        "No text could be extracted from this PDF.\n\n" +
        "This usually happens when:\n" +
        "• The PDF contains scanned images instead of text\n" +
        "• The PDF is password protected\n" +
        "• The PDF uses complex formatting\n\n" +
        "Please try:\n" +
        "• Copy and paste the text into a .txt file\n" +
        "• Save/export as a text document from your PDF viewer\n" +
        "• Convert to Word document first, then upload that"
      );
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error("Failed to process PDF file. Please try converting to a text document.");
    }
  }

  // Handle Word documents
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    try {
      if (!mammothLib) {
        mammothLib = await import("mammoth");
      }
      
      const mammoth = mammothLib.default || mammothLib;
      const result = await mammoth.extractRawText({ buffer });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error(
          "No text found in Word document.\n\n" +
          "Please try:\n" +
          "• Save as .txt or .rtf format\n" +
          "• Copy and paste content into a text file"
        );
      }

      return result.value.trim();
    } catch (err: any) {
      throw new Error(
        `Could not process Word document: ${err.message}\n\n` +
        "Please try:\n" +
        "• Save as plain text (.txt)\n" +
        "• Copy content and paste into a new text file"
      );
    }
  }

  // Handle text files (most reliable)
  if (
    mimeType.startsWith("text/") || 
    mimeType === "text/plain" || 
    mimeType === "text/csv" ||
    mimeType === "application/csv" ||
    mimeType === "text/markdown"
  ) {
    try {
      let text = '';
      
      // Try different text encodings
      try {
        text = buffer.toString("utf8");
      } catch (e) {
        try {
          text = buffer.toString("latin1");
        } catch (e2) {
          text = buffer.toString("ascii");
        }
      }
      
      if (!text.trim()) {
        throw new Error("The text file appears to be empty.");
      }
      
      return text.trim();
    } catch (err: any) {
      throw new Error(`Could not read text file: ${err.message}`);
    }
  }

  // Handle other document types
  if (mimeType === "application/rtf" || mimeType === "text/rtf") {
    // Basic RTF text extraction
    try {
      const rtfContent = buffer.toString('utf8');
      const text = extractRtfText(rtfContent);
      
      if (!text.trim()) {
        throw new Error("No text found in RTF document.");
      }
      
      return text.trim();
    } catch (err: any) {
      throw new Error(`Could not process RTF document: ${err.message}`);
    }
  }

  // Handle images
  if (mimeType.startsWith("image/")) {
    throw new Error(
      "Image files cannot be processed automatically.\n\n" +
      "To extract text from images:\n" +
      "• Use OCR software (like Adobe Acrobat)\n" +
      "• Try online OCR tools\n" +
      "• Manually type the content into a text file"
    );
  }

  // Unknown file types
  throw new Error(
    `File type not supported: ${mimeType}\n\n` +
    `Supported formats:\n` +
    `• Text files (.txt, .csv, .md)\n` +
    `• Word documents (.docx)\n` +
    `• PDF files (with selectable text)\n` +
    `• RTF documents (.rtf)\n\n` +
    `Please convert your file to one of these formats.`
  );
}

// Simple PDF text extraction without external dependencies
function extractPdfTextSimple(buffer: Buffer): string {
  try {
    const pdfData = buffer.toString('latin1');
    let text = '';

    // Method 1: Look for text content streams
    // PDF text is usually stored between 'BT' (Begin Text) and 'ET' (End Text) operators
    const textBlocks = pdfData.match(/BT\s*([\s\S]*?)\s*ET/g) || [];
    
    for (const block of textBlocks) {
      // Extract text commands: (text) Tj or [(text)] TJ
      const textCommands = [
        ...block.matchAll(/\(([^)]*)\)\s*Tj/g),
        ...block.matchAll(/\(([^)]*)\)\s*'/g)
      ];
      
      for (const match of textCommands) {
        let extractedText = match[1];
        if (extractedText) {
          // Decode common PDF text escapes
          extractedText = extractedText
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\');
          
          text += extractedText + ' ';
        }
      }
      
      // Also handle text arrays: [(Hello) -250 (World)] TJ
      const arrayCommands = block.matchAll(/\[([^\]]*)\]\s*TJ/g);
      for (const match of arrayCommands) {
        const arrayContent = match[1];
        const textParts = arrayContent.match(/\(([^)]*)\)/g) || [];
        
        for (const part of textParts) {
          const cleanText = part.slice(1, -1); // Remove parentheses
          if (cleanText) {
            text += cleanText + ' ';
          }
        }
      }
    }

    // Method 2: If no text found with BT/ET, try stream objects
    if (!text.trim()) {
      const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
      let streamMatch;
      
      while ((streamMatch = streamRegex.exec(pdfData)) !== null) {
        const streamContent = streamMatch[1];
        
        // Look for text operations in streams
        const textInStream = streamContent.match(/\(([^)]*)\)\s*Tj/g) || [];
        for (const textMatch of textInStream) {
          const textContent = textMatch.match(/\(([^)]*)\)/);
          if (textContent && textContent[1]) {
            text += textContent[1] + ' ';
          }
        }
      }
    }

    // Clean up the extracted text
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\x00/g, '') // Remove null bytes
      .trim();
      
  } catch (err) {
    console.warn('Simple PDF extraction failed:', err);
    return '';
  }
}

// Simple RTF text extraction
function extractRtfText(rtfContent: string): string {
  try {
    // Remove RTF control words and groups
    let text = rtfContent
      .replace(/\{\\[^}]*\}/g, '') // Remove control groups
      .replace(/\\[a-z]+\d*/g, '') // Remove control words
      .replace(/\\[^a-z]/g, '')    // Remove control symbols
      .replace(/[{}]/g, '')        // Remove braces
      .replace(/\s+/g, ' ')        // Normalize whitespace
      .trim();
    
    return text;
  } catch (err) {
    throw new Error('Failed to extract RTF text');
  }
}

// Robust text chunking
export function chunkText(text: string, chunkSize = 800, overlap = 150): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: string[] = [];
  
  // Clean and normalize the text
  const cleanText = text
    .replace(/\r\n/g, '\n')           // Normalize Windows line endings
    .replace(/\r/g, '\n')             // Normalize old Mac line endings  
    .replace(/\n{3,}/g, '\n\n')       // Limit consecutive newlines
    .replace(/[ \t]+/g, ' ')          // Normalize spaces and tabs
    .replace(/^\s+|\s+$/g, '')        // Trim whitespace
    .replace(/\x00/g, '')             // Remove null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, ''); // Remove other control chars

  // If text is short enough, return as single chunk
  if (cleanText.length <= chunkSize) {
    return cleanText ? [cleanText] : [];
  }

  let start = 0;
  
  while (start < cleanText.length) {
    let end = Math.min(start + chunkSize, cleanText.length);
    
    // If we're not at the end of the text, try to find a good breaking point
    if (end < cleanText.length) {
      const searchText = cleanText.slice(start, end);
      
      // Look for natural break points in order of preference
      const breakPoints = [
        { regex: /\n\n/g, name: 'paragraph' },
        { regex: /\. /g, name: 'sentence' },
        { regex: /\n/g, name: 'line' },
        { regex: /[!?] /g, name: 'exclamation' },
        { regex: /; /g, name: 'semicolon' },
        { regex: /, /g, name: 'comma' },
        { regex: / /g, name: 'space' }
      ];
      
      let bestBreak = -1;
      
      for (const breakPoint of breakPoints) {
        const matches = Array.from(searchText.matchAll(breakPoint.regex));
        if (matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          const breakIndex = lastMatch.index! + lastMatch[0].length;
          
          // Only use this break if it's not too close to the beginning
          if (breakIndex > chunkSize * 0.5) {
            bestBreak = breakIndex;
            break;
          }
        }
      }
      
      if (bestBreak > -1) {
        end = start + bestBreak;
      }
    }
    
    const chunk = cleanText.slice(start, end).trim();
    
    // Only add chunks that have meaningful content
    if (chunk && chunk.length >= 20) {
      chunks.push(chunk);
    }
    
    // Calculate next starting position
    if (end >= cleanText.length) {
      break;
    }
    
    // Move start position, considering overlap
    start = Math.max(end - overlap, start + Math.min(chunkSize * 0.1, 50));
  }

  return chunks;
}