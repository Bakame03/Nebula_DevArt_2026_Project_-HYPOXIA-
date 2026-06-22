// ─── Heartbeat model ──────────────────────────────────────────────────────────
// Single source of truth for HYPOXIA's heartbeat. The BPM readout (PromptInput),
// the EKG line (HeartbeatMonitor), the vignette pulse (ImmersionEffects) and the
// audio playback rate (SoundManager) ALL derive from this — so what the player
// sees always matches what they hear, at every stress level.

/** Calm resting rate and maximum panic rate, in beats per minute. */
export const BPM_REST = 55;
export const BPM_MAX = 130;

/**
 * Resting tempo of /sounds/heartbeat_heavy.mp3 at playbackRate 1.0.
 * This is the knob to tune by ear: set it to the file's true resting BPM so the
 * audio keeps a natural pitch while still beating at bpmFromStress(). Leaving it
 * equal to BPM_REST means playbackRate is 1.0 when calm.
 */
export const HEARTBEAT_FILE_BPM = BPM_REST;

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

/** Beats per minute for a stress level in [0, 1]. */
export function bpmFromStress(stress: number): number {
  return BPM_REST + clamp01(stress) * (BPM_MAX - BPM_REST);
}

/** Audio playback rate so the heartbeat file beats at bpmFromStress(stress). */
export function playbackRateFromStress(stress: number): number {
  return bpmFromStress(stress) / HEARTBEAT_FILE_BPM;
}

/**
 * Lub-dub amplitude envelope (0..1) for a beat phase (0..1): a sharp "lub" peak
 * followed by a softer "dub". Drives the vignette pulse.
 */
export function beatEnvelope(phase: number): number {
  const lub = Math.exp(-(((phase - 0.08) / 0.030) ** 2));
  const dub = Math.exp(-(((phase - 0.22) / 0.025) ** 2)) * 0.55;
  return Math.min(1, lub + dub);
}
