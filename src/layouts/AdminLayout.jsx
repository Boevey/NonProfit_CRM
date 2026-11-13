import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth-context'

function navClass({ isActive }) {
  return `admin-nav-link${isActive ? ' is-active' : ''}`
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const initials = (user?.name ?? 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  async function handleLogout() {
    setIsLoggingOut(true)
    setLogoutError('')

    try {
      await logout()
      navigate('/admin/login', { replace: true })
    } catch (error) {
      setLogoutError(error?.message ?? 'Unable to sign out right now.')
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/admin/blogs" className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true">
            🐾
          </span>
          <span className="admin-brand-copy">
            <strong>Pawly</strong>
            <small>Content studio</small>
          </span>
        </Link>

        <nav className="admin-nav" aria-label="CMS navigation">
          <NavLink to="/admin/blogs" end className={navClass}>
            <span aria-hidden="true">📝</span> All posts
          </NavLink>
          <NavLink to="/admin/blogs/new" className={navClass}>
            <span aria-hidden="true">✚</span> New post
          </NavLink>
          <Link to="/blogs" className="admin-nav-link">
            <span aria-hidden="true">↗</span> View public site
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <span className="admin-avatar" aria-hidden="true">
              {initials || 'A'}
            </span>
            <span className="admin-user-copy">
              <strong>{user?.name ?? 'Administrator'}</strong>
              <small>{user?.email}</small>
            </span>
          </div>

          {logoutError && (
            <p className="admin-logout-error" role="alert">
              {logoutError}
            </p>
          )}

          <button
            type="button"
            className="admin-logout"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="admin-main-wrap">
        <Outlet />
      </div>
    </div>
  )
}
