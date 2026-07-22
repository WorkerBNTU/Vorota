// Рендерит <script type="application/ld+json"> прямо в дерево React — это
// попадает и в обычный DOM (для отладки через devtools), и в HTML-снапшот,
// который снимает Puppeteer при пререндеринге (frontend/prerender/), а
// значит структурированные данные видят и боты, не выполняющие JS.
export default function JsonLd({ data }) {
  if (!data) return null
  // JSON.stringify сам по себе не экранирует </script> → XSS через поля админки.
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
