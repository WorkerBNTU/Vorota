import { useEffect, useRef } from 'react'

// Формы редактирования во всех разделах админки рендерятся ниже
// таблицы/списка, а не в модальном окне — без автопрокрутки после клика
// «Изменить»/«Открыть»/«+ Добавить» их не видно, пока не промотаешь страницу
// вручную. Хук возвращает ref, который нужно повесить на обёртку формы;
// как только `openKey` становится «истинным» (или меняется на другое
// редактируемое значение), страница плавно прокручивается к началу формы.
export default function useScrollOnOpen(openKey) {
  const ref = useRef(null)

  useEffect(() => {
    if (!openKey) return
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [openKey])

  return ref
}
