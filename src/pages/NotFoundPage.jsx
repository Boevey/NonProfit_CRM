import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found | Pawly Dog Rescue'
  }, [])

  return (
    <main className="not-found-page">
      <div className="container state-card">
        <span className="state-icon" aria-hidden="true">
          🐾
        </span>
        <h1>Page not found</h1>
        <p>The page you’re looking for has wandered off.</p>
        <div className="state-actions">
          <Link to="/" className="btn btn-primary">
            Back home
          </Link>
          <Link to="/blogs" className="btn btn-secondary">
            Read our stories
          </Link>
        </div>
      </div>
    </main>
  )
}
