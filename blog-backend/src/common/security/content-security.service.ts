import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const createDOMPurify = require('dompurify');
import { JSDOM } from 'jsdom';

@Injectable()
export class ContentSecurityService {
  private readonly purify: any;
  private readonly cspConfig: Record<string, string[]>;

  constructor(private configService: ConfigService) {
    const window = new JSDOM('').window;
    this.purify = createDOMPurify(window);

    this.cspConfig = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'nonce-${this.generateNonce()}'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'https:', 'data:'],
      'connect-src': ["'self'", 'https:'],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    };
  }

  sanitizeHtml(content: string, options = {}): string {
    return this.purify.sanitize(content, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
        'strong', 'em', 'i', 'b', 'u', 'small', 'sub', 'sup',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
        'a', 'img', 'span', 'div', 'table', 'thead', 'tbody',
        'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'id',
        'target', 'rel', 'style', 'data-*'
      ],
      ALLOW_DATA_ATTR: true,
      ...options
    });
  }

  generateCspHeader(): string {
    return Object.entries(this.cspConfig)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');
  }

  private generateNonce(): string {
    return Buffer.from(Math.random().toString()).toString('base64');
  }

  validateFileUpload(file: Express.Multer.File): { isValid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size exceeds 5MB limit' };
    }

    if (!allowedTypes.includes(file.mimetype)) {
      return { isValid: false, error: 'Invalid file type' };
    }

    // Check file content vs extension
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf'
    };
    const expectedMimeType = mimeTypes[ext];

    if (expectedMimeType !== file.mimetype) {
      return { isValid: false, error: 'File extension does not match content type' };
    }

    return { isValid: true };
  }
}