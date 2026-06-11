"use client"

import * as React from "react"

import { playMicArmSound, playMicReleaseSound } from "@/lib/ui-sounds"

/** Four bars shown in the Stop button waveform. */
export const WAVE_BAR_COUNT = 4

type SpeechRecognitionResultList = {
  length: number
  [index: number]: {
    isFinal: boolean
    0?: { transcript?: string }
  } | undefined
}

type SpeechRecognitionResultEvent = {
  resultIndex: number
  results: SpeechRecognitionResultList
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function emptyLevels(): number[] {
  return Array.from({ length: WAVE_BAR_COUNT }, () => 0)
}

export type UseSpeechDictationOptions = {
  onTranscript: (text: string, isFinal: boolean) => void
  lang?: string
  onError?: (error: unknown) => void
}

export function useSpeechDictation({
  onTranscript,
  lang = "en-US",
  onError,
}: UseSpeechDictationOptions) {
  const [isListening, setIsListening] = React.useState(false)
  const [isSupported, setIsSupported] = React.useState(false)
  const [waveformLevels, setWaveformLevels] = React.useState<number[]>(emptyLevels)

  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null)
  const intentListeningRef = React.useRef(false)
  const onTranscriptRef = React.useRef(onTranscript)
  const onErrorRef = React.useRef(onError)
  onTranscriptRef.current = onTranscript
  onErrorRef.current = onError

  const streamRef = React.useRef<MediaStream | null>(null)
  const audioContextRef = React.useRef<AudioContext | null>(null)
  const analyserRef = React.useRef<AnalyserNode | null>(null)
  const rafRef = React.useRef<number | null>(null)
  const smoothedRef = React.useRef<number[]>(emptyLevels())
  const timeDataRef = React.useRef<Uint8Array | null>(null)
  const freqDataRef = React.useRef<Uint8Array | null>(null)

  React.useEffect(() => {
    setIsSupported(getSpeechRecognitionCtor() !== null)
  }, [])

  const teardownAudio = React.useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    analyserRef.current = null
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined)
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    smoothedRef.current = emptyLevels()
    setWaveformLevels(emptyLevels())
  }, [])

  const runAnalyserLoop = React.useCallback(() => {
    const analyser = analyserRef.current
    const ctx = audioContextRef.current
    if (!analyser) return

    if (ctx?.state === "suspended") {
      void ctx.resume()
    }

    if (!timeDataRef.current || timeDataRef.current.length !== analyser.fftSize) {
      timeDataRef.current = new Uint8Array(analyser.fftSize)
    }
    if (!freqDataRef.current || freqDataRef.current.length !== analyser.frequencyBinCount) {
      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount)
    }

    const timeData = timeDataRef.current
    const freqData = freqDataRef.current
    analyser.getByteTimeDomainData(timeData as Uint8Array<ArrayBuffer>)
    analyser.getByteFrequencyData(freqData as Uint8Array<ArrayBuffer>)

    const timeLen = timeData.length
    const segmentLen = Math.max(8, Math.floor(timeLen / WAVE_BAR_COUNT))
    const freqLen = freqData.length

    const next = smoothedRef.current.slice()
    const smoothing = 0.38

    for (let b = 0; b < WAVE_BAR_COUNT; b++) {
      const tStart = b * segmentLen
      const tEnd = Math.min(timeLen, tStart + segmentLen)
      let sumSq = 0
      for (let i = tStart; i < tEnd; i++) {
        const sample = (timeData[i] - 128) / 128
        sumSq += sample * sample
      }
      const segRms = Math.sqrt(sumSq / Math.max(1, tEnd - tStart))

      const fStart = Math.floor((b / WAVE_BAR_COUNT) * freqLen * 0.72)
      const fEnd = Math.max(fStart + 1, Math.floor(((b + 1) / WAVE_BAR_COUNT) * freqLen * 0.72))
      let freqSum = 0
      for (let i = fStart; i < fEnd; i++) freqSum += freqData[i] ?? 0
      const freqAvg = freqSum / (fEnd - fStart)

      const timeLevel = Math.pow(segRms, 0.75) * 5.5
      const freqLevel = Math.pow(freqAvg / 255, 0.8) * 3.2
      let target = timeLevel * 0.55 + freqLevel * 0.45
      target = Math.min(1, target)

      next[b] = smoothing * next[b] + (1 - smoothing) * target
    }

    smoothedRef.current = next
    setWaveformLevels([...next])
    rafRef.current = requestAnimationFrame(runAnalyserLoop)
  }, [])

  const attachMicrophoneAnalyser = React.useCallback(
    async (stream: MediaStream) => {
      const Ctx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return

      const ctx = new Ctx()
      await ctx.resume()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.25
      source.connect(analyser)

      audioContextRef.current = ctx
      analyserRef.current = analyser
      rafRef.current = requestAnimationFrame(runAnalyserLoop)
    },
    [runAnalyserLoop],
  )

  const stop = React.useCallback(
    (options?: { playRelease?: boolean }) => {
      intentListeningRef.current = false
      recognitionRef.current?.stop()
      recognitionRef.current = null
      teardownAudio()
      setIsListening(false)
      if (options?.playRelease !== false) {
        playMicReleaseSound()
      }
    },
    [teardownAudio],
  )

  const start = React.useCallback(async () => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return

    if (recognitionRef.current) {
      stop({ playRelease: false })
    }

    intentListeningRef.current = true
    setIsListening(true)
    playMicArmSound()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      if (!intentListeningRef.current) {
        stream.getTracks().forEach(track => track.stop())
        return
      }
      streamRef.current = stream
      await attachMicrophoneAnalyser(stream)
    } catch (err) {
      intentListeningRef.current = false
      teardownAudio()
      setIsListening(false)
      onErrorRef.current?.(err)
      return
    }

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang

    recognition.onresult = event => {
      let interim = ""
      let finalText = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const chunk = result?.[0]?.transcript ?? ""
        if (result?.isFinal) finalText += chunk
        else interim += chunk
      }
      if (finalText) onTranscriptRef.current(finalText, true)
      else if (interim) onTranscriptRef.current(interim, false)
    }

    recognition.onerror = event => {
      if (event.error !== "aborted") {
        onErrorRef.current?.(event)
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        intentListeningRef.current = false
        recognitionRef.current = null
        teardownAudio()
        setIsListening(false)
      }
    }

    recognition.onend = () => {
      if (!intentListeningRef.current) {
        recognitionRef.current = null
        teardownAudio()
        setIsListening(false)
        return
      }
      try {
        recognition.start()
      } catch {
        intentListeningRef.current = false
        recognitionRef.current = null
        teardownAudio()
        setIsListening(false)
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (err) {
      intentListeningRef.current = false
      recognitionRef.current = null
      teardownAudio()
      setIsListening(false)
      onErrorRef.current?.(err)
    }
  }, [attachMicrophoneAnalyser, lang, stop, teardownAudio])

  const toggle = React.useCallback(() => {
    if (isListening) stop()
    else void start()
  }, [isListening, start, stop])

  React.useEffect(
    () => () => {
      intentListeningRef.current = false
      try {
        recognitionRef.current?.abort()
      } catch {
        recognitionRef.current?.stop()
      }
      recognitionRef.current = null
      teardownAudio()
    },
    [teardownAudio],
  )

  return {
    isSupported,
    isListening,
    waveformLevels,
    start,
    stop,
    toggle,
  }
}
