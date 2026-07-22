// Дополняет FormData значением из ImagePicker: либо реальным файлом (если
// выбрали "Загрузить файл"), либо ссылкой на уже загруженный на сервере
// файл (если выбрали "Из уже загруженных"). Возвращает true, если что-то
// было добавлено — удобно, когда есть ещё и текстовый fallback (например,
// ссылка на внешнее изображение), как в галерее каталога.
export function appendImagePick(fd, formEl, name) {
  const fileInput = formEl.querySelector(`input[type="file"][name="${name}"]`)
  if (fileInput?.files?.[0]) {
    fd.append(name, fileInput.files[0])
    return true
  }
  const libraryInput = formEl.querySelector(`input[name="${name}_from_library"]`)
  if (libraryInput?.value) {
    fd.append(`${name}_from_library`, libraryInput.value)
    return true
  }
  return false
}
