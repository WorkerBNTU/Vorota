const TITLE_LIMIT = 60
const DESCRIPTION_LIMIT = 160

function CharCounter({ length, limit }) {
  const over = length > limit
  return (
    <span style={{ fontSize: '0.75rem', color: over ? 'var(--color-danger)' : 'var(--color-text-muted, #999)', marginLeft: 8 }}>
      {length}/{limit}
    </span>
  )
}

// Общий блок SEO-полей (meta_title/meta_description) — используется и для
// страниц каталога (AdminCatalog), и для настроек сайта/главной (AdminContent).
// Поля необязательны: если оставить пустыми, фронтенд подставит шаблоны
// «Купить … DoorHan» / «в Беларуси» (см. seoMeta.js / useSiteMeta.js).
export default function SeoFields({
  metaTitle,
  metaDescription,
  onChangeTitle,
  onChangeDescription,
  titlePlaceholder = 'Напр.: Купить секционные ворота DoorHan в Беларуси',
  descriptionPlaceholder = 'Минск, Витебск, Гомель… + бренд DoorHan, до ~160 символов',
}) {
  return (
    <fieldset style={{ border: '1px dashed var(--color-border, #d8d8d8)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
      <legend style={{ fontSize: '0.85rem', padding: '0 6px', color: 'var(--color-text-muted, #666)' }}>
        SEO (для поисковиков)
      </legend>
      <div className="form-group">
        <label>
          Meta title <CharCounter length={(metaTitle || '').length} limit={TITLE_LIMIT} />
        </label>
        <input
          value={metaTitle || ''}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder={titlePlaceholder}
          maxLength={70}
        />
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>
          Meta description <CharCounter length={(metaDescription || '').length} limit={DESCRIPTION_LIMIT} />
        </label>
        <textarea
          value={metaDescription || ''}
          onChange={(e) => onChangeDescription(e.target.value)}
          placeholder={descriptionPlaceholder}
          rows={2}
          maxLength={200}
        />
      </div>
    </fieldset>
  )
}
