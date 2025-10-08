import { Request, Response, NextFunction } from 'express';
import xss from 'xss';
import validator from 'validator';
import { logger } from '../utils/logger.js';

/**
 * Sanitize input middleware to prevent XSS and injection attacks
 * Recursively sanitizes all string values in request body, query, and params
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    logger.error('Error sanitizing input:', error);
    // If sanitization fails, reject the request
    return res.status(400).json({ error: 'Invalid input detected' });
  }
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Sanitize key to prevent prototype pollution
        const sanitizedKey = sanitizeString(key);

        // Skip dangerous keys
        if (isDangerousKey(sanitizedKey)) {
          logger.warn(`Blocked dangerous key: ${key}`);
          continue;
        }

        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  // Return other types as-is (numbers, booleans, etc.)
  return obj;
}

/**
 * Sanitize a string value
 */
function sanitizeString(str: string): string {
  if (!str || typeof str !== 'string') {
    return str;
  }

  // Remove null bytes
  str = str.replace(/\0/g, '');

  // Trim whitespace
  str = str.trim();

  // Use XSS library to sanitize HTML/script tags
  str = xss(str, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  });

  // Escape SQL-like patterns (additional layer)
  str = str.replace(/['";\\]/g, (match) => '\\' + match);

  return str;
}

/**
 * Check if a key is dangerous (prototype pollution attack)
 */
function isDangerousKey(key: string): boolean {
  const dangerous = [
    '__proto__',
    'constructor',
    'prototype',
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__',
  ];
  return dangerous.includes(key);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return validator.isEmail(email);
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  return validator.isUUID(uuid);
}

/**
 * Validate numeric ID
 */
export function validateNumericId(id: string): boolean {
  return validator.isNumeric(id) && parseInt(id, 10) > 0;
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
  });
}

/**
 * Sanitize for safe filename usage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255); // Limit length
}

/**
 * Validate and sanitize pagination parameters
 */
export function sanitizePagination(query: any): { limit: number; offset: number } {
  const limit = Math.min(
    Math.max(1, parseInt(query.limit, 10) || 50),
    1000 // Max 1000 items per page
  );
  const offset = Math.max(0, parseInt(query.offset, 10) || 0);

  return { limit, offset };
}
