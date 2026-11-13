import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { fetchPublicHome } from '../api/home'
import { fetchPublicPosts } from '../api/posts'
import { formatDate } from '../utils/format'

type HomeContent = {
  hero_title: string
  hero_description: string
  stat_rescued_value: string
  stat_rescued_label: string
  stat_placed_value: string
  stat_placed_label: string
  stat_support_value: string
  stat_support_label: string
  rescue_title: string
  rescue_description: string
  restore_title: string
  restore_description: string
  rehome_title: string
  rehome_description: string
}

// Used until the API responds and as a safe fallback if it is unavailable.
// The same copy lives in the database so the CMS stays the source of truth.
const DEFAULT_HOME: HomeContent = {
  hero_title: 'We rescue dogs and help them find home.',
  hero_description:
    'Pawly is a modern dog rescue nonprofit focused on safe shelter, compassionate care, and long-term adoption support for vulnerable dogs.',
  stat_rescued_value: '2.4k+',
  stat_rescued_label: 'Dogs rescued',
  stat_placed_value: '94%',
  stat_placed_label: 'Placed home',
  stat_support_value: '24/7',
  stat_support_label: 'Care support',
  rescue_title: 'Rescue',
  rescue_description:
    'We bring in dogs in urgent need and provide immediate safety and medical care.',
  restore_title: 'Restore',
  restore_description:
    'Our foster community helps each dog heal physically and emotionally in a calm home.',
  rehome_title: 'Rehome',
  rehome_description:
    'We match every dog with a loving family using thoughtful, lasting adoption support.',
}

const missionIcons = ['🐶', '💛', '🏡']

type BlogPreviewPost = {
  id: number
  title: string
  slug: string
  excerpt: string | null
  featured_image_url: string | null
  published_at: string | null
}

type PublicOutletContext = {
  onDonate: () => void
  donationTotalCents: number | null
}

export default function Homepage() {
  const { onDonate, donationTotalCents } = useOutletContext<PublicOutletContext>()
  const [posts, setPosts] = useState<BlogPreviewPost[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [postsError, setPostsError] = useState('')

  // Show the three newest published stories on the homepage. The public API
  // already filters out drafts and posts whose publish date is in the future.
  useEffect(() => {
    let isActive = true

    fetchPublicPosts({ page: 1, perPage: 3 })
      .then((payload) => {
        if (!isActive) return

        setPosts(payload?.data ?? [])
        setPostsError('')
      })
      .catch(() => {
        if (!isActive) return

        setPosts([])
        setPostsError('Unable to load the latest stories right now.')
      })
      .finally(() => {
        if (isActive) {
          setPostsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  // Load the single homepage content row from the API. The database is the
  // source of truth; fall back to DEFAULT_HOME if the request fails.
  const [home, setHome] = useState<HomeContent>(DEFAULT_HOME)
  const [homeLoading, setHomeLoading] = useState(true)
  const [homeError, setHomeError] = useState('')

  useEffect(() => {
    let isActive = true

    fetchPublicHome()
      .then((payload) => {
        if (!isActive) return
        setHome(payload?.data ?? DEFAULT_HOME)
        setHomeLoading(false)
      })
      .catch(() => {
        if (!isActive) return
        setHomeLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  // Build displayed stats from the API homepage content (fall back to
  // DEFAULT_HOME values so the UI never breaks even if the API is slow).
  const effectiveHome = home ?? DEFAULT_HOME
  const displayedStats = [
    {
      value: effectiveHome.stat_rescued_value,
      label: effectiveHome.stat_rescued_label,
    },
    {
      value: effectiveHome.stat_placed_value,
      label: effectiveHome.stat_placed_label,
    },
    {
      value: effectiveHome.stat_support_value,
      label: effectiveHome.stat_support_label,
    },
    {
      value:
        donationTotalCents === null
          ? '—'
          : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
              donationTotalCents / 100,
            ),
      label: 'Total donated',
    },
  ]

  return (
    <main id="home">
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Every dog deserves a second chance</p>
            <h1>{effectiveHome.hero_title}</h1>
            <p className="hero-text">
              {effectiveHome.hero_description}
            </p>

            <div className="hero-actions">
              <a href="#stories" className="btn btn-primary">
                Read our stories
              </a>
              <a href="#mission" className="btn btn-secondary">
                Learn More
              </a>
            </div>

            <div className="stats-row" aria-label="Organization statistics">
              {displayedStats.map((stat) => (
                <div key={stat.label} className="stat-box">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual" aria-label="Happy rescued dog">
            <img
              src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80"
              alt="Happy rescued dog"
            />
            <div className="floating-card card-top">
              <span>4.9/5 rescue experience</span>
            </div>
            <div className="floating-card card-bottom">
              <strong>12 dogs</strong>
              <span>ready for adoption</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mission-section" id="mission">
        <div className="container section-header">
          <p className="eyebrow dark">Our mission</p>
          <h2>Simple care, real change.</h2>
        </div>

        <div className="container mission-grid">
          {[
            {
              title: effectiveHome.rescue_title,
              icon: '🐶',
              description: effectiveHome.rescue_description,
            },
            {
              title: effectiveHome.restore_title,
              icon: '💛',
              description: effectiveHome.restore_description,
            },
            {
              title: effectiveHome.rehome_title,
              icon: '🏡',
              description: effectiveHome.rehome_description,
            },
          ].map((card) => (
            <article key={card.title} className="mission-card">
              <div className="icon-wrap" aria-hidden="true">
                {card.icon}
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="adoption-section" id="stories">
        <div className="container section-header split-heading">
          <div>
            <p className="eyebrow dark">From the blog</p>
            <h2>Stories from the rescue.</h2>
          </div>
          <Link to="/blogs" className="btn btn-primary">
            View all blogs
          </Link>
        </div>

        {postsLoading ? (
          <div className="container dog-grid" aria-hidden="true">
            {[0, 1, 2].map((key) => (
              <div key={key} className="dog-card blog-card-skeleton">
                <div className="skeleton-media" />
                <div className="skeleton-body">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ))}
          </div>
        ) : postsError ? (
          <div className="container blog-preview-empty">
            <p>
              {postsError}{' '}
              <Link to="/blogs">Visit the blog to read our stories.</Link>
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="container blog-preview-empty">
            <p>
              New stories are on the way.{' '}
              <Link to="/blogs">Visit the blog</Link> to see what we have shared
              so far.
            </p>
          </div>
        ) : (
          <div className="container dog-grid">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blogs/${post.slug}`}
                className="dog-card dog-card-link"
              >
                {post.featured_image_url ? (
                  <img src={post.featured_image_url} alt={post.title} />
                ) : (
                  <div className="dog-card-placeholder" aria-hidden="true">
                    🐾
                  </div>
                )}

                <div className="dog-info">
                  <div className="dog-name-row">
                    <h3>{post.title}</h3>
                    <span>{formatDate(post.published_at, { month: 'short' })}</span>
                  </div>
                  <p>
                    {post.excerpt ||
                      'Read the full story from the Pawly rescue community.'}
                  </p>
                  <span className="dog-card-more">Read story →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="cta-section" id="about">
        <div className="container cta-box">
          <div>
            <p className="eyebrow">Support the mission</p>
            <h2>Help us give dogs the care, comfort, and safety they deserve.</h2>
          </div>
          <button type="button" className="btn btn-primary" onClick={onDonate}>
            Donate now
          </button>
        </div>
      </section>
    </main>
  )
}