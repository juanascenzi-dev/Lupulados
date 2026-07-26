export interface GuardedActivationState {
  allowed: boolean;
  lastActivatedAt: number;
}

export function getGuardedActivationState(
  lastActivatedAt: number,
  now: number,
  intervalMs: number,
): GuardedActivationState {
  if (!Number.isFinite(now) || !Number.isFinite(lastActivatedAt) || !Number.isFinite(intervalMs)) {
    return { allowed: false, lastActivatedAt };
  }

  if (lastActivatedAt > 0 && intervalMs > 0 && now - lastActivatedAt < intervalMs) {
    return { allowed: false, lastActivatedAt };
  }

  return { allowed: true, lastActivatedAt: now };
}
