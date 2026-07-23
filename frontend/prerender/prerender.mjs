// Обходит сайт headless-Chrome (Puppeteer), даёт React отрендериться и
// сделать все API-запросы, и сохраняет итоговый HTML на диск. Эти снапшоты
// отдаёт nginx поисковым роботам вместо пустого index.html (см. nginx.conf,
// "dynamic rendering") — обычные посетители продолжают получать обычный SPA.
//
// Список маршрутов берётся из уже существующего /sitemap.xml (см.
// backend/api/views.py SitemapView), поэтому отдельно поддерживать список
// страниц здесь не нужно — он всегда в актуальном состоянии.
//
// Запуск: BASE_URL=http://frontend node prerender.mjs
// (см. docker-compose.yml, сервис `prerender`, и README.md)

import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer'

const BASE_URL = (process.env.BASE_URL || 'http://localhost:5173').replace(/\/$/, '')
const OUT_DIR = process.env.OUT_DIR || path.resolve(process.cwd(), 'output')
const EXTRA_WAIT_MS = Number(process.env.PRERENDER_WAIT_MS || 500)
const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY || 4)
const NAV_TIMEOUT_MS = Number(process.env.PRERENDER_TIMEOUT_MS || 30000)

async function fetchRoutes(baseUrl) {
  const res = await fetch(`${baseUrl}/sitemap.xml`)
  if (!res.ok) {
    throw new Error(`Не удалось получить ${baseUrl}/sitemap.xml: HTTP ${res.status}`)
  }
  const xml = await res.text()
  const routes = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((m) => m[1].trim())
    .map((loc) => {
      try {
        return new URL(loc).pathname || '/'
      } catch {
        return null
      }
    })
    .filter(Boolean)

  return [...new Set(routes)]
}

function outFileFor(routePath) {
  if (routePath === '/') return path.join(OUT_DIR, 'index.html')
  const clean = routePath.replace(/\/+$/, '')
  return path.join(OUT_DIR, clean, 'index.html')
}

async function waitForRenderedContent(page) {
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root')
      if (!root || !root.childElementCount) return false
      const title = (document.title || '').trim()
      if (title.length < 3) return false
      const heading = document.querySelector('h1')
      return Boolean(heading && heading.textContent && heading.textContent.trim().length > 1)
    },
    { timeout: NAV_TIMEOUT_MS },
  )
}

async function prerenderRoute(browser, routePath) {
  const page = await browser.newPage()
  try {
    // domcontentloaded: Метрика/GA держат сеть «живой» и ломают networkidle0.
    // Контент ждём отдельно по #root + h1 + title.
    await page.goto(`${BASE_URL}${routePath}`, {
      waitUntil: 'domcontentloaded',
      timeout: NAV_TIMEOUT_MS,
    })
    await waitForRenderedContent(page)
    await new Promise((resolve) => setTimeout(resolve, EXTRA_WAIT_MS))

    const html = await page.content()
    if (!html.includes('<h1') || !/<title>[^<]{3,}<\/title>/i.test(html)) {
      throw new Error('В HTML нет осмысленного <title>/<h1> — страница не дорисовалась')
    }

    const outFile = outFileFor(routePath)
    await fs.mkdir(path.dirname(outFile), { recursive: true })
    await fs.writeFile(outFile, html, 'utf-8')
    console.log(`OK    ${routePath}`)
    return true
  } catch (err) {
    console.error(`FAIL  ${routePath}: ${err.message}`)
    return false
  } finally {
    await page.close()
  }
}

/** Удаляет index.html вне текущего sitemap (удалённые страницы каталога). */
async function removeOrphanSnapshots(routes) {
  const keep = new Set(routes.map((r) => path.resolve(outFileFor(r))))
  const orphans = []

  async function walk(dir) {
    let entries
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
        continue
      }
      if (entry.name === 'index.html' && !keep.has(path.resolve(full))) {
        orphans.push(full)
      }
    }
  }

  await walk(OUT_DIR)
  for (const file of orphans) {
    await fs.unlink(file)
    console.log(`PURGE ${path.relative(OUT_DIR, file)}`)
  }
  if (orphans.length) {
    console.log(`Удалено устаревших снапшотов: ${orphans.length}`)
  }
}

async function main() {
  console.log(`Base URL:    ${BASE_URL}`)
  console.log(`Output dir:  ${OUT_DIR}`)

  const routes = await fetchRoutes(BASE_URL)
  console.log(`Маршрутов найдено: ${routes.length}`)
  if (!routes.length) {
    throw new Error('Нечего пререндерить — sitemap.xml пуст.')
  }

  await fs.mkdir(OUT_DIR, { recursive: true })

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  let okCount = 0
  let failCount = 0
  let cursor = 0

  async function worker() {
    while (cursor < routes.length) {
      const route = routes[cursor++]
      const ok = await prerenderRoute(browser, route)
      if (ok) okCount += 1
      else failCount += 1
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, routes.length) }, worker))
  await browser.close()

  // Orphans чистим даже при частичных fail — иначе удалённые slug живут вечно.
  // Неудачные маршруты сохраняют прежний файл (мы его не трогали).
  await removeOrphanSnapshots(routes)

  console.log(`Готово: ${okCount} успешно, ${failCount} с ошибкой.`)
  if (failCount > 0) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('Пререндеринг завершился с ошибкой:', err)
  process.exitCode = 1
})
