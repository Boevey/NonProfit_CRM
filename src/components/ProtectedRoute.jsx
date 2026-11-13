import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth-context'

/**
 * Guards every /admin/* route except /admin/login.
 *
 * While the Sanctum session is being restored we show a small loader instead
 * of redirecting, which avoids a login-page flash on refresh.
 */
export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="route-loader" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        Checking your session…
      </div>
    )
  }

  if (!user || !user.is_admin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location }}
      />
    )
  }

  return <Outlet />
}
