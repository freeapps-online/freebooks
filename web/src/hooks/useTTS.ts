import { useState, useEffect, useRef, useCallback } from 'react'

export interface TTSState {
  isPlaying: boolean
  rate: number
  voice: SpeechSynthesisVoice | null
  voices: SpeechSynthesisVoice[]
  currentParagraph: number
}

export function useTTS(paragraphs: string[]) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [rate, setRate] = useState(() => {
    const saved = localStorage.getItem('freebooks-tts-rate')
    return saved ? parseFloat(saved) : 1
  })
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [currentParagraph, setCurrentParagraph] = useState(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const paragraphsRef = useRef(paragraphs)
  const isPlayingRef = useRef(false)

  paragraphsRef.current = paragraphs

  useEffect(() => {
    const loadVoices = () => {
      const available = speechSynthesis.getVoices()
      if (available.length > 0) {
        setVoices(available)
        const savedVoiceName = localStorage.getItem('freebooks-tts-voice')
        const savedVoice = savedVoiceName
          ? available.find(v => v.name === savedVoiceName)
          : null
        const defaultVoice = savedVoice || available.find(v => v.lang.startsWith('en')) || available[0]
        setVoice(defaultVoice)
      }
    }
    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [])

  const stop = useCallback(() => {
    speechSynthesis.cancel()
    isPlayingRef.current = false
    setIsPlaying(false)
  }, [])

  const speakParagraph = useCallback((index: number) => {
    if (index >= paragraphsRef.current.length) {
      isPlayingRef.current = false
      setIsPlaying(false)
      return
    }

    const text = paragraphsRef.current[index]
    if (!text.trim()) {
      // Skip empty paragraphs
      setCurrentParagraph(index + 1)
      speakParagraph(index + 1)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    if (voice) utterance.voice = voice
    utterance.onend = () => {
      if (isPlayingRef.current) {
        const next = index + 1
        setCurrentParagraph(next)
        speakParagraph(next)
      }
    }
    utterance.onerror = (e) => {
      if (e.error !== 'canceled') {
        isPlayingRef.current = false
        setIsPlaying(false)
      }
    }
    utteranceRef.current = utterance
    setCurrentParagraph(index)
    speechSynthesis.speak(utterance)
  }, [rate, voice])

  const play = useCallback((fromParagraph?: number) => {
    speechSynthesis.cancel()
    const startAt = fromParagraph ?? currentParagraph
    isPlayingRef.current = true
    setIsPlaying(true)
    speakParagraph(startAt)
  }, [currentParagraph, speakParagraph])

  const pause = useCallback(() => {
    speechSynthesis.cancel()
    isPlayingRef.current = false
    setIsPlaying(false)
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  const changeRate = useCallback((newRate: number) => {
    setRate(newRate)
    localStorage.setItem('freebooks-tts-rate', String(newRate))
    if (isPlayingRef.current) {
      speechSynthesis.cancel()
      isPlayingRef.current = true
      setIsPlaying(true)
      speakParagraph(currentParagraph)
    }
  }, [currentParagraph, speakParagraph])

  const changeVoice = useCallback((newVoice: SpeechSynthesisVoice) => {
    setVoice(newVoice)
    localStorage.setItem('freebooks-tts-voice', newVoice.name)
    if (isPlayingRef.current) {
      speechSynthesis.cancel()
      isPlayingRef.current = true
      setIsPlaying(true)
      // speakParagraph will pick up the new voice on next render
      setTimeout(() => speakParagraph(currentParagraph), 50)
    }
  }, [currentParagraph, speakParagraph])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel()
    }
  }, [])

  return {
    isPlaying,
    rate,
    voice,
    voices,
    currentParagraph,
    setCurrentParagraph,
    play,
    pause,
    toggle,
    stop,
    changeRate,
    changeVoice,
  }
}
