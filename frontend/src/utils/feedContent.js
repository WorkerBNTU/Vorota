// Разбор markdown-контента страниц типа «Новости»/«Акции»/«Отзывы»
// (ContentPage.page_type = news | promotions | testimonials) на отдельные
// карточки/пункты вместо сплошного текста.
//
// Конвенция разметки (её же нужно объяснять в подсказке над редактором —
// см. frontend/src/admin/AdminCatalog.jsx):
//
//   ## Заголовок страницы            — необязательный, просто пропускается
//                                       (заголовок и так есть в шапке страницы)
//
//   #### Заголовок пункта            — начало новости/акции/отзыва
//                                       (уровень решёток 3–6, т.е. от ### до ######)
//
//   Текст пункта в один или несколько абзацев.
//
//   31.05.2018                       — дата пункта (новости), отдельной строкой
//   01.05.2026 – 15.06.2026           — период действия (акции), отдельной строкой
//
// Для отзывов вместо даты используется автор в заголовке: «Имя, Город».

const SINGLE_DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/
const DATE_RANGE_RE = /^(\d{2}\.\d{2}\.\d{4})\s*[–—-]\s*(\d{2}\.\d{2}\.\d{4})$/
const HEADING_RE = /^(#{1,6})\s+(.*)$/

function parseRuDate(str) {
  const m = str.match(SINGLE_DATE_RE)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  return Number.isNaN(d.getTime()) ? null : d
}

function splitBlocks(content) {
  return (content || '')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
}

/**
 * Разбирает контент на пункты ленты (новости/акции).
 * @returns {Array<{ title: string, body: string, date: Date|null, dateLabel: string,
 *   endDate: Date|null, isExpired: boolean }>}
 */
export function parseFeedItems(content) {
  const blocks = splitBlocks(content)
  const items = []
  let current = null

  const pushCurrent = () => {
    if (current) items.push(current)
    current = null
  }

  blocks.forEach((block) => {
    const heading = block.match(HEADING_RE)
    if (heading) {
      const level = heading[1].length
      if (level <= 2 && !current && items.length === 0) {
        // Заголовок самой страницы (## Новости) — пропускаем, он и так
        // отображается в шапке страницы.
        return
      }
      pushCurrent()
      current = { title: heading[2].trim(), body: '', date: null, dateLabel: '', endDate: null }
      return
    }

    const range = block.match(DATE_RANGE_RE)
    const single = SINGLE_DATE_RE.test(block)
    if (current && (range || single)) {
      if (range) {
        current.date = parseRuDate(range[1])
        current.endDate = parseRuDate(range[2])
        current.dateLabel = `${range[1]} – ${range[2]}`
      } else {
        current.date = parseRuDate(block)
        current.dateLabel = block
      }
      return
    }

    if (!current) {
      // Контент без заголовков-пунктов (например, ещё не переоформленный
      // текст) — показываем как один пункт целиком, чтобы ничего не терять.
      current = { title: '', body: block, date: null, dateLabel: '', endDate: null }
      return
    }
    current.body = current.body ? `${current.body}\n\n${block}` : block
  })
  pushCurrent()

  const today = new Date()
  items.forEach((item) => {
    item.isExpired = !!(item.endDate && item.endDate < today)
  })

  // Свежие сверху; пункты без даты — в конец, в порядке появления в тексте.
  return items
    .map((item, index) => ({ ...item, index }))
    .sort((a, b) => {
      if (a.date && b.date) return b.date - a.date
      if (a.date) return -1
      if (b.date) return 1
      return a.index - b.index
    })
}

/**
 * Разбирает контент страницы «Отзывы» на карточки с автором.
 * @returns {Array<{ name: string, city: string, body: string }>}
 */
export function parseTestimonials(content) {
  const blocks = splitBlocks(content)
  const items = []
  let current = null

  const pushCurrent = () => {
    if (current) items.push(current)
    current = null
  }

  blocks.forEach((block) => {
    const heading = block.match(HEADING_RE)
    if (heading) {
      const level = heading[1].length
      if (level <= 2 && !current && items.length === 0) return
      pushCurrent()
      const [namePart, ...rest] = heading[2].split(',')
      current = { name: namePart.trim(), city: rest.join(',').trim(), body: '' }
      return
    }
    if (!current) {
      current = { name: '', city: '', body: block }
      return
    }
    current.body = current.body ? `${current.body}\n\n${block}` : block
  })
  pushCurrent()

  return items
}
