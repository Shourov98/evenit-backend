import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        fullName: string;
        role:
          | 'super_admin'
          | 'admin'
          | 'service_provider'
          | 'event_provider'
          | 'venue_provider'
          | 'customer';
        serviceCategories: string[];
        onboarding?: unknown;
      };
    }
  }
}

export {};
