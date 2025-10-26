import { describe, it, expect, beforeEach } from 'vitest';
import { categoryFromFilename, getMimeTypeFromExtension, validateFile } from '@/lib/uploads/validation';

describe('File Validation', () => {
  beforeEach(() => {
    // Set up environment variables for tests
    process.env.MAX_UPLOAD_MB = '25';
    process.env.ALLOWED_MIME_LIST = 'application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/calendar,text/csv,message/rfc822,application/mbox';
  });

  describe('categoryFromFilename', () => {
    it('should return correct category for zoom notes files', () => {
      expect(categoryFromFilename('meeting.txt')).toBe('zoom_notes');
      expect(categoryFromFilename('notes.md')).toBe('zoom_notes');
      expect(categoryFromFilename('transcript.pdf')).toBe('zoom_notes');
      expect(categoryFromFilename('summary.docx')).toBe('zoom_notes');
    });

    it('should return correct category for calendar files', () => {
      expect(categoryFromFilename('schedule.ics')).toBe('calendar');
      expect(categoryFromFilename('events.csv')).toBe('calendar');
    });

    it('should return correct category for email files', () => {
      expect(categoryFromFilename('inbox.eml')).toBe('email');
      expect(categoryFromFilename('archive.mbox')).toBe('email');
    });

    it('should return null for unsupported extensions', () => {
      expect(categoryFromFilename('document.doc')).toBeNull();
      expect(categoryFromFilename('image.jpg')).toBeNull();
      expect(categoryFromFilename('file')).toBeNull();
    });
  });

  describe('getMimeTypeFromExtension', () => {
    it('should return correct MIME type for supported extensions', () => {
      expect(getMimeTypeFromExtension('file.txt')).toBe('text/plain');
      expect(getMimeTypeFromExtension('file.md')).toBe('text/markdown');
      expect(getMimeTypeFromExtension('file.pdf')).toBe('application/pdf');
      expect(getMimeTypeFromExtension('file.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(getMimeTypeFromExtension('file.ics')).toBe('text/calendar');
      expect(getMimeTypeFromExtension('file.csv')).toBe('text/csv');
      expect(getMimeTypeFromExtension('file.eml')).toBe('message/rfc822');
      expect(getMimeTypeFromExtension('file.mbox')).toBe('application/mbox');
    });

    it('should return null for unsupported extensions', () => {
      expect(getMimeTypeFromExtension('file.doc')).toBeNull();
      expect(getMimeTypeFromExtension('file')).toBeNull();
    });
  });

  describe('validateFile', () => {
    it('should validate correct files', () => {
      const result = validateFile({
        originalName: 'meeting.txt',
        mimeType: 'text/plain',
        byteSize: 1024,
      });

      expect(result.valid).toBe(true);
      expect(result.category).toBe('zoom_notes');
    });

    it('should reject files that are too large', () => {
      const result = validateFile({
        originalName: 'large.txt',
        mimeType: 'text/plain',
        byteSize: 30 * 1024 * 1024, // 30MB
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
    });

    it('should reject files with mismatched MIME type', () => {
      const result = validateFile({
        originalName: 'meeting.txt',
        mimeType: 'application/pdf',
        byteSize: 1024,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('MIME type does not match');
    });

    it('should reject unsupported file types', () => {
      const result = validateFile({
        originalName: 'document.doc',
        mimeType: 'application/msword',
        byteSize: 1024,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });
  });
});
