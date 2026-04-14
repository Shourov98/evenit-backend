import { buildReservedSlots, isPastBookingDate } from './booking.service';

describe('Booking service helpers', () => {
  it('builds one unique reservation key per selected slot', () => {
    expect(buildReservedSlots('venue', '65f1a9d0f1b2c3d4e5f60718', '2026-03-20', [14, 15])).toEqual([
      'venue:65f1a9d0f1b2c3d4e5f60718:2026-03-20:14',
      'venue:65f1a9d0f1b2c3d4e5f60718:2026-03-20:15'
    ]);
  });

  it('rejects dates earlier than today', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    expect(isPastBookingDate(yesterday)).toBe(true);
  });

  it('accepts today and future dates', () => {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    expect(isPastBookingDate(today)).toBe(false);
    expect(isPastBookingDate(tomorrow)).toBe(false);
  });
});
