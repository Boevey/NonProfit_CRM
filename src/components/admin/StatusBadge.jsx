export default function StatusBadge({ status }) {
  const isPublished = status === 'published'

  return (
    <span
      className={`status-badge ${isPublished ? 'status-published' : 'status-draft'}`}
    >
      <span className="status-dot" aria-hidden="true" />
      {isPublished ? 'Published' : 'Draft'}
    </span>
  )
}
