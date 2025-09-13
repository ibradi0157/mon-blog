import { Injectable } from '@nestjs/common';

@Injectable()
export class SecurityService {
  
  // XSS Protection - Basic HTML sanitization without external dependencies
  sanitizeHtml(html: string, options?: {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    stripIgnoreTag?: boolean;
  }): string {
    if (!html) return '';
    
    // Basic HTML sanitization - remove dangerous tags and attributes
    let sanitized = html
      // Remove script tags and content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove style tags and content
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove dangerous attributes
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\s*javascript\s*:/gi, '')
      // Remove dangerous tags
      .replace(/<(iframe|object|embed|form|input|meta|link)[^>]*>/gi, '')
      // Clean up extra whitespace
      .trim();

    return sanitized;
  }

  // Input validation helpers
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }
    if (password.length > 128) {
      errors.push('Le mot de passe ne peut pas dépasser 128 caractères');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }
    if (!/\d/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }

    return { valid: errors.length === 0, errors };
  }

  // File upload security
  validateFileType(filename: string, allowedTypes: string[]): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    return ext ? allowedTypes.includes(ext) : false;
  }

  validateFileSize(size: number, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
  }

  // Generate secure filename
  generateSecureFilename(originalName: string): string {
    const ext = originalName.toLowerCase().split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}_${random}.${ext}`;
  }

  // Rate limiting helpers
  generateRateLimitKey(ip: string, endpoint: string, userId?: string): string {
    const base = `rate_limit:${endpoint}:${ip}`;
    return userId ? `${base}:${userId}` : base;
  }

  // SQL injection prevention helpers
  escapeSearchQuery(query: string): string {
    return query
      .replace(/[%_\\]/g, '\\$&') // Escape LIKE wildcards
      .replace(/'/g, "''") // Escape single quotes
      .trim()
      .substring(0, 100); // Limit length
  }

  // Content Security Policy helpers
  generateCSPNonce(): string {
    return Buffer.from(Math.random().toString()).toString('base64');
  }

  // JWT security helpers
  validateJWTClaims(payload: any): boolean {
    const requiredClaims = ['userId', 'email', 'role', 'iat', 'exp'];
    return requiredClaims.every(claim => payload.hasOwnProperty(claim));
  }

  // Check for suspicious patterns
  detectSuspiciousContent(content: string): { suspicious: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
    // Check for script injection attempts
    if (/<script|javascript:|vbscript:|onload=|onerror=/i.test(content)) {
      reasons.push('Script injection attempt detected');
    }
    
    // Check for SQL injection patterns
    if (/(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bDROP\b).*(\bFROM\b|\bINTO\b|\bWHERE\b)/i.test(content)) {
      reasons.push('SQL injection pattern detected');
    }
    
    // Check for excessive length
    if (content.length > 50000) {
      reasons.push('Content exceeds maximum length');
    }
    
    // Check for excessive HTML nesting
    const htmlDepth = (content.match(/<[^>]+>/g) || []).length;
    if (htmlDepth > 1000) {
      reasons.push('Excessive HTML nesting detected');
    }

    return { suspicious: reasons.length > 0, reasons };
  }

  // Password strength scoring
  calculatePasswordStrength(password: string): { score: number; feedback: string[] } {
    let score = 0;
    const feedback: string[] = [];

    // Length scoring
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    // Common patterns (negative scoring)
    if (/123|abc|qwerty|password/i.test(password)) {
      score -= 2;
      feedback.push('Évitez les séquences communes');
    }

    // Repeated characters
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('Évitez les caractères répétés');
    }

    // Normalize score to 0-100
    const normalizedScore = Math.max(0, Math.min(100, (score / 7) * 100));

    if (normalizedScore < 30) feedback.push('Mot de passe très faible');
    else if (normalizedScore < 60) feedback.push('Mot de passe faible');
    else if (normalizedScore < 80) feedback.push('Mot de passe moyen');
    else feedback.push('Mot de passe fort');

    return { score: normalizedScore, feedback };
  }
}
