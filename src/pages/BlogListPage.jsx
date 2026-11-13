import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchPublicPosts } from '../api/posts'
import BlogCard from '../components/blog/BlogCard'
import { getErrorMessage } from '../utils/format'

const PER_PAGE = 9

export default function BlogListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(Number(searchParams.get('page')) || 1, 1)
  const search = searchParams.get('q') ?? ''

  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${page}|${search}|${reloadKey}`
  const [result, setResult] = useState({
    key: '',
    posts: [],
    meta: null,
    error: '',
  })

  // The response is tagged with the request it belongs to. Until the current
  // request resolves there is no matching result, which means we are loading.
  const isLoading = result.key !== requestKey

  useEffect(() => {
    let isActive = true

    fetchPublicPosts({ page, perPage: PER_PAGE, search })
      .then((payload) => {
        if (!isActive) return

        setResult({
          key: requestKey,
          posts: payload?.data ?? [],
          meta: payload?.meta ?? null,
          error: '',
        })
      })
      .catch((error) => {
        if (!isActive) return

        setResult({
          key: requestKey,
          posts: [],
          meta: null,
          error: getErrorMessage(error),
        })
      })

    return () => {
      isActive = false
    }
  }, [page, search, reloadKey, requestKey])

  useEffect(() => {
    document.title = 'Blogs | Pawly Dog Rescue'
  }, [])

  function updateParams(updates) {
    const params = new URLSearchParams(searchParams)

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    setSearchParams(params)
  }

  function handleSearch(event) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const value = String(formData.get('q') ?? '').trim()

    updateParams({ q: value, page: null })
  }

  const { posts, meta, error } = result

  return (
    <main className="blog-page">
      <section className="blog-hero">
        <div className="container blog-hero-inner">
          <p className="eyebrow">Stories from the rescue</p>
          <h1>Rescue stories, adoption guides, and happy tails.</h1>
          <p className="blog-hero-text">
            Follow the dogs in our care, learn what adoption really looks like, and
            meet the volunteers who make second chances possible.
          </p>

          <form className="blog-search" onSubmit={handleSearch} role="search">
            <label className="sr-only" htmlFor="blog-search-input">
              Search stories
            </label>
            <input
              key={search}
              id="blog-search-input"
              name="q"
              type="search"
              defaultValue={search}
              placeholder="Search stories…"
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
            {search && (
              <Link to="/blogs" className="blog-search-clear">
                Clear
              </Link>
            )}
          </form>
        </div>
      </section>

      <section
        className="container blog-listing"
        aria-busy={isLoading}
        aria-live="polite"
      >
        <div className="blog-listing-head">
          <div>
            <p className="eyebrow dark">
              {search ? 'Search results' : 'Latest stories'}
            </p>
            <h2>
              {search
                ? `Stories matching “${search}”`
                : 'From the Pawly community'}
            </h2>
          </div>

          {meta && (
            <span className="blog-count">
              {meta.total} {meta.total === 1 ? 'story' : 'stories'}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="blog-grid" aria-hidden="true">
            {[0, 1, 2].map((key) => (
              <div key={key} className="blog-card blog-card-skeleton">
                <div className="skeleton-media" />
                <div className="skeleton-body">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="state-card state-error">
            <span className="state-icon" aria-hidden="true">
              ⚠️
            </span>
            <h3>We couldn’t load the stories</h3>
            <p>{error}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Try again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="state-card">
            <span className="state-icon" aria-hidden="true">
              🐾
            </span>
            <h3>{search ? 'No stories found' : 'No stories yet'}</h3>
            <p>
              {search
                ? 'Try a different search term or browse all stories.'
                : 'Check back soon for rescue stories and adoption guides.'}
            </p>
            {search && (
              <Link to="/blogs" className="btn btn-secondary">
                Clear search
              </Link>
            )}
          </div>
        ) : (
          <div className="blog-grid">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {meta && meta.last_page > 1 && !isLoading && !error && (
          <nav className="pagination" aria-label="Blog pagination">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={meta.current_page <= 1}
              onClick={() => updateParams({ page: meta.current_page - 1 })}
            >
              ← Newer
            </button>

            <span>
              Page {meta.current_page} of {meta.last_page}
            </span>

            <button
              type="button"
              className="btn btn-secondary"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => updateParams({ page: meta.current_page + 1 })}
            >
              Older →
            </button>
          </nav>
        )}
      </section>
    </main>
  )
}
