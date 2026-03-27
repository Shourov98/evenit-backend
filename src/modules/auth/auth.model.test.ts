import { createDefaultUserSubscription, hydrateUserSubscription, UserRole } from './auth.model';

describe('user subscription defaults', () => {
  it.each<[UserRole, number, string, string]>([
    ['customer', 500, 'GBP', 'monthly'],
    ['event_planner', 2000, 'GBP', 'monthly'],
    ['service_provider', 500, 'GBP', 'monthly'],
    ['venue_provider', 50000, 'GBP', 'yearly']
  ])(
    'creates the correct default subscription for %s',
    (role, amount, currency, billingCycle) => {
      const subscription = createDefaultUserSubscription(role);

      expect(subscription.plan).toBe(`${role}_plan`);
      expect(subscription.status).toBe('not_subscribed');
      expect(subscription.activatedAt).toBeUndefined();
      expect(subscription.payment).toEqual({
        amount,
        currency,
        billingCycle,
        status: 'unpaid'
      });
    }
  );

  it('hydrates a role with the correct plan and preserves explicit subscription state', () => {
    const subscription = hydrateUserSubscription('event_planner', {
      status: 'subscribed',
      activatedAt: new Date('2026-03-27T00:00:00.000Z'),
      payment: {
        status: 'paid',
        paidAt: new Date('2026-03-27T00:00:00.000Z')
      }
    });

    expect(subscription.plan).toBe('event_planner_plan');
    expect(subscription.status).toBe('subscribed');
    expect(subscription.payment.amount).toBe(2000);
    expect(subscription.payment.currency).toBe('GBP');
    expect(subscription.payment.billingCycle).toBe('monthly');
    expect(subscription.payment.status).toBe('paid');
    expect(subscription.payment.paidAt).toEqual(new Date('2026-03-27T00:00:00.000Z'));
  });
});
