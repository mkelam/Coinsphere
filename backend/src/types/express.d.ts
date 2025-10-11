// Express type augmentation for custom Request properties
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role?: string;
      };
    }
  }
}

// Export AuthRequest as an alias for Request with user property
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}
