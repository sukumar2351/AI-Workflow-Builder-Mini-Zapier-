import { Request, Response, NextFunction } from 'express';

/**
 * Recursively sanitizes user input to prevent NoSQL operator injection (removing keys starting with $)
 * and basic HTML/Script XSS injections.
 */
function sanitize(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitize(item));
  }

  if (typeof value === 'object') {
    const cleanObj: { [key: string]: any } = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        // Prevent NoSQL operator injection (keys starting with $)
        if (key.startsWith('$')) {
          console.warn(`NoSQL injection attempt blocked: key "${key}" was removed.`);
          continue;
        }
        cleanObj[key] = sanitize(value[key]);
      }
    }
    return cleanObj;
  }

  if (typeof value === 'string') {
    // Prevent basic XSS by stripping scripts, inline event handlers, and javascript: links
    return value
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:[^"']*/gi, '');
  }

  return value;
}

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};
