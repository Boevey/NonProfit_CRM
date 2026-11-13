import aboutMeContent from '../data/aboutMe.json'

type TeamMember = {
  name: string
  role: string
  bio: string
  image?: string
  focusArea?: string
  location?: string
  email?: string
}

const aboutMe = aboutMeContent as {
  name: string
  role: string
  bio: string
  focusArea: string
  location: string
  email: string
  story: string[]
  image?: string
  members: TeamMember[]
  values: Array<{ title: string; text: string }>
}

// The founder is stored separately in the JSON (with the embedded portrait),
// so combine them into the same shape as the rest of the team.
const team: TeamMember[] = [
  {
    name: aboutMe.name,
    role: aboutMe.role,
    bio: aboutMe.bio,
    image: aboutMe.image,
    focusArea: aboutMe.focusArea,
    location: aboutMe.location,
    email: aboutMe.email,
  },
  ...aboutMe.members,
]

const valueIcons = ['❤', '✦', '🏠']

export default function AboutMe() {
  return (
    <section className="about-section" id="about">
      <div className="container about-team-header">
        <p className="eyebrow dark">Meet the team</p>
        <h2>Six people, one mission.</h2>
        <p>
          Pawly is powered by a small, hands-on team of rescuers, foster
          coordinators, veterinary partners, and storytellers who believe every
          dog deserves a safe place to heal and a family to call home.
        </p>
      </div>

      <div className="container team-grid">
        {team.map((member) => (
          <article key={member.name} className="team-card">
            <div className="team-photo">
              {member.image ? (
                <img src={member.image} alt={member.name} />
              ) : (
                <span className="team-photo-placeholder" aria-hidden="true">
                  🐾
                </span>
              )}
            </div>

            <div className="team-copy">
              <h3>{member.name}</h3>
              <p className="team-role">{member.role}</p>
              <p className="team-bio">{member.bio}</p>

              <div className="team-meta">
                {member.focusArea && <span>{member.focusArea}</span>}
                {member.location && <span>{member.location}</span>}
              </div>

              {member.email && (
                <a className="team-email" href={`mailto:${member.email}`}>
                  {member.email}
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="container values-section">
        <div className="values-header">
          <p className="eyebrow">Our mission</p>
          <h3>What guides every rescue and every adoption.</h3>
        </div>

        <div className="values-grid">
          {aboutMe.values.map((point, index) => (
            <article key={point.title} className="value-card">
              <span className="value-icon" aria-hidden="true">
                {valueIcons[index] ?? '🐾'}
              </span>
              <h4>{point.title}</h4>
              <p>{point.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
