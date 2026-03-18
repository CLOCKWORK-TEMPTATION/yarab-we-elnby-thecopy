/**
 * @interface ProcessedFile
 * @description Represents a file that has been processed and is ready for use with Gemini API
 */
export interface ProcessedFile {
  name: string;
  mimeType: string;
  content: string;
  isBase64: boolean;
  size: number;
}

/**
 * @function readFileAsText
 * @description Reads a file and returns its content as text (Node.js implementation)
 */
const readFileAsText = async (fileBuffer: Buffer, encoding: BufferEncoding = 'utf-8'): Promise<string> => {
  return fileBuffer.toString(encoding);
};

/**
 * @function readFileAsBase64
 * @description Reads a file and returns its content as Base64 (Node.js implementation)
 */
const readFileAsBase64 = async (fileBuffer: Buffer): Promise<string> => {
  return fileBuffer.toString('base64');
};

/**
 * @function processFilesForGemini
 * @description Processes an array of file buffers to prepare them for Gemini API
 * Adapted for Node.js backend environment
 * @param {Array<{name: string, mimeType: string, buffer: Buffer}>} files - Array of file objects
 * @returns {Promise<ProcessedFile[]>} Array of processed files
 */
export const processFilesForGemini = async (
  files: Array<{ name: string; mimeType: string; buffer: Buffer; size: number }>
): Promise<ProcessedFile[]> => {
  return Promise.all(
    files.map(async (file): Promise<ProcessedFile> => {
      const { name, mimeType, buffer, size } = file;
      
      // Handle text files
      if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
        try {
          const content = await readFileAsText(buffer);
          return { name, mimeType, content, isBase64: false, size };
        } catch (e: any) {
          console.error(`Error reading text file ${name} (${mimeType}):`, e);
          return {
            name,
            mimeType,
            content: `[Error: تعذر قراءة الملف النصي '${name}'. السبب: ${e.message || 'فشل غير معروف في قراءة الملف.'}]`,
            isBase64: false,
            size
          };
        }
      }
      
      // Handle DOCX files (would require mammoth in backend)
      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          // In backend, we can use mammoth server-side
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ buffer });
          
          if (!result.value || result.value.trim() === "") {
            console.warn(`Mammoth extracted empty content from DOCX ${name}`);
            return {
              name,
              mimeType,
              content: `[ملاحظة: لم يتم استخراج أي نص من ملف DOCX '${name}'. قد يكون الملف فارغًا أو يحتوي على عناصر غير نصية فقط. رسائل Mammoth: ${JSON.stringify(result.messages)}]`,
              isBase64: false,
              size
            };
          }
          return { name, mimeType, content: result.value, isBase64: false, size };
        } catch (error: any) {
          console.error(`Error processing DOCX file ${name}:`, error);
          return {
            name,
            mimeType,
            content: `[Error: تعذر استخراج النص من ملف DOCX '${name}'. السبب: ${error.message || 'الملف تالف أو غير مدعوم.'}]`,
            isBase64: false,
            size
          };
        }
      }
      
      // Handle old .doc files
      if (mimeType === 'application/msword') {
        return {
          name,
          mimeType,
          content: `[ملاحظة: ملفات .doc القديمة (${name}) لا يمكن تحليلها مباشرة. يرجى تحويل الملف إلى .docx, .txt, أو .pdf لمعالجة المحتوى.]`,
          isBase64: false,
          size
        };
      }
      
      // Handle PDFs and images as base64
      if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
        try {
          const content = await readFileAsBase64(buffer);
          return { name, mimeType, content, isBase64: true, size };
        } catch (e: any) {
          console.error(`Error reading base64 file ${name} (${mimeType}):`, e);
          return {
            name,
            mimeType,
            content: `[Error: تعذر تحويل ملف '${name}' إلى base64. السبب: ${e.message || 'فشل غير معروف.'}]`,
            isBase64: false,
            size
          };
        }
      }
      
      // Fallback for unknown types
      console.warn(`Unsupported file type ${mimeType} for file ${name}. Attempting to read as text.`);
      try {
        const content = await readFileAsText(buffer);
        return {
          name,
          mimeType,
          content: `[ملاحظة: تم التعامل مع الملف ${name} (${mimeType}) كملف نصي. قد لا تكون هذه المعالجة مثالية إذا لم يكن الملف نصيًا بالفعل.]\n${content}`,
          isBase64: false,
          size
        };
      } catch (e: any) {
        console.error(`Could not read file ${name} as text or base64.`, e);
        return {
          name,
          mimeType,
          content: `[Error: تعذر قراءة محتوى الملف ${name} (${mimeType}). الملف قد يكون تالفًا أو من نوع غير مدعوم. السبب: ${e.message || 'فشل غير معروف.'}]`,
          isBase64: false,
          size
        };
      }
    })
  );
};
