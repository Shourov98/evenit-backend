type PresenceSnapshot = {
  isOnline: boolean;
  lastSeenAt: string | null;
};

const activeSocketCounts = new Map<string, number>();
const lastSeenAt = new Map<string, string>();

export const markUserOnline = (userId: string): PresenceSnapshot => {
  const current = activeSocketCounts.get(userId) ?? 0;
  activeSocketCounts.set(userId, current + 1);

  return {
    isOnline: true,
    lastSeenAt: lastSeenAt.get(userId) ?? null
  };
};

export const markUserOffline = (userId: string): PresenceSnapshot => {
  const current = activeSocketCounts.get(userId) ?? 0;
  const next = Math.max(0, current - 1);

  if (next === 0) {
    activeSocketCounts.delete(userId);
    const timestamp = new Date().toISOString();
    lastSeenAt.set(userId, timestamp);

    return {
      isOnline: false,
      lastSeenAt: timestamp
    };
  }

  activeSocketCounts.set(userId, next);
  return {
    isOnline: true,
    lastSeenAt: lastSeenAt.get(userId) ?? null
  };
};

export const getUserPresence = (userId: string): PresenceSnapshot => ({
  isOnline: (activeSocketCounts.get(userId) ?? 0) > 0,
  lastSeenAt: lastSeenAt.get(userId) ?? null
});
