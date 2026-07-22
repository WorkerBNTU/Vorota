from api.models import ContentPage, ContentSection


def _find_parent(slug_parts, slug_to_page, section_slug, current_slug):
    for depth in range(len(slug_parts) - 1, 0, -1):
        candidate = '/'.join(slug_parts[:depth])
        if candidate in slug_to_page and candidate != current_slug:
            return slug_to_page[candidate]
        obzor = f'{candidate}/obzor'
        if obzor in slug_to_page and obzor != current_slug:
            return slug_to_page[obzor]
    root_slug = f'{section_slug}/obzor'
    if root_slug in slug_to_page and root_slug != current_slug:
        return slug_to_page[root_slug]
    return None


def get_section_root(section):
    roots = section.pages.filter(is_active=True, parent__isnull=True)
    overview = roots.filter(slug__endswith='/obzor').order_by('order', 'slug').first()
    if overview:
        return overview
    overview = roots.filter(page_type=ContentPage.PageType.OVERVIEW).first()
    if overview:
        return overview
    if section.slug == 'company':
        o_nas = roots.filter(slug='o-kompanii/o-nas').first()
        if o_nas:
            return o_nas
    return roots.order_by('order', 'title').first()


def fix_catalog_hierarchy():
    """Восстанавливает родительские связи по slug-пути страницы."""
    updated = 0
    for section in ContentSection.objects.all():
        pages = list(ContentPage.objects.filter(section=section).order_by('slug'))
        slug_to_page = {p.slug: p for p in pages}
        section_slug = section.slug

        for page in pages:
            slug_parts = page.slug.split('/')
            if len(slug_parts) <= 1:
                continue
            parent = _find_parent(slug_parts, slug_to_page, section_slug, page.slug)
            new_parent_id = parent.id if parent else None
            if page.parent_id != new_parent_id:
                page.parent = parent
                page.save(update_fields=['parent'])
                updated += 1

    company = ContentSection.objects.filter(slug='company').first()
    if company:
        for page in company.pages.filter(show_in_menu=False):
            if page.slug.startswith('o-kompanii/'):
                page.show_in_menu = True
                page.save(update_fields=['show_in_menu'])
                updated += 1

    updated += _ensure_section_overviews()
    return updated


def _ensure_section_overviews():
    """Создаёт обзорные страницы для разделов без obzor (кованые изделия и т.п.)."""
    created = 0
    for section in ContentSection.objects.all():
        roots = list(section.pages.filter(is_active=True, parent__isnull=True))
        if any(p.slug.endswith('/obzor') for p in roots):
            continue
        if len(roots) <= 1:
            continue

        sample = roots[0].slug
        prefix = sample.rsplit('/', 1)[0] if '/' in sample else section.slug
        obzor_slug = f'{prefix}/obzor'

        obzor, was_created = ContentPage.objects.get_or_create(
            slug=obzor_slug,
            defaults={
                'section': section,
                'title': section.title,
                'page_type': ContentPage.PageType.OVERVIEW,
                'excerpt': section.description,
                'show_in_menu': False,
                'is_active': True,
                'order': 0,
            },
        )
        if was_created:
            created += 1

        for page in roots:
            if page.id == obzor.id:
                continue
            if page.parent_id != obzor.id:
                page.parent = obzor
                page.save(update_fields=['parent'])
                created += 1

    return created
