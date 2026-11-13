import { Link, NavLink } from 'react-router-dom'

type HeaderProps = {
  onDonate: () => void
}

function navClass({ isActive }: { isActive: boolean }) {
  return `btn ${isActive ? 'btn-primary' : 'btn-secondary'} header-link`
}

export default function Header({ onDonate }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="container nav-bar">
        <Link to="/" className="brand brand-button" aria-label="Pawly home">
          <span className="brand-mark">🐾</span>
          <div className="brand-copy">
            <strong>Pawly</strong>
          </div>
        </Link>

        <div className="header-actions">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/about" className={navClass}>
            About Me
          </NavLink>
          <NavLink to="/blogs" className={navClass}>
            Blogs
          </NavLink>
          <button type="button" className="btn btn-primary nav-cta" onClick={onDonate}>
            Donate
          </button>
        </div>
      </div>
    </header>
  )
}
