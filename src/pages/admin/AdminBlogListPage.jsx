import { useEffect, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { deletePost, fetchAdminPosts } from '../../api/posts'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/admin/StatusBadge'
import { formatDate, getErrorMessage } from '../../utils/format'

const PER_PAGE = 10
const STATUS_TABS = [
  { value: '', label: 'All posts' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
]

export default function AdminBlogListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const page = Math.max(Number(searchParams.get('page')) || 1, 1)
  const status = searchParams.get('status') ?? ''
  const search = searchParams.get('q') ?? ''

  const [reloadKey, setReloadKey] = useState(0)
  const [flash, setFlash] = useState(() => location.state?.flash ?? '')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const requestKey = `${page}|${status}|${search}|${reloadKey}`
  const [result, setResult] = useState({
    key: '',
    posts: [],
    meta: null,
    error: '',
  })
  const isLoading = result.key !== requestKey

  useEffect(() => {
    document.title = 'Blog posts | Pawly CMS'
  }, [])

  // The flash message is read from router state on mount; clear the history
  // state so a refresh does not show the same message again.
  useEffect(() => {
    if (location.state?.flash) {
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: {},
      })
    }
  }, [location.state, location.pathname, location.search, navigate])

  useEffect(() => {
    let isActive = true

    fetchAdminPosts({ page, perPage: PER_PAGE, status, search })
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
  }, [page, status, search, reloadKey, requestKey])

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

  async function confirmDelete() {
    if (!pendingDelete) return

    const title = pendingDelete.title

    setIsDeleting(true)
    setDeleteError('')

    try {
      await deletePost(pendingDelete.id)
      setPendingDelete(null)
      setFlash(`“${title}” was deleted.`)

      if (result.posts.length === 1 && page > 1) {
        updateParams({ page: page - 1 })
      } else {
        setReloadKey((key) => key + 1)
      }
    } catch (error) {
      setDeleteError(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  const { posts, meta, error } = result
  const hasFilters = Boolean(status || search)

  return (
    <div className="admin-main">
      <header className="admin-page-header">
        <div>
          <p className="admin-breadcrumb">Content studio</p>
          <h1>Blog posts</h1>
          <p className="admin-subtitle">
            Create, edit, and publish stories for the Pawly community.
          </p>
        </div>

        <div className="admin-actions">
          <Link to="/admin/blogs/new" className="btn btn-primary">
            ✚ New post
          </Link>
        </div>
      </header>

      {flash && (
        <div className="admin-flash" role="status">
          <span>{flash}</span>
          <button
            type="button"
            onClick={() => setFlash('')}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist" aria-label="Filter by status">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value || 'all'}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              className={`admin-tab${status === tab.value ? ' is-active' : ''}`}
              onClick={() =>
                updateParams({ status: tab.value, page: null })
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form className="admin-search" onSubmit={handleSearch} role="search">
          <label className="sr-only" htmlFor="admin-post-search">
            Search posts
          </label>
          <input
            key={search}
            id="admin-post-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Search by title or slug…"
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
          {hasFilters && (
            <Link to="/admin/blogs" className="admin-clear-filters">
              Reset
            </Link>
          )}
        </form>
      </div>

      {error ? (
        <div className="state-card state-error">
          <h2>We couldn’t load your posts</h2>
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <div className="admin-table-wrap" aria-busy="true">
          <div className="admin-table-loading" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            Loading posts…
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="state-card">
          <span className="state-icon" aria-hidden="true">
            {hasFilters ? '🔎' : '📝'}
          </span>
          <h2>{hasFilters ? 'No posts match your filters' : 'No posts yet'}</h2>
          <p>
            {hasFilters
              ? 'Try a different search term or status filter.'
              : 'Create your first story and share it with the Pawly community.'}
          </p>
          {hasFilters ? (
            <Link to="/admin/blogs" className="btn btn-secondary">
              Clear filters
            </Link>
          ) : (
            <Link to="/admin/blogs/new" className="btn btn-primary">
              Create your first post
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Post</th>
                  <th scope="col">Status</th>
                  <th scope="col">Author</th>
                  <th scope="col">Updated</th>
                  <th scope="col" className="admin-table-actions-head">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div className="admin-post-cell">
                        {post.featured_image_url ? (
                          <img
                            src={post.featured_image_url}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          <span
                            className="admin-post-thumb-placeholder"
                            aria-hidden="true"
                          >
                            🐾
                          </span>
                        )}

                        <div className="admin-post-copy">
                          <Link
                            to={`/admin/blogs/${post.id}/edit`}
                            className="admin-post-title"
                          >
                            {post.title}
                          </Link>
                          <span className="admin-post-slug">
                            /blogs/{post.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={post.status} />
                    </td>

                    <td>{post.author?.name ?? '—'}</td>

                    <td>
                      <span className="admin-date">
                        {formatDate(post.published_at ?? post.updated_at)}
                      </span>
                    </td>

                    <td>
                      <div className="admin-row-actions">
                        <Link
                          to={`/admin/blogs/${post.id}/edit`}
                          className="admin-action"
                        >
                          Edit
                        </Link>

                        {post.status === 'published' && (
                          <a
                            href={`/blogs/${post.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-action"
                          >
                            View
                          </a>
                        )}

                        <button
                          type="button"
                          className="admin-action admin-action-danger"
                          onClick={() => {
                            setDeleteError('')
                            setPendingDelete(post)
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.last_page > 1 && (
            <nav className="pagination admin-pagination" aria-label="Posts pagination">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={meta.current_page <= 1}
                onClick={() => updateParams({ page: meta.current_page - 1 })}
              >
                ← Previous
              </button>

              <span>
                Page {meta.current_page} of {meta.last_page} · {meta.total}{' '}
                {meta.total === 1 ? 'post' : 'posts'}
              </span>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => updateParams({ page: meta.current_page + 1 })}
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this post?"
          description={`“${pendingDelete.title}” will be permanently deleted, including its uploaded image. This cannot be undone.`}
          confirmLabel="Delete post"
          isProcessing={isDeleting}
          error={deleteError}
          onCancel={() => {
            if (!isDeleting) {
              setPendingDelete(null)
              setDeleteError('')
            }
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}
