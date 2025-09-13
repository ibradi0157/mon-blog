import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  sessionTimeout: number;
  enableCSRF: boolean;
  enableXSSProtection: boolean;
  enableSQLInjectionProtection: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

@Injectable()
export class AdvancedSecurityService {
  private readonly logger = new Logger(AdvancedSecurityService.name);
  private readonly config: SecurityConfig;
  private rateLimiters: Map<string, any> = new Map();

  constructor(private configService: ConfigService) {
    this.config = {
      maxLoginAttempts: this.configService.get('SECURITY_MAX_LOGIN_ATTEMPTS', 5),
      lockoutDuration: this.configService.get('SECURITY_LOCKOUT_DURATION', 900), // 15 minutes
      passwordMinLength: this.configService.get('SECURITY_PASSWORD_MIN_LENGTH', 8),
      passwordRequireSpecialChars: this.configService.get('SECURITY_PASSWORD_REQUIRE_SPECIAL', true),
      sessionTimeout: this.configService.get('SECURITY_SESSION_TIMEOUT', 3600), // 1 hour
      enableCSRF: this.configService.get('SECURITY_ENABLE_CSRF', true),
      enableXSSProtection: this.configService.get('SECURITY_ENABLE_XSS', true),
      enableSQLInjectionProtection: this.configService.get('SECURITY_ENABLE_SQL_PROTECTION', true),
    };

    this.initializeRateLimiters();
  }

  private initializeRateLimiters(): void {
    // Login rate limiter
    this.rateLimiters.set('login', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: this.config.maxLoginAttempts,
      blockDuration: this.config.lockoutDuration * 1000,
    });

    // API rate limiter
    this.rateLimiters.set('api', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      blockDuration: 60 * 1000,
    });

    // Password reset rate limiter
    this.rateLimiters.set('password-reset', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      blockDuration: 60 * 60 * 1000,
    });

    // File upload rate limiter
    this.rateLimiters.set('upload', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
      blockDuration: 5 * 60 * 1000,
    });
  }

  // Password security
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < this.config.passwordMinLength) {
      errors.push(`Password must be at least ${this.config.passwordMinLength} characters long`);
    } else {
      score += 20;
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 20;
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 20;
    }

    // Number check
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 20;
    }

    // Special character check
    if (this.config.passwordRequireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 20;
    }

    // Common password check
    if (this.isCommonPassword(password)) {
      errors.push('Password is too common, please choose a more unique password');
      score = Math.max(0, score - 30);
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.min(100, score)
    };
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      'dragon', 'master', 'shadow', 'qwertyuiop', 'asdfghjkl'
    ];
    return commonPasswords.includes(password.toLowerCase());
  }

  // Input sanitization
  sanitizeInput(input: string): string {
    if (!input) return '';

    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes to prevent injection
      .replace(/[;&|`$]/g, '') // Remove command injection characters
      .trim();
  }

  sanitizeHtml(html: string): string {
    if (!html) return '';

    // Basic HTML sanitization - in production, use a library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  // SQL injection protection
  detectSQLInjection(input: string): boolean {
    if (!this.config.enableSQLInjectionProtection) return false;

    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(--|\/\*|\*\/)/,
      /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i,
      /(\bUNION\b.*\bSELECT\b)/i,
      /(\b(EXEC|EXECUTE)\b)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // XSS protection
  detectXSS(input: string): boolean {
    if (!this.config.enableXSSProtection) return false;

    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi,
      /<[^>]*\s(onerror|onload|onclick|onmouseover)\s*=/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  // CSRF token generation and validation
  generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  validateCSRFToken(token: string, sessionToken: string): boolean {
    if (!this.config.enableCSRF) return true;
    return token === sessionToken;
  }

  // Session security
  generateSecureSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  isSessionExpired(sessionCreatedAt: Date): boolean {
    const now = new Date();
    const sessionAge = (now.getTime() - sessionCreatedAt.getTime()) / 1000;
    return sessionAge > this.config.sessionTimeout;
  }

  // Rate limiting
  async checkRateLimit(
    identifier: string,
    type: 'login' | 'api' | 'password-reset' | 'upload'
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
  }> {
    const config = this.rateLimiters.get(type);
    if (!config) {
      return { allowed: true, remaining: Infinity, resetTime: new Date() };
    }

    // Mock implementation - in production, use Redis-based rate limiter
    const key = `rate_limit:${type}:${identifier}`;
    
    // This would be implemented with Redis in production
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: new Date(Date.now() + config.windowMs)
    };
  }

  // File upload security
  validateFileUpload(file: {
    originalname: string;
    mimetype: string;
    size: number;
    buffer?: Buffer;
  }): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv'
    ];

    // File size check
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    // MIME type check
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('File type not allowed');
    }

    // File extension check
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'csv'];
    if (!extension || !allowedExtensions.includes(extension)) {
      errors.push('File extension not allowed');
    }

    // Filename security check
    if (this.containsMaliciousFilename(file.originalname)) {
      errors.push('Filename contains potentially malicious characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private containsMaliciousFilename(filename: string): boolean {
    const maliciousPatterns = [
      /\.\./,  // Directory traversal
      /[<>:"|?*]/,  // Invalid filename characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,  // Windows reserved names
      /\.(exe|bat|cmd|scr|pif|com)$/i  // Executable extensions
    ];

    return maliciousPatterns.some(pattern => pattern.test(filename));
  }

  // IP address validation and geolocation
  isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];

    return privateRanges.some(range => range.test(ip));
  }

  // Security headers
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; media-src 'self'; object-src 'none'; frame-src 'none';",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
    };
  }

  // Audit logging
  logSecurityEvent(event: {
    type: 'login_attempt' | 'login_success' | 'login_failure' | 'password_change' | 'suspicious_activity' | 'rate_limit_exceeded';
    userId?: string;
    ip: string;
    userAgent: string;
    details?: any;
  }): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...event
    };

    this.logger.warn(`Security Event: ${JSON.stringify(logEntry)}`);

    // In production, this would be sent to a security monitoring system
    if (event.type === 'suspicious_activity' || event.type === 'rate_limit_exceeded') {
      this.logger.error(`SECURITY ALERT: ${JSON.stringify(logEntry)}`);
    }
  }

  // Encryption utilities
  encrypt(text: string, key?: string): string {
    const secretKey: string = key ?? (this.configService.get<string>('ENCRYPTION_KEY') ?? 'default-secret-key');
    const derivedKey = crypto.createHash('sha256').update(secretKey).digest().subarray(0, 32);
    const iv = Buffer.alloc(16, 0); // NOTE: static IV for compatibility; replace with random IV in production
    const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]).toString('hex');
    return encrypted;
  }

  decrypt(encryptedText: string, key?: string): string {
    try {
      const secretKey: string = key ?? (this.configService.get<string>('ENCRYPTION_KEY') ?? 'default-secret-key');
      const derivedKey = crypto.createHash('sha256').update(secretKey).digest().subarray(0, 32);
      const iv = Buffer.alloc(16, 0);
      const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
      const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedText, 'hex')), decipher.final()]).toString('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed:', error);
      throw new Error('Invalid encrypted data');
    }
  }

  // Generate secure random tokens
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash sensitive data
  hashSensitiveData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Validate JWT token structure (basic validation)
  validateJWTStructure(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }
}
