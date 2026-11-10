import refereeWhistle from "./Assets/sounds/ui/referee-whistle.wav";
import restEndBell from "./Assets/sounds/rest-complete/timer-end-bell.mp3";

let whistleAudio = null;
let restBellAudio = null;

function ensureAudio(existing, src) {
  if (existing) return existing;
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.load();
  return audio;
}

function playClip(existing, src) {
  try {
    const audio = ensureAudio(existing, src);
    audio.pause();
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise?.catch) {
      playPromise.catch((err) => {
        console.warn("Could not play sound", err);
      });
    }
    return audio;
  } catch (err) {
    console.warn("Could not play sound", err);
    return existing;
  }
}

/** Call on Start/Resume so rest bell is ready before timer ends. */
export function preloadWorkoutSounds() {
  whistleAudio = ensureAudio(whistleAudio, refereeWhistle);
  restBellAudio = ensureAudio(restBellAudio, restEndBell);
}

/** Referee whistle for start, resume, and finish. */
export function playFootballWhistle() {
  preloadWorkoutSounds();
  whistleAudio = playClip(whistleAudio, refereeWhistle);
}

/** Rest-complete bell (original timer-end clip). */
export function playRestBeep() {
  restBellAudio = playClip(
    ensureAudio(restBellAudio, restEndBell),
    restEndBell
  );
}
