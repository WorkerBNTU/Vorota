import { useState, useEffect } from 'react'
import { api } from '../api'
import MarkdownEditor from './MarkdownEditor'
import SeoFields from './SeoFields'
import useScrollOnOpen from './useScrollOnOpen'
import ImagePicker from './ImagePicker'
import { appendImagePick } from './imagePickerUtils'

const PAGE_TYPES = [
  { value: 'overview', label: 'Обзор' },
  { value: 'page', label: 'Страница' },
  { value: 'product', label: 'Товар' },
  { value: 'service', label: 'Услуга' },
  { value: 'article', label: 'Статья' },
  { value: 'news', label: 'Новости (лента)' },
  { value: 'promotions', label: 'Акции (лента)' },
  { value: 'testimonials', label: 'Отзывы (карточки)' },
]

// Для лент/карточек контент в поле «Содержимое» — это не простой текст, а
// набор пунктов по конвенции (см. frontend/src/utils/feedContent.js). Первый
// заголовок «## …» необязателен и просто пропускается при отображении.
const PAGE_TYPE_HINTS = {
  news: {
    title: 'Формат для ленты новостей',
    example: '#### Заголовок новости\n\nТекст новости.\n\n31.05.2026',
    note: 'Каждый пункт начинается с заголовка (####), затем текст, затем дата в формате ДД.ММ.ГГГГ отдельной строкой. Пункты сортируются по дате — новые сверху.',
  },
  promotions: {
    title: 'Формат для ленты акций',
    example: '#### Заголовок акции\n\nУсловия акции.\n\n01.07.2026 – 30.09.2026',
    note: 'Как и у новостей, но вместо одной даты — период действия через « – ». Если конечная дата в прошлом, на сайте акция помечается как завершённая.',
  },
  testimonials: {
    title: 'Формат для карточек отзывов',
    example: '#### Имя Фамилия, Город\n\nТекст отзыва.',
    note: 'Заголовок — это имя автора (и через запятую — город, необязательно), дальше текст отзыва. Карточки выводятся в сетке в том же порядке.',
  },
}

export default function AdminCatalog() {
  const [tab, setTab] = useState('pages')
  const [sections, setSections] = useState([])
  const [pages, setPages] = useState([])
  const [filterSection, setFilterSection] = useState('')
  const [search, setSearch] = useState('')
  const [editingSection, setEditingSection] = useState(null)
  const [editingPage, setEditingPage] = useState(null)
  const [sectionForm, setSectionForm] = useState({})
  const [pageForm, setPageForm] = useState({})
  const [gallery, setGallery] = useState([])
  const [galleryForm, setGalleryForm] = useState({ external_image_url: '', caption: '', order: 0, role: 'variant' })
  const [galleryResetKey, setGalleryResetKey] = useState(0)
  const sectionFormRef = useScrollOnOpen(editingSection)
  const pageFormRef = useScrollOnOpen(editingPage)

  const loadSections = () => api.adminList('content-sections').then((d) => setSections(d.results || d)).catch(() => {})
  const loadPages = () => {
    const params = {}
    if (filterSection) params.section = filterSection
    if (search) params.search = search
    return api.adminList('content-pages', params).then((d) => setPages(d.results || d)).catch(() => {})
  }

  useEffect(() => { loadSections() }, [])
  useEffect(() => { loadPages() }, [filterSection, search])

  const startEditSection = (item = null) => {
    setEditingSection(item?.id || 'new')
    setSectionForm(item || {
      slug: '', title: '', description: '', icon: '📁', order: 0, show_in_menu: true, is_active: true,
    })
  }

  const startEditPage = (item = null) => {
    setEditingPage(item?.id || 'new')
    setPageForm(item || {
      section: sections[0]?.id || '', parent: '', slug: '', title: '', page_type: 'page',
      content: '', excerpt: '', price: '', manufacturer: '', model: '', availability: '',
      external_image_url: '', show_in_menu: true, order: 0, is_active: true,
    })
    setGalleryForm({ external_image_url: '', caption: '', order: 0, role: 'variant' })
    if (item?.id) loadGallery(item.id)
    else setGallery([])
  }

  const loadGallery = (pageId) =>
    api.adminList('content-page-images', { page: pageId }).then((d) => setGallery(d.results || d)).catch(() => {})

  const addGalleryImage = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('page', editingPage)
    fd.append('caption', galleryForm.caption || '')
    fd.append('order', galleryForm.order || 0)
    if (galleryForm.role) fd.append('role', galleryForm.role)
    const picked = appendImagePick(fd, e.target, 'image')
    if (!picked) {
      if (galleryForm.external_image_url) fd.append('external_image_url', galleryForm.external_image_url)
      else return
    }
    await api.adminCreate('content-page-images', fd)
    setGalleryForm({ external_image_url: '', caption: '', order: 0, role: 'variant' })
    setGalleryResetKey((k) => k + 1)
    loadGallery(editingPage)
  }

  const deleteGalleryImage = async (id) => {
    await api.adminDelete('content-page-images', id)
    loadGallery(editingPage)
  }

  const saveSection = async (e) => {
    e.preventDefault()
    const data = { ...sectionForm }
    if (editingSection === 'new') await api.adminCreate('content-sections', data)
    else await api.adminUpdate('content-sections', editingSection, data)
    setEditingSection(null)
    loadSections()
  }

  const savePage = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(pageForm).forEach(([k, v]) => {
      if (k.endsWith('_url') || k === 'section_title' || k === 'parent_title' || k === 'image_url') return
      if (typeof v === 'boolean') fd.append(k, v)
      else if (v !== null && v !== undefined && v !== '') fd.append(k, v)
    })
    if (pageForm.parent === '' || pageForm.parent === null) fd.delete('parent')
    appendImagePick(fd, e.target, 'image')

    if (editingPage === 'new') await api.adminCreate('content-pages', fd)
    else await api.adminUpdate('content-pages', editingPage, fd)

    setEditingPage(null)
    loadPages()
  }

  const deleteSection = async (id) => {
    if (!confirm('Удалить раздел и все его страницы?')) return
    await api.adminDelete('content-sections', id)
    loadSections()
    loadPages()
  }

  const deletePage = async (id) => {
    if (!confirm('Удалить страницу?')) return
    await api.adminDelete('content-pages', id)
    loadPages()
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button className={`btn btn-sm ${tab === 'pages' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('pages')}>
          Страницы каталога
        </button>
        <button className={`btn btn-sm ${tab === 'sections' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('sections')}>
          Разделы меню
        </button>
      </div>

      {tab === 'sections' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => startEditSection()}>+ Добавить раздел</button>
          </div>
          <div className="admin-card" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr><th>Раздел</th><th>URL</th><th>Порядок</th><th>В меню</th><th>Активен</th><th></th></tr>
              </thead>
              <tbody>
                {sections.map((s) => (
                  <tr key={s.id}>
                    <td>{s.icon} {s.title}</td>
                    <td><code>{s.slug}</code></td>
                    <td>{s.order}</td>
                    <td>{s.show_in_menu ? '✓' : '—'}</td>
                    <td>{s.is_active ? '✓' : '—'}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" style={{ marginRight: 8 }} onClick={() => startEditSection(s)}>Изменить</button>
                      <button className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => deleteSection(s.id)}>Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editingSection && (
            <div className="admin-card" style={{ marginTop: 16 }} ref={sectionFormRef}>
              <h3>{editingSection === 'new' ? 'Новый раздел' : 'Редактирование раздела'}</h3>
              <form onSubmit={saveSection}>
                {['slug', 'title', 'icon', 'description', 'order'].map((f) => (
                  <div key={f} className="form-group">
                    <label>{f}</label>
                    {f === 'description'
                      ? <textarea value={sectionForm[f] || ''} onChange={(e) => setSectionForm({ ...sectionForm, [f]: e.target.value })} rows={3} />
                      : <input value={sectionForm[f] ?? ''} onChange={(e) => setSectionForm({ ...sectionForm, [f]: e.target.value })} />}
                  </div>
                ))}
                <label><input type="checkbox" checked={sectionForm.show_in_menu} onChange={(e) => setSectionForm({ ...sectionForm, show_in_menu: e.target.checked })} /> В меню</label>
                <label style={{ marginLeft: 16 }}><input type="checkbox" checked={sectionForm.is_active} onChange={(e) => setSectionForm({ ...sectionForm, is_active: e.target.checked })} /> Активен</label>
                <div style={{ marginTop: 16 }}>
                  <button type="submit" className="btn btn-primary btn-sm">Сохранить</button>
                  <button type="button" className="btn btn-outline btn-sm" style={{ marginLeft: 8 }} onClick={() => setEditingSection(null)}>Отмена</button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {tab === 'pages' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={() => startEditPage()}>+ Добавить страницу</button>
            <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
              <option value="">Все разделы</option>
              {sections.map((s) => <option key={s.id} value={s.slug}>{s.title}</option>)}
            </select>
            <input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '6px 12px' }} />
          </div>

          <div className="admin-card" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr><th>Страница</th><th>Раздел</th><th>Тип</th><th>Цена</th><th>В меню</th><th></th></tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div>{p.title}</div>
                      <code style={{ fontSize: '0.75rem', opacity: 0.7 }}>{p.slug}</code>
                    </td>
                    <td>{p.section_title}</td>
                    <td>{p.page_type}</td>
                    <td>{p.price ? `${p.price} р.` : '—'}</td>
                    <td>{p.show_in_menu ? '✓' : '—'}</td>
                    <td>
                      <a href={`/catalog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ marginRight: 8 }}>Открыть</a>
                      <button className="btn btn-outline btn-sm" style={{ marginRight: 8 }} onClick={() => startEditPage(p)}>Изменить</button>
                      <button className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => deletePage(p.id)}>Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editingPage && (
            <div className="admin-card" style={{ marginTop: 16 }} ref={pageFormRef}>
              <h3>{editingPage === 'new' ? 'Новая страница' : 'Редактирование страницы'}</h3>
              <form onSubmit={savePage}>
                <div className="form-group">
                  <label>Раздел</label>
                  <select value={pageForm.section || ''} onChange={(e) => setPageForm({ ...pageForm, section: Number(e.target.value) })} required>
                    {sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Родительская страница (необязательно)</label>
                  <select
                    value={pageForm.parent || ''}
                    onChange={(e) => setPageForm({ ...pageForm, parent: e.target.value })}
                  >
                    <option value="">— без родителя (верхний уровень раздела) —</option>
                    {pages
                      .filter((p) => p.id !== editingPage)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.slug})
                        </option>
                      ))}
                  </select>
                </div>
                {[
                  { name: 'slug', label: 'URL-путь (slug)', hint: 'например: vorota/obzor' },
                  { name: 'title', label: 'Заголовок' },
                  { name: 'excerpt', label: 'Краткое описание' },
                  { name: 'manufacturer', label: 'Производитель' },
                  { name: 'model', label: 'Модель' },
                  { name: 'availability', label: 'Наличие' },
                  { name: 'external_image_url', label: 'Внешняя ссылка на фото (если нет файла)', hint: 'https://...' },
                ].map((f) => (
                  <div key={f.name} className="form-group">
                    <label>{f.label}</label>
                    <input
                      value={pageForm[f.name] ?? ''}
                      onChange={(e) => setPageForm({ ...pageForm, [f.name]: e.target.value })}
                      placeholder={f.hint}
                    />
                  </div>
                ))}
                <div className="form-group">
                  <label>Цена (р.)</label>
                  <input type="number" min="0" step="0.01" value={pageForm.price ?? ''} onChange={(e) => setPageForm({ ...pageForm, price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Порядок в списке</label>
                  <input type="number" min="0" value={pageForm.order ?? 0} onChange={(e) => setPageForm({ ...pageForm, order: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Тип страницы</label>
                  <select value={pageForm.page_type} onChange={(e) => setPageForm({ ...pageForm, page_type: e.target.value })}>
                    {PAGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Содержимое (Markdown)</label>
                  {PAGE_TYPE_HINTS[pageForm.page_type] && (
                    <div className="page-type-hint">
                      <strong>{PAGE_TYPE_HINTS[pageForm.page_type].title}</strong>
                      <pre>{PAGE_TYPE_HINTS[pageForm.page_type].example}</pre>
                      <p>{PAGE_TYPE_HINTS[pageForm.page_type].note}</p>
                    </div>
                  )}
                  <MarkdownEditor
                    value={pageForm.content}
                    onChange={(content) => setPageForm({ ...pageForm, content })}
                  />
                </div>
                <SeoFields
                  metaTitle={pageForm.meta_title}
                  metaDescription={pageForm.meta_description}
                  onChangeTitle={(v) => setPageForm({ ...pageForm, meta_title: v })}
                  onChangeDescription={(v) => setPageForm({ ...pageForm, meta_description: v })}
                  titlePlaceholder={pageForm.title ? `Если пусто — «${pageForm.title}»` : undefined}
                  descriptionPlaceholder={pageForm.excerpt ? `Если пусто — «${pageForm.excerpt}»` : undefined}
                />
                <ImagePicker name="image" label="Изображение" currentUrl={pageForm.image_url} resetKey={editingPage} />
                <label><input type="checkbox" checked={pageForm.show_in_menu} onChange={(e) => setPageForm({ ...pageForm, show_in_menu: e.target.checked })} /> Показывать в меню</label>
                <label style={{ marginLeft: 16 }}><input type="checkbox" checked={pageForm.is_active} onChange={(e) => setPageForm({ ...pageForm, is_active: e.target.checked })} /> Активна</label>
                <div style={{ marginTop: 16 }}>
                  <button type="submit" className="btn btn-primary btn-sm">Сохранить</button>
                  <button type="button" className="btn btn-outline btn-sm" style={{ marginLeft: 8 }} onClick={() => setEditingPage(null)}>Отмена</button>
                </div>
              </form>

              {editingPage !== 'new' && (
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border, #e5e5e5)' }}>
                  <h4>Доп. изображения страницы</h4>
                  {gallery.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                      {gallery.map((g) => (
                        <div key={g.id} style={{ textAlign: 'center' }}>
                          <img src={g.image_url} alt={g.caption} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6, display: 'block' }} />
                          <div style={{ fontSize: '0.75rem', maxWidth: 100 }}>{g.caption || g.role}</div>
                          <button type="button" className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)', marginTop: 4 }} onClick={() => deleteGalleryImage(g.id)}>Удалить</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <form onSubmit={addGalleryImage} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <ImagePicker name="image" label="Файл (или выберите из уже загруженных)" resetKey={`${editingPage}-${galleryResetKey}`} />
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Роль</label>
                      <select value={galleryForm.role} onChange={(e) => setGalleryForm({ ...galleryForm, role: e.target.value })}>
                        <option value="variant">Вариант товара</option>
                        <option value="avatar">Аватар отзыва</option>
                        <option value="feed">Иллюстрация новости/акции</option>
                        <option value="inline">В тексте страницы</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>или ссылка на внешнее фото</label>
                      <input value={galleryForm.external_image_url} onChange={(e) => setGalleryForm({ ...galleryForm, external_image_url: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Подпись</label>
                      <input value={galleryForm.caption} onChange={(e) => setGalleryForm({ ...galleryForm, caption: e.target.value })} placeholder="напр. Белый" />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm">Добавить фото</button>
                  </form>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}
