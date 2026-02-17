/**
 * Shared alert sound utility
 * Uses Web Audio API to generate severity-based alert tones
 */

const frequencies: Record<string, number[]> = {
  critical: [880, 0, 880, 0, 880], // High pitched urgent beeps
  warning: [660, 0, 660], // Medium pitched warning beeps
  info: [440], // Single informational tone
};

export function playAlertSound(severity: "critical" | "warning" | "info") {
  try {
    const audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const freq = frequencies[severity];
    const beepDuration = severity === "critical" ? 0.15 : 0.2;
    let time = audioContext.currentTime;

    freq.forEach((f) => {
      if (f === 0) {
        time += beepDuration * 0.5; // Pause
      } else {
        oscillator.frequency.setValueAtTime(f, time);
        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.setValueAtTime(0, time + beepDuration * 0.9);
        time += beepDuration;
      }
    });

    oscillator.type = "sine";
    oscillator.start(audioContext.currentTime);
    oscillator.stop(time);
  } catch {
    console.warn("Alert sound could not be played");
  }
}
