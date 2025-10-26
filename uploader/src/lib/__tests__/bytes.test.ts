import { describe, it, expect } from 'vitest';
import { formatBytes, formatDate } from '@/lib/utils/bytes';

describe('Byte Formatting', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle decimal values', () => {
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1536 * 1024)).toBe('1.5 MB');
    });

    it('should handle large values', () => {
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const formatted = formatDate(date);
      
      expect(formatted).toContain('Dec');
      expect(formatted).toContain('25');
      expect(formatted).toContain('2023');
    });

    it('should handle string dates', () => {
      const formatted = formatDate('2023-12-25T10:30:00Z');
      
      expect(formatted).toContain('Dec');
      expect(formatted).toContain('25');
      expect(formatted).toContain('2023');
    });
  });
});
