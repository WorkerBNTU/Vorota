import { useRef, useState } from 'react'
import MarkdownContent from '../components/MarkdownContent'
import { extractBlockAlign, findBlockRange } from '../utils/markdownBlocks'
import './MarkdownEditor.css'

const TOOLBAR_ACTIONS = [
  { label: 'H2', title: 'Заголовок', wrap: (s) => `## ${s || 'Заголовок'}` },
  { label: 'H3', title: 'Подзаголовок', wrap: (s) => `### ${s || 'Подзаголовок'}` },
  { label: 'H4', title: 'Мелкий подзаголовок', wrap: (s) => `#### ${s || 'Мелкий подзаголовок'}` },
  { label: 'Ж', title: 'Жирный текст', wrap: (s) => `**${s || 'текст'}**` },
  { label: '• Список', title: 'Список', wrap: (s) => (s ? s.split('\n').map((l) => `- ${l}`).join('\n') : '- пункт списка') },
  { label: 'Ссылка', title: 'Ссылка', wrap: (s) => `[${s || 'текст ссылки'}](https://)` },
]

const ALIGN_ACTIONS = [
  { align: 'left', label: '⇤', title: 'По левому краю' },
  { align: 'center', label: '⇔', title: 'По центру' },
  { align: 'right', label: '⇥', title: 'По правому краю' },
  { align: 'justify', label: '☰', title: 'По ширине' },
]

// Живой предпросмотр использует тот же компонент MarkdownContent, что и
// публичная страница каталога (frontend/src/pages/CatalogPage.jsx), поэтому
// внешний вид блока текста здесь совпадает с тем, что увидит посетитель сайта.
export default function MarkdownEditor({ value, onChange, rows = 10 }) {
  const [mode, setMode] = useState('split') // split | edit | preview
  const [currentAlign, setCurrentAlign] = useState(null)
  const textareaRef = useRef(null)

  const applyAction = (action) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = value || ''
    const selected = current.slice(start, end)
    const inserted = action.wrap(selected)
    const next = current.slice(0, start) + inserted + current.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = start + inserted.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  const refreshCurrentAlign = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    const current = value || ''
    const { start, end } = findBlockRange(current, textarea.selectionStart)
    const { align } = extractBlockAlign(current.slice(start, end).trimStart())
    setCurrentAlign(align || 'left')
  }

  // Выравнивание применяется целиком к блоку (абзацу/заголовку/списку), в
  // котором сейчас стоит курсор — блок определяется по пустым строкам
  // вокруг него. Директива хранится первой строкой блока (см. markdownBlocks.js).
  const applyAlign = (align) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const current = value || ''
    const pos = textarea.selectionStart
    const { start, end } = findBlockRange(current, pos)
    const block = current.slice(start, end)
    const leadingWs = block.match(/^\s*/)[0]
    const { align: existingAlign, rest } = extractBlockAlign(block.slice(leadingWs.length))
    const body = rest.replace(/^\s+/, '')
    if (!body) return

    const nextAlign = existingAlign === align || align === 'left' ? null : align
    const newBlock = leadingWs + (nextAlign ? `>>${nextAlign}\n` : '') + body
    const next = current.slice(0, start) + newBlock + current.slice(end)
    const cursorShift = newBlock.length - block.length
    onChange(next)
    setCurrentAlign(nextAlign || 'left')
    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = Math.max(start, pos + cursorShift)
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <div className="md-editor">
      <div className="md-editor-toolbar">
        <div className="md-editor-toolbar-actions">
          {TOOLBAR_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              className="md-editor-btn"
              title={action.title}
              onClick={() => applyAction(action)}
            >
              {action.label}
            </button>
          ))}
          <span className="md-editor-sep" />
          {ALIGN_ACTIONS.map((action) => (
            <button
              key={action.align}
              type="button"
              className={`md-editor-btn ${currentAlign === action.align ? 'active' : ''}`}
              title={action.title}
              onClick={() => applyAlign(action.align)}
            >
              {action.label}
            </button>
          ))}
        </div>
        <div className="md-editor-toolbar-modes">
          <button type="button" className={`md-editor-mode ${mode === 'edit' ? 'active' : ''}`} onClick={() => setMode('edit')}>Код</button>
          <button type="button" className={`md-editor-mode ${mode === 'split' ? 'active' : ''}`} onClick={() => setMode('split')}>Разделить</button>
          <button type="button" className={`md-editor-mode ${mode === 'preview' ? 'active' : ''}`} onClick={() => setMode('preview')}>Превью</button>
        </div>
      </div>

      <div className={`md-editor-panes md-editor-panes--${mode}`}>
        {mode !== 'preview' && (
          <textarea
            ref={textareaRef}
            className="md-editor-textarea"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onSelect={refreshCurrentAlign}
            onClick={refreshCurrentAlign}
            onKeyUp={refreshCurrentAlign}
            rows={rows}
            placeholder="## Заголовок&#10;&#10;Текст абзаца. **Жирный текст**, [ссылка](https://)&#10;&#10;- пункт списка&#10;- ещё пункт"
          />
        )}
        {mode !== 'edit' && (
          <div className="md-editor-preview">
            {value
              ? <MarkdownContent content={value} />
              : <p className="md-editor-preview-empty">Здесь появится предпросмотр — так текст будет выглядеть на странице сайта</p>}
          </div>
        )}
      </div>
    </div>
  )
}
