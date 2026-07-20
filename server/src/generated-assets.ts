// Wordt tijdens `build:exe` overschreven met de gebouwde PWA (base64) zodat de host-.exe
// één losstaand bestand is. Standaard leeg → server valt terug op web/dist op schijf (dev).
export const ASSETS: Record<string, { type: string; base64: string }> = {};
