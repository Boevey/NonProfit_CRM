import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPublicPost } from '../api/posts'
import MarkdownContent from '../components/blog/MarkdownContent'
import { formatDate, getErrorMessage } from '../utils/format'

export default function BlogDetailPage() {
  const { slug } = useParams()
  const [result, setResult] = useState({
    slug: null,
    post: null,
    error: '',
    status: 0,
  })

  // A result belongs to the slug that produced it. Until the request for the
  // current slug resolves we are, by definition, still loading — so loading
  // can be derived instead of written to state inside the effect.
  const isLoading = result.slug !== slug

  useEffect(() => {
    let isActive = true

    fetchPublicPost(slug)
      .then((payload) => {
        if (!isActive) return

        const post = payload?.data ?? null

        setResult({ slug, post, error: '', status: 200 })
        document.title = post?.title
          ? `${post.title} | Pawly Dog Rescue`
          : 'Story | Pawly Dog Rescue'
      })
      .catch((error) => {
        if (!isActive) return

        setResult({
          slug,
          post: null,
          error: getErrorMessage(error),
          status: error?.status ?? 0,
        })
        document.title = 'Story not found | Pawly Dog Rescue'
      })

    return () => {
      isActive = false
    }
  }, [slug])

  if (isLoading) {
    return (
      <main className="blog-page">
        <div className="container blog-detail-loading" aria-busy="true">
          <span className="spinner" aria-hidden="true" />
          Loading story…
        </div>
      </main>
    )
  }

  if (result.error || !result.post) {
    const isNotFound = result.status === 404

    return (
      <main className="blog-page">
        <div className="container state-card state-error">
          <span className="state-icon" aria-hidden="true">
            {isNotFound ? '🐾' : '⚠️'}
          </span>
          <h1>{isNotFound ? 'This story has wandered off' : 'Unable to load this story'}</h1>
          <p>
            {isNotFound
              ? 'The post may have been unpublished, renamed, or removed.'
              : result.error}
          </p>
          <div className="state-actions">
            <Link to="/blogs" className="btn btn-primary">
              Browse all stories
            </Link>
            <Link to="/" className="btn btn-secondary">
              Back home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { post } = result

  return (
    <main className="blog-page">
      <article className="container blog-article">
        <Link to="/blogs" className="blog-back-link">
          ← All stories
        </Link>

        <header className="blog-article-header">
          <p className="eyebrow dark">Rescue story</p>
          <h1>{post.title}</h1>

          {post.excerpt && (
            <p className="blog-article-excerpt">{post.excerpt}</p>
          )}

          <div className="blog-article-meta">
            <span>By {post.author?.name ?? 'Pawly team'}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.published_at}>
              {formatDate(post.published_at)}
            </time>
          </div>
        </header>

        {post.featured_image_url && (
          <figure className="blog-article-cover">
            <img src={post.featured_image_url} alt="" />
          </figure>
        )}

        <MarkdownContent
          content={post.content}
          className="blog-article-content"
        />

        <footer className="blog-article-footer">
          <Link to="/blogs" className="btn btn-secondary">
            ← Back to all stories
          </Link>
        </footer>
      </article>
    </main>
  )
}
