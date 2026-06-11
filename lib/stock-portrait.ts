/**
 * Deterministic stock portrait URLs via randomuser.me static assets (no API key).
 * Same seed → same image across reloads.
 */
export function stockPortraitUrl(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const n = h % 99
  const gender = h % 2 === 0 ? "men" : "women"
  return `https://randomuser.me/api/portraits/${gender}/${n}.jpg`
}
