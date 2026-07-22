import { Link } from 'react-router-dom'
import { extractBlockAlign } from '../utils/markdownBlocks'
import './MarkdownContent.css'

function renderInline(text) {
  const parts = []
  let remaining = text
  let key = 0
  while (remaining) {
    const bold = remaining.match(/\*\*(.+?)\*\*/)
    const link = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)
    const match = !bold && !link ? null
      : !link ? bold
      : !bold ? link
      : bold.index <= link.index ? bold : link

    if (!match) {
      parts.push(remaining)
      break
    }
    if (match.index > 0) parts.push(remaining.slice(0, match.index))

    if (match === bold) {
      parts.push(<strong key={key++}>{match[1]}</strong>)
      remaining = remaining.slice(match.index + match[0].length)
    } else {
      const href = match[2]
      const isExternal = href.startsWith('http')
      parts.push(
        isExternal
          ? <a key={key++} href={href} target="_blank" rel="noopener noreferrer">{match[1]}</a>
          : <Link key={key++} to={href.startsWith('/') ? href : `/catalog/${href}`}>{match[1]}</Link>
      )
      remaining = remaining.slice(match.index + match[0].length)
    }
  }
  return parts
}

function splitCells(line) {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())
}

function isTableSeparator(line) {
  const cells = splitCells(line)
  return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c))
}

function tryParseTable(trimmed) {
  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return null
  if (!lines[0].includes('|') || !isTableSeparator(lines[1])) return null
  const headers = splitCells(lines[0])
  if (!headers.length) return null
  const rows = lines.slice(2).filter((l) => l.includes('|')).map(splitCells)
  return { headers, rows }
}

export default function MarkdownContent({ content }) {
  if (!content) return null

  const blocks = content.split(/\n{2,}/)
  const elements = []

  blocks.forEach((block, i) => {
    const { align, rest } = extractBlockAlign(block.trim())
    const trimmed = rest.trim()
    if (!trimmed) return
    const style = align ? { textAlign: align } : undefined

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = renderInline(headingMatch[2])
      if (level === 1) {
        elements.push(<h2 key={i} className="md-h1" style={style}>{text}</h2>)
      } else if (level === 2) {
        elements.push(<h2 key={i} style={style}>{text}</h2>)
      } else if (level === 3) {
        elements.push(<h3 key={i} style={style}>{text}</h3>)
      } else if (level === 4) {
        elements.push(<h4 key={i} style={style}>{text}</h4>)
      } else if (level === 5) {
        elements.push(<h5 key={i} style={style}>{text}</h5>)
      } else {
        elements.push(<h6 key={i} style={style}>{text}</h6>)
      }
      return
    }

    const table = tryParseTable(trimmed)
    if (table) {
      elements.push(
        <div key={i} className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>
                {table.headers.map((h, j) => (
                  <th key={j}>{renderInline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, r) => (
                <tr key={r}>
                  {table.headers.map((_, c) => (
                    <td key={c}>{renderInline(row[c] || '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      return
    }

    const lines = trimmed.split('\n')
    if (lines.every((l) => l.startsWith('- '))) {
      elements.push(
        <ul key={i} style={style}>
          {lines.map((l, j) => <li key={j}>{renderInline(l.slice(2))}</li>)}
        </ul>
      )
      return
    }

    elements.push(<p key={i} style={style}>{renderInline(trimmed.replace(/\n/g, ' '))}</p>)
  })

  return <div className="markdown-content">{elements}</div>
}
