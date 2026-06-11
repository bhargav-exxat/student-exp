/**
 * URL helpers for dedicated search surfaces — hubs pass domain-specific patchers.
 */

export type DedicatedSearchParamsPatch = (
  /** Current query string snapshot (e.g. from `useSearchParams` serialization). */
  searchParamsKey: string,
  /** Trimmed query text; empty string means “clear primary search param”. */
  submittedText: string,
) => URLSearchParams

/** Default: single `q` param, replaces or deletes only `q`. */
export function patchDedicatedSearchQueryParam(
  searchParamsKey: string,
  submittedText: string,
  paramName = "q",
): URLSearchParams {
  const next = new URLSearchParams(searchParamsKey)
  const t = submittedText.trim()
  if (t) next.set(paramName, t)
  else next.delete(paramName)
  return next
}
