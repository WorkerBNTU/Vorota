// Лёгкая директива выравнивания для нашего упрощённого markdown-рендерера
// (MarkdownContent.jsx). Ставится первой строкой блока, например:
//   >>center
//   Текст абзаца по центру
// Символы ">>" не используются нигде больше в текущем парсере, поэтому
// не конфликтуют с обычным контентом.
export const ALIGN_DIRECTIVE_RE = /^>>\s*(left|center|right|justify)\s*\n?/i

export function extractBlockAlign(block) {
  const match = block.match(ALIGN_DIRECTIVE_RE)
  if (!match) return { align: null, rest: block }
  return { align: match[1].toLowerCase(), rest: block.slice(match[0].length) }
}

// Находит границы блока (абзаца/заголовка/списка), в котором сейчас
// находится курсор — блоки в тексте разделены пустой строкой.
export function findBlockRange(text, pos) {
  const before = text.slice(0, pos)
  const boundaryRe = /\n{2,}/g
  let start = 0
  let m
  while ((m = boundaryRe.exec(before))) {
    start = m.index + m[0].length
  }
  const afterMatch = text.slice(pos).match(/\n{2,}/)
  const end = afterMatch ? pos + afterMatch.index : text.length
  return { start, end }
}
