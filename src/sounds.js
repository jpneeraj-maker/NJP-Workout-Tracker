/**
 * Workout alerts are vibration-only so audiobooks / other audio keep playing.
 */

export function vibrateAlert(pattern = [180, 80, 180]) {
  try {
    if (typeof navigator === "undefined" || !navigator.vibrate) return false;
    return Boolean(navigator.vibrate(pattern));
  } catch {
    return false;
  }
}

/** No-op: audio is intentionally disabled. */
export function preloadWorkoutSounds() {}

/** Start / resume / finish cue. */
export function playFootballWhistle() {
  vibrateAlert([120, 60, 120]);
}

/** Rest / timer-complete cue. */
export function playTimerAlert() {
  vibrateAlert([220, 100, 220, 100, 220]);
}

/** @deprecated Prefer playTimerAlert() */
export function playRestBeep() {
  playTimerAlert();
}
