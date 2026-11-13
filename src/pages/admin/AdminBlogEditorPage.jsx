import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createPost, fetchAdminPost, updatePost } from '../../api/posts'
import MarkdownContent from '../../components/blog/MarkdownContent'
import {
  getErrorMessage,
  slugify,
  toDateTimeLocal,
} from '../../utils/format'

const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'draft',
  published_at: '',
}

const TOOLBAR_ACTIONS = [
  { label: 'B', title: 'Bold', before: '**', after: '**', placeholder: 'bold text', className: 'is-bold' },
  { label: 'I', title: 'Italic', before: '_', after: '_', placeholder: 'italic text', className: 'is-italic' },
  { label: 'H2', title: 'Heading', before: '## ', after: '', placeholder: 'Heading' },
  { label: 'Link', title: 'Link', before: '[', after: '](https://example.com)', placeholder: 'link text' },
  { label: '• List', title: 'Bullet list', before: '- ', after: '', placeholder: 'List item' },
  { label: '❝', title: 'Quote', before: '> ', after: '', placeholder: 'Quote' },
  { label: '`Code`', title: 'Inline code', before: '`', after: '`', placeholder: 'code' },
]

function firstError(value) {
  return Array.isArray(value) ? value[0] : value
}

export default function AdminBlogEditorPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [existingImage, setExistingImage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [removeImage, setRemoveImage] = useState(false)

  // Loading is derived from whether the post for the current `id` has been
  // fetched yet, which avoids writing loading state inside an effect.
  const [loadState, setLoadState] = useState({ id: null, error: '' })
  const isLoading = isEditing && loadState.id !== id
  const loadError = loadState.id === id ? loadState.error : ''
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [editorTab, setEditorTab] = useState('write')

  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    document.title = isEditing ? 'Edit post | Pawly CMS' : 'New post | Pawly CMS'
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) return undefined

    let isActive = true

    fetchAdminPost(id)
      .then((payload) => {
        if (!isActive) return

        const post = payload?.data

        if (!post) {
          throw new Error('That post could not be found.')
        }

        setForm({
          title: post.title ?? '',
          slug: post.slug ?? '',
          excerpt: post.excerpt ?? '',
          content: post.content ?? '',
          status: post.status ?? 'draft',
          published_at: toDateTimeLocal(post.published_at),
        })
        setExistingImage(post.featured_image_url ?? '')
        setSlugTouched(true)
        setLoadState({ id, error: '' })
      })
      .catch((error) => {
        if (!isActive) return

        setLoadState({ id, error: getErrorMessage(error) })
      })

    return () => {
      isActive = false
    }
  }, [id, isEditing])

  // Release the object URL backing the preview when the selection changes or
  // the editor unmounts. Creating the URL happens in the change handler, so
  // this effect never needs to call setState.
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  function clearFieldError(name) {
    setFieldErrors((current) => {
      if (!current[name]) return current

      const next = { ...current }
      delete next[name]
      return next
    })
  }

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => {
      const next = { ...current, [name]: value }

      if (name === 'title' && !slugTouched) {
        next.slug = slugify(value)
      }

      if (name === 'status' && value === 'published' && !next.published_at) {
        next.published_at = toDateTimeLocal(new Date().toISOString())
      }

      return next
    })

    clearFieldError(name)
  }

  function handleSlugChange(event) {
    const value = event.target.value

    setSlugTouched(true)
    setForm((current) => ({ ...current, slug: slugify(value) }))
    clearFieldError('slug')
  }

  function regenerateSlug() {
    setSlugTouched(false)
    setForm((current) => ({ ...current, slug: slugify(current.title) }))
    clearFieldError('slug')
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFieldErrors((current) => ({
        ...current,
        featured_image: ['Choose a valid image file.'],
      }))
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((current) => ({
        ...current,
        featured_image: ['The image must be 5 MB or smaller.'],
      }))
      event.target.value = ''
      return
    }

    clearFieldError('featured_image')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setRemoveImage(false)
  }

  function clearSelectedImage() {
    setImageFile(null)
    setImagePreview('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function insertMarkdown({ before, after = '', placeholder = 'text' }) {
    const textarea = textareaRef.current

    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = form.content.slice(start, end) || placeholder
    const nextContent =
      form.content.slice(0, start) +
      before +
      selected +
      after +
      form.content.slice(end)

    setForm((current) => ({ ...current, content: nextContent }))
    clearFieldError('content')

    window.requestAnimationFrame(() => {
      textarea.focus()
      const cursor = start + before.length + selected.length + after.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setFieldErrors({})

    const errors = {}

    if (!form.title.trim()) {
      errors.title = 'A title is required.'
    }

    if (!form.content.trim()) {
      errors.content = 'Content is required.'
    }

    if (form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      errors.slug = 'Use lowercase letters, numbers, and hyphens only.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setEditorTab('write')
      return
    }

    setIsSaving(true)

    try {
      const payload = new FormData()
      payload.append('title', form.title.trim())

      if (form.slug.trim()) {
        payload.append('slug', form.slug.trim())
      }

      payload.append('excerpt', form.excerpt.trim())
      payload.append('content', form.content)
      payload.append('status', form.status)

      if (form.status === 'published' && form.published_at) {
        payload.append('published_at', new Date(form.published_at).toISOString())
      }

      if (imageFile) {
        payload.append('featured_image', imageFile)
      }

      if (removeImage) {
        payload.append('remove_featured_image', '1')
      }

      const response = isEditing
        ? await updatePost(id, payload)
        : await createPost(payload)

      const saved = response?.data
      const savedTitle = saved?.title ?? form.title.trim()

      navigate('/admin/blogs', {
        replace: true,
        state: {
          flash: isEditing
            ? `“${savedTitle}” was updated.`
            : `“${savedTitle}” was created.`,
        },
      })
    } catch (error) {
      if (error?.errors) {
        setFieldErrors(error.errors)
      }

      setFormError(getErrorMessage(error))
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="admin-main">
        <div className="admin-editor-loading" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          Loading post…
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="admin-main">
        <div className="state-card state-error">
          <span className="state-icon" aria-hidden="true">
            ⚠️
          </span>
          <h1>We couldn’t open this post</h1>
          <p>{loadError}</p>
          <div className="state-actions">
            <Link to="/admin/blogs" className="btn btn-primary">
              Back to posts
            </Link>
            <Link to="/admin/blogs/new" className="btn btn-secondary">
              Create a new post
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const showExistingImage = Boolean(existingImage && !removeImage)

  return (
    <div className="admin-main">
      <header className="admin-page-header admin-editor-header">
        <div>
          <Link to="/admin/blogs" className="admin-back-link">
            ← All posts
          </Link>
          <h1>{isEditing ? 'Edit post' : 'Create a new post'}</h1>
          <p className="admin-subtitle">
            {isEditing
              ? 'Update the story and save your changes.'
              : 'Write a new story for the Pawly community.'}
          </p>
        </div>

        <div className="admin-actions">
          <Link to="/admin/blogs" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            form="post-editor-form"
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving
              ? 'Saving…'
              : isEditing
                ? 'Save changes'
                : 'Create post'}
          </button>
        </div>
      </header>

      {formError && (
        <div className="admin-error" role="alert">
          {formError}
        </div>
      )}

      <form
        id="post-editor-form"
        className="admin-editor-grid"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="admin-editor-main">
          <section className="editor-card">
            <div className="field">
              <label htmlFor="post-title">Title</label>
              <input
                id="post-title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="A story worth sharing"
                disabled={isSaving}
                aria-invalid={Boolean(fieldErrors.title)}
              />
              {fieldErrors.title && (
                <p className="field-error">{firstError(fieldErrors.title)}</p>
              )}
            </div>

            <div className="field">
              <label htmlFor="post-slug">Slug</label>
              <div className="slug-input">
                <span aria-hidden="true">/blogs/</span>
                <input
                  id="post-slug"
                  name="slug"
                  type="text"
                  value={form.slug}
                  onChange={handleSlugChange}
                  placeholder="auto-generated-from-title"
                  disabled={isSaving}
                  aria-invalid={Boolean(fieldErrors.slug)}
                />
                <button
                  type="button"
                  className="slug-regenerate"
                  onClick={regenerateSlug}
                  disabled={isSaving || !form.title}
                >
                  Regenerate
                </button>
              </div>
              <p className="field-hint">
                Lowercase letters, numbers, and hyphens. Generated automatically
                from the title.
              </p>
              {fieldErrors.slug && (
                <p className="field-error">{firstError(fieldErrors.slug)}</p>
              )}
            </div>

            <div className="field">
              <label htmlFor="post-excerpt">
                Excerpt <span className="field-optional">optional</span>
              </label>
              <textarea
                id="post-excerpt"
                name="excerpt"
                rows={3}
                maxLength={500}
                value={form.excerpt}
                onChange={handleChange}
                placeholder="A short summary shown on the blog listing."
                disabled={isSaving}
                aria-invalid={Boolean(fieldErrors.excerpt)}
              />
              <div className="field-meta">
                <span className="field-hint">
                  Shown on the blog listing and in search results.
                </span>
                <span>{form.excerpt.length}/500</span>
              </div>
              {fieldErrors.excerpt && (
                <p className="field-error">{firstError(fieldErrors.excerpt)}</p>
              )}
            </div>

            <div className="field">
              <div className="editor-label-row">
                <label htmlFor="post-content">Content</label>

                <div className="editor-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={editorTab === 'write'}
                    className={editorTab === 'write' ? 'is-active' : ''}
                    onClick={() => setEditorTab('write')}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={editorTab === 'preview'}
                    className={editorTab === 'preview' ? 'is-active' : ''}
                    onClick={() => setEditorTab('preview')}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {editorTab === 'write' ? (
                <>
                  <div
                    className="editor-toolbar"
                    role="toolbar"
                    aria-label="Markdown formatting"
                  >
                    {TOOLBAR_ACTIONS.map((action) => (
                      <button
                        key={action.title}
                        type="button"
                        title={action.title}
                        aria-label={action.title}
                        className={action.className ?? ''}
                        onClick={() => insertMarkdown(action)}
                        disabled={isSaving}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    ref={textareaRef}
                    id="post-content"
                    name="content"
                    className="editor-textarea"
                    rows={18}
                    value={form.content}
                    onChange={handleChange}
                    placeholder="Write in Markdown…"
                    disabled={isSaving}
                    aria-invalid={Boolean(fieldErrors.content)}
                  />
                </>
              ) : (
                <div className="editor-preview">
                  {form.content.trim() ? (
                    <MarkdownContent content={form.content} />
                  ) : (
                    <p className="editor-preview-empty">
                      Nothing to preview yet. Add some content in the Write tab.
                    </p>
                  )}
                </div>
              )}

              {fieldErrors.content && (
                <p className="field-error">{firstError(fieldErrors.content)}</p>
              )}
            </div>
          </section>
        </div>

        <aside className="editor-sidebar">
          <section className="editor-card">
            <h2>Publishing</h2>

            <div className="field">
              <label htmlFor="post-status">Status</label>
              <select
                id="post-status"
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={isSaving}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <p className="field-hint">
                {form.status === 'draft'
                  ? 'Drafts are only visible in the CMS.'
                  : 'Published posts appear on the public blog immediately.'}
              </p>
              {fieldErrors.status && (
                <p className="field-error">{firstError(fieldErrors.status)}</p>
              )}
            </div>

            <div className="field">
              <label htmlFor="post-published-at">
                Publish date <span className="field-optional">optional</span>
              </label>
              <input
                id="post-published-at"
                name="published_at"
                type="datetime-local"
                value={form.published_at}
                onChange={handleChange}
                disabled={isSaving || form.status === 'draft'}
              />
              <p className="field-hint">
                {form.status === 'draft'
                  ? 'Set the status to Published to choose a date.'
                  : 'Leave blank to publish immediately.'}
              </p>
              {fieldErrors.published_at && (
                <p className="field-error">
                  {firstError(fieldErrors.published_at)}
                </p>
              )}
            </div>

            <div className="editor-sidebar-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving
                  ? 'Saving…'
                  : isEditing
                    ? 'Save changes'
                    : 'Create post'}
              </button>
              <Link to="/admin/blogs" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </section>

          <section className="editor-card">
            <h2>Featured image</h2>

            {imagePreview || showExistingImage ? (
              <div className="editor-image-preview">
                <img
                  src={imagePreview || existingImage}
                  alt="Featured image preview"
                />

                {imagePreview ? (
                  <button
                    type="button"
                    className="editor-image-clear"
                    onClick={clearSelectedImage}
                    disabled={isSaving}
                  >
                    Clear selection
                  </button>
                ) : (
                  <span className="editor-image-note">Current image</span>
                )}
              </div>
            ) : (
              <div className="editor-image-empty">
                <span aria-hidden="true">🖼️</span>
                <p>No featured image selected.</p>
              </div>
            )}

            {existingImage && !imageFile && (
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={removeImage}
                  onChange={(event) => setRemoveImage(event.target.checked)}
                  disabled={isSaving}
                />
                Remove current image when saving
              </label>
            )}

            <label className="editor-file-input">
              <span>
                {imageFile ? 'Choose a different image' : 'Upload an image'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImageChange}
                disabled={isSaving}
              />
            </label>

            <p className="field-hint">
              JPG, PNG, WebP, or GIF. Max 5 MB. Stored in
              storage/app/public/blogs.
            </p>

            {imageFile && (
              <p className="field-hint">
                {imageFile.name} · {Math.round(imageFile.size / 1024)} KB
              </p>
            )}

            {fieldErrors.featured_image && (
              <p className="field-error">
                {firstError(fieldErrors.featured_image)}
              </p>
            )}
          </section>
        </aside>
      </form>
    </div>
  )
}
