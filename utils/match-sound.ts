const MATCH_SOUND_SRC = "/sounds/match-complete.wav";
const NOTIFICATION_SOUND_SRC = "/sounds/notification.wav";

let matchAudioSingleton: HTMLAudioElement | null = null;
const playedNotificationKeys = new Set<string>();

function getMatchAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!matchAudioSingleton) {
    matchAudioSingleton = new Audio(MATCH_SOUND_SRC);
    matchAudioSingleton.preload = "auto";
    matchAudioSingleton.volume = 0.45;
  }
  return matchAudioSingleton;
}

/**
 * Toca o beep local de conclusão de Match Run.
 * Falha silenciosa se autoplay for bloqueado.
 */
export async function playMatchCompleteSound(): Promise<void> {
  try {
    const audio = getMatchAudio();
    if (!audio) return;
    audio.currentTime = 0;
    await audio.play();
  } catch {
    // Autoplay bloqueado ou mídia indisponível — toast permanece.
  }
}

/**
 * Som curto de notificação persistente; nunca lança; respeita preferência local.
 */
export async function playNotificationSound(dedupeKey?: string): Promise<void> {
  if (typeof window === "undefined") return;
  const key = dedupeKey || `anon:${Date.now()}`;
  if (playedNotificationKeys.has(key)) return;
  playedNotificationKeys.add(key);
  try {
    const preference = window.localStorage.getItem("pricescout.notificationSound");
    if (preference === "off") return;
    const audio = new Audio(NOTIFICATION_SOUND_SRC);
    audio.volume = 0.35;
    await audio.play();
  } catch {
    // Autoplay bloqueado ou asset ausente — feedback visual permanece.
  }
}
