import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'

function firstError(value) {
  return Array.isArray(value) ? value[0] : value
}

export default function AdminLoginPage() {
  const { user, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Admin sign in | Pawly CMS'
  }, [])

  if (!isLoading && user) {
    return <Navigate to="/admin/blogs" replace />
  }

  if (isLoading) {
    return (
      <div className="admin-login-loading" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        Checking your session…
      </div>
    )
  }

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({ ...current, [name]: value }))

    if (fieldErrors[name]) {
      setFieldErrors((current) => {
        const next = { ...current }
        delete next[name]
        return next
      })
    }
  }

  function validate() {
    const errors = {}

    if (!form.email.trim()) {
      errors.email = 'Email is required.'
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address.'
    }

    if (!form.password) {
      errors.password = 'Password is required.'
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }

    setFieldErrors(errors)

    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      })

      const from = location.state?.from?.pathname
      const destination =
        from && from.startsWith('/admin') && from !== '/admin/login'
          ? from
          : '/admin/blogs'

      navigate(destination, { replace: true })
    } catch (error) {
      setFieldErrors(error?.errors ?? {})

      const serverMessage =
        firstError(error?.errors?.email) ||
        firstError(error?.errors?.password) ||
        error?.message ||
        'Unable to sign in right now.'

      setFormError(serverMessage)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="admin-login-page">
      <section className="admin-login-brand-panel">
        <Link to="/" className="admin-login-logo">
          <span aria-hidden="true">🐾</span>
          <strong>Pawly</strong>
        </Link>

        <div className="admin-login-brand-copy">
          <p className="eyebrow">Content studio</p>
          <h1>Tell the stories that bring dogs home.</h1>
          <p>
            Sign in to write, edit, and publish updates for the Pawly
            community.
          </p>
        </div>

        <Link to="/" className="admin-login-back">
          ← Back to website
        </Link>
      </section>

      <section className="admin-login-panel">
        <div className="admin-login-card">
          <p className="eyebrow dark">Administrator access</p>
          <h2>Welcome back</h2>
          <p className="admin-login-subtitle">
            Sign in to manage blog posts and drafts.
          </p>

          {formError && (
            <p className="form-message" role="alert">
              {formError}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={
                  fieldErrors.email ? 'admin-email-error' : undefined
                }
              />
              {fieldErrors.email && (
                <p id="admin-email-error" className="field-error">
                  {firstError(fieldErrors.email)}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="admin-password">Password</label>
              <div className="password-input">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password ? 'admin-password-error' : undefined
                  }
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="admin-password-error" className="field-error">
                  {firstError(fieldErrors.password)}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary admin-login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {import.meta.env.DEV && (
            <p className="admin-demo-hint">
              Local seed account: <code>admin@pawlyrescue.org</code> /{' '}
              <code>password</code>
            </p>
          )}

          <p className="admin-login-help">
            Need access? Contact the site owner to be added as an administrator.
          </p>
        </div>
      </section>
    </div>
  )
}
