import { useState, useEffect, useCallback } from 'react'
import { CATALOG, type CatalogBook } from './data/catalog'
import Library from './components/Library'
import Reader from './components/Reader'

function getRouteFromHash(): { page: 'library' | 'reader'; bookId?: string } {
  const hash = window.location.hash
  const match = hash.match(/^#\/book\/(.+)$/)
  if (match) return { page: 'reader', bookId: match[1] }
  return { page: 'library' }
}

export default function App() {
  const [route, setRoute] = useState(getRouteFromHash)

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigateToBook = useCallback((book: CatalogBook) => {
    window.location.hash = `#/book/${book.id}`
  }, [])

  const navigateToLibrary = useCallback(() => {
    window.location.hash = ''
  }, [])

  if (route.page === 'reader' && route.bookId) {
    const book = CATALOG.find(b => b.id === route.bookId)
    if (book) {
      return <Reader book={book} onBack={navigateToLibrary} />
    }
  }

  return <Library onSelectBook={navigateToBook} />
}
