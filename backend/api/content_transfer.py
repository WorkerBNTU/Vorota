"""Модели публичного контента сайта (без CRM / визитов / auth)."""

# Порядок важен для dumpdata (FK: section → page → images).
CONTENT_DUMP_LABELS = [
    'api.SiteSettings',
    'api.HeroSlide',
    'api.Service',
    'api.Advantage',
    'api.WorkStep',
    'api.PortfolioItem',
    'api.ContentSection',
    'api.ContentPage',
    'api.ContentPageImage',
]

# Модели, которые import очищает перед loaddata (заявки и визиты не трогаем).
CONTENT_MODEL_CLEAR_ORDER = [
    'ContentPageImage',
    'ContentPage',
    'ContentSection',
    'PortfolioItem',
    'WorkStep',
    'Advantage',
    'Service',
    'HeroSlide',
    'SiteSettings',
]
