import { DocCategory } from '@/lib/db/models/Document';

// Extension to category mapping
const EXTENSION_TO_CATEGORY: Record<string, DocCategory> = {
  // Zoom notes
  'txt': 'zoom_notes',
  'md': 'zoom_notes', 
  'pdf': 'zoom_notes',
  'docx': 'zoom_notes',
  
  // Calendar
  'ics': 'calendar',
  'csv': 'calendar',
  
  // Email
  'eml': 'email',
  'mbox': 'email',
};

// Extension to MIME type mapping
const EXTENSION_TO_MIME: Record<string, string> = {
  'txt': 'text/plain',
  'md': 'text/markdown',
  'pdf': 'application/pdf',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'ics': 'text/calendar',
  'csv': 'text/csv',
  'eml': 'message/rfc822',
  'mbox': 'application/mbox',
};

export const categoryFromFilename = (filename: string): DocCategory | null => {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return null;
  
  return EXTENSION_TO_CATEGORY[extension] || null;
};

export const getMimeTypeFromExtension = (filename: string): string | null => {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return null;
  
  return EXTENSION_TO_MIME[extension] || null;
};

export const validateFile = (file: {
  originalName: string;
  mimeType: string;
  byteSize: number;
}): { valid: boolean; error?: string; category?: DocCategory } => {
  const { originalName, mimeType, byteSize } = file;
  
  // Check file size
  const maxSizeBytes = (parseInt(process.env.MAX_UPLOAD_MB || '25') * 1024 * 1024);
  if (byteSize > maxSizeBytes) {
    return { valid: false, error: `File size exceeds ${process.env.MAX_UPLOAD_MB || '25'}MB limit` };
  }
  
  // Check if file has extension
  const extension = originalName.split('.').pop()?.toLowerCase();
  if (!extension) {
    return { valid: false, error: 'File must have an extension' };
  }
  
  // Get expected category and MIME type
  const category = categoryFromFilename(originalName);
  const expectedMimeType = getMimeTypeFromExtension(originalName);
  
  if (!category || !expectedMimeType) {
    return { valid: false, error: 'Unsupported file type' };
  }
  
  // Validate MIME type matches extension
  if (mimeType !== expectedMimeType) {
    return { valid: false, error: 'MIME type does not match file extension' };
  }
  
  // Check against allowed MIME list
  const allowedMimes = process.env.ALLOWED_MIME_LIST?.split(',') || [];
  if (!allowedMimes.includes(mimeType)) {
    return { valid: false, error: 'MIME type not allowed' };
  }
  
  return { valid: true, category };
};

export const slugifyFilename = (filename: string): string => {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};
