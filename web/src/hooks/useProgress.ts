import { useState, useCallback } from 'react'

const STORAGE_KEY = 'freebooks-progress'

export interface ReadingProgress {
  bookId: string
  chapter: number
  scrollPosition: number
  lastRead: number
}

function loadAll(): Record<string, ReadingProgress> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveAll(data: Record<string, ReadingProgress>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useProgress(bookId: string) {
  const [progress, setProgress] = useState<ReadingProgress>(() => {
    const all = loadAll()
    return all[bookId] || { bookId, chapter: 0, scrollPosition: 0, lastRead: Date.now() }
  })

  const updateProgress = useCallback((chapter: number, scrollPosition = 0) => {
    const updated: ReadingProgress = { bookId, chapter, scrollPosition, lastRead: Date.now() }
    setProgress(updated)
    const all = loadAll()
    all[bookId] = updated
    saveAll(all)
  }, [bookId])

  return { progress, updateProgress }
}

export function getRecentBooks(): ReadingProgress[] {
  const all = loadAll()
  return Object.values(all)
    .sort((a, b) => b.lastRead - a.lastRead)
    .slice(0, 10)
}
