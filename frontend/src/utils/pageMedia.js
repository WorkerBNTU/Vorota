/** Группировка изображений страницы по роли (см. ContentPageImage.role). */
export function groupPageMedia(gallery = []) {
  const sorted = [...gallery].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const byRole = (role) => sorted.filter((item) => item.role === role)
  return {
    avatars: byRole('avatar'),
    feed: byRole('feed'),
    variants: byRole('variant'),
    inline: byRole('inline'),
  }
}

export function attachAvatars(items, avatars) {
  return items.map((item, i) => ({
    ...item,
    avatar_url: avatars[i]?.image_url || null,
  }))
}

export function attachFeedImages(items, images) {
  return items.map((item, i) => ({
    ...item,
    image_url: images[i]?.image_url || null,
  }))
}
