// Tests unitaires pour les helpers d'upload
import {
  validateImageFile,
  validateFile,
  formatFileSize,
  getFileExtension,
  sanitizeFilename,
  UploadError,
} from '../utils/uploadHelpers';

describe('uploadHelpers', () => {
  describe('validateImageFile', () => {
    it('should accept valid image types', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(() => validateImageFile(file, 5, ['image/jpeg'])).not.toThrow();
    });

    it('should reject invalid image types', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(() => validateImageFile(file, 5, ['image/jpeg'])).toThrow(UploadError);
    });

    it('should reject files that are too large', () => {
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'test.jpg', { type: 'image/jpeg' });
      expect(() => validateImageFile(file, 5, ['image/jpeg'])).toThrow(UploadError);
    });
  });

  describe('validateFile', () => {
    it('should accept valid file types', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(() => validateFile(file, 10, ['application/pdf'])).not.toThrow();
    });

    it('should reject invalid file types', () => {
      const file = new File([''], 'test.exe', { type: 'application/x-msdownload' });
      expect(() => validateFile(file, 10, ['application/pdf'])).toThrow(UploadError);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1536 * 1024)).toBe('1.5 MB');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('test.jpg')).toBe('jpg');
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('should handle files without extension', () => {
      expect(getFileExtension('README')).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize filenames', () => {
      expect(sanitizeFilename('Test File.pdf')).toBe('test-file.pdf');
      expect(sanitizeFilename('Fichier@#$%.docx')).toBe('fichier-.docx');
      expect(sanitizeFilename('Multiple---Dashes.txt')).toBe('multiple-dashes.txt');
    });
  });
});
