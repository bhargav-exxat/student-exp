/**
 * Build a safe `mailto:` URL from a possibly-untrusted email string.
 *
 * Per RFC 6068, a `mailto:` href is parsed as `mailto:<addr>[?<headers>]`,
 * where `<headers>` is a sequence of `key=value` pairs separated by `&`.
 * Without encoding, an email-shaped string that contains `?`, `&`, `\r`,
 * `\n`, or other URI-reserved characters could append arbitrary mail headers
 * (`?cc=`, `?bcc=`, `?subject=`, `%0A` for newlines) or break out of the URL
 * entirely.
 *
 * We split on the first `@` so the address still reads naturally in tooltips
 * and address-bar previews (`user@example.com` instead of `user%40example.com`),
 * and percent-encode each side independently with `encodeURIComponent`. We
 * also strip CR/LF defensively before encoding to short-circuit header
 * injection even if a future bug allows them through validation upstream.
 */
export function mailtoHref(email: string): string {
  const cleaned = email.replace(/[\r\n]+/g, "").trim()
  if (!cleaned) return "mailto:"

  const at = cleaned.indexOf("@")
  if (at <= 0 || at === cleaned.length - 1) {
    return `mailto:${encodeURIComponent(cleaned)}`
  }

  const local = encodeURIComponent(cleaned.slice(0, at))
  const domain = encodeURIComponent(cleaned.slice(at + 1))
  return `mailto:${local}@${domain}`
}
