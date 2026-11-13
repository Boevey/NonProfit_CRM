import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-simple">
        <div className="brand" aria-label="Pawly logo">
          <span className="brand-mark">🐾</span>
          <div className="brand-copy">
            <strong>Pawly</strong>
            <span>Dog Rescue</span>
          </div>
        </div>

        <div className="footer-contact">
          <p>Contact</p>
          <a href="mailto:hello@pawlyrescue.org">hello@pawlyrescue.org</a>
          <a href="tel:+15550199">(555) 0199</a>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© 2026 Pawly</span>
        <span>501 nonprofit organization</span>
        <Link to="/admin/login" className="footer-admin-link">
          Admin CMS
        </Link>
      </div>
    </footer>
  )
}
