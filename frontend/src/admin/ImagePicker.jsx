import { useEffect, useRef, useState } from 'react'
import MediaLibraryModal from './MediaLibraryModal'

/**
 * Замена обычного <input type="file">: позволяет либо загрузить новый файл,
 * либо выбрать уже загруженное на сервер изображение (из другого товара,
 * слайда и т.п.), не загружая его повторно.
 *
 * Совместим с уже существующим паттерном чтения формы через
 * e.target.querySelector(...) при сабмите (см. appendImagePick в
 * imagePickerUtils.js) — сам React state наружу не отдаёт, а держит выбор
 * в обычном <input type="file"> (name) и скрытом <input type="hidden">
 * (name + "_from_library").
 *
 * resetKey — при смене этого значения (например, id редактируемой записи)
 * выбор сбрасывается и превью возвращается к currentUrl. Нужно, чтобы при
 * переключении между разными карточками не оставался выбор от предыдущей.
 */
export default function ImagePicker({ name, label, currentUrl, resetKey }) {
  const [preview, setPreview] = useState(currentUrl || null)
  const [libraryPath, setLibraryPath] = useState('')
  const [showLibrary, setShowLibrary] = useState(false)
  const fileInputRef = useRef(null)
  const objectUrlRef = useRef(null)

  const revokePreview = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }

  useEffect(() => {
    revokePreview()
    setPreview(currentUrl || null)
    setLibraryPath('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  useEffect(() => () => revokePreview(), [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    revokePreview()
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setPreview(url)
    setLibraryPath('')
  }

  const handlePick = (item) => {
    revokePreview()
    setLibraryPath(item.path)
    setPreview(item.url)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setShowLibrary(false)
  }

  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <div className="image-picker">
        <div className="image-picker-preview">
          {preview ? <img src={preview} alt="" /> : <span className="image-picker-empty">Нет фото</span>}
        </div>
        <div className="image-picker-actions">
          <label className="btn btn-outline btn-sm image-picker-upload">
            Загрузить файл
            <input ref={fileInputRef} type="file" name={name} accept="image/*" onChange={handleFileChange} />
          </label>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowLibrary(true)}>
            Из уже загруженных
          </button>
        </div>
        <input type="hidden" name={`${name}_from_library`} value={libraryPath} readOnly />
      </div>
      {showLibrary && (
        <MediaLibraryModal onClose={() => setShowLibrary(false)} onSelect={handlePick} />
      )}
    </div>
  )
}
