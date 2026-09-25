export const PARTNER_DRIFT_SPEED = -32; // CSS pixels per second, right to left.
export const MAX_PARTNER_RELEASE_SPEED = 900;
const DECAY_RATE = 2.8;

export function clampPartnerVelocity(velocity: number) {
  return Math.max(-MAX_PARTNER_RELEASE_SPEED, Math.min(MAX_PARTNER_RELEASE_SPEED, velocity));
}

// Both directions land on an identical copy; never expose an empty track edge.
export function wrapPartnerOffset(offset: number, width: number) {
  return width > 0 ? -(((-offset % width) + width) % width) : 0;
}

export function advancePartnerMotion(offset: number, velocity: number, target: number, seconds: number, width: number) {
  const boundedVelocity = clampPartnerVelocity(velocity);
  const decay = Math.exp(-DECAY_RATE * seconds);
  // Integrate the decay, so flick distance is independent of display refresh rate.
  const distance = target * seconds + (boundedVelocity - target) * (1 - decay) / DECAY_RATE;
  return {
    offset: wrapPartnerOffset(offset + distance, width),
    velocity: target + (boundedVelocity - target) * decay,
  };
}
