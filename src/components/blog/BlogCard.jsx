import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/format'

export default function BlogCard({ post }) {
  return (
    <article className="blog-card">
      <Link
        to={`/blogs/${post.slug}`}
        className="blog-card-media"
        aria-label={`Read ${post.title}`}
      >
        {post.featured_image_url ? (
          <img
            src={post.featured_image_url}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="blog-card-placeholder" aria-hidden="true">
            🐾
          </span>
        )}
      </Link>

      <div className="blog-card-body">
        <p className="blog-card-date">{formatDate(post.published_at)}</p>

        <h2>
          <Link to={`/blogs/${post.slug}`}>{post.title}</Link>
        </h2>

        {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}

        <Link to={`/blogs/${post.slug}`} className="blog-card-link">
          Read story <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}
