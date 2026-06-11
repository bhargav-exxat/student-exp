/**
 * logo.dev brand images — publishable key is safe in the browser (like the
 * example: `https://img.logo.dev/stripe.com?token=pk_…`).
 *
 * Override locally with `VITE_LOGO_DEV_TOKEN` in `.env.local`.
 */
export const LOGO_DEV_PUBLISHABLE_KEY =
  import.meta.env.VITE_LOGO_DEV_TOKEN ?? "pk_JltPpX0KR4WONn4HFjq3Aw"

export function logoDevUrl(domain: string): string {
  const q = new URLSearchParams({ token: LOGO_DEV_PUBLISHABLE_KEY })
  return `https://img.logo.dev/${domain}?${q.toString()}`
}
