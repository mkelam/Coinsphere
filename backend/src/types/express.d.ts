// Express type augmentation for custom Request properties
import { Express } from 'express-serve-static-core';

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

export {};
