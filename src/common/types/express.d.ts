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
          | 'event_planner'
          | 'venue_provider'
          | 'customer';
        serviceCategories: string[];
        subscription: {
          plan:
            | 'customer_plan'
            | 'event_planner_plan'
            | 'service_provider_plan'
            | 'venue_provider_plan'
            | 'admin_plan'
            | 'super_admin_plan';
          status: 'subscribed' | 'not_subscribed';
          activatedAt: Date;
          payment: {
            amount: number;
            currency: string;
            status: 'paid' | 'unpaid';
            paidAt?: Date;
          };
        };
        onboarding?: unknown;
      };
    }
  }
}

export {};
