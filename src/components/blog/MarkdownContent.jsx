import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renders trusted CMS markdown. react-markdown escapes raw HTML by default,
 * so administrators cannot inject scripts into the public site.
 */
export default function MarkdownContent({ content, className = '' }) {
  if (!content) {
    return null
  }

  return (
    <div className={`markdown-body ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
