/**
 * Merge speech-recognition chunks into composer text without interim/final fighting.
 */
export function processDictationTranscript(base: string, chunk: string, isFinal: boolean): string {
  const addition = chunk.trim()
  if (isFinal) {
    return base.trim() ? `${base.trimEnd()} ${addition}` : addition
  }
  return `${base}${chunk}`
}
