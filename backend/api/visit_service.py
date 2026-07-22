import re

from django.conf import settings
from django.utils import timezone

from .models import SiteVisit

BOT_UA_RE = re.compile(
    r'|'.join([
        r'googlebot',
        r'google-inspectiontool',
        r'bingbot',
        r'yandexbot',
        r'yandeximages',
        r'yandexrender',
        r'duckduckbot',
        r'baiduspider',
        r'slurp',
        r'facebookexternalhit',
        r'twitterbot',
        r'linkedinbot',
        r'applebot',
        r'petalbot',
        r'semrushbot',
        r'ahrefsbot',
        r'mj12bot',
        r'dotbot',
        r'rogerbot',
        r'screaming frog',
        r'uptimerobot',
        r'pingdom',
        r'headlesschrome',
        r'phantomjs',
        r'puppeteer',
        r'curl/',
        r'wget/',
        r'python-requests',
        r'go-http-client',
        r'java/',
        r'libwww-perl',
        r'archive\.org_bot',
        r'ccbot',
        r'gptbot',
        r'claudebot',
        r'bytespider',
        r'\bbot\b',
        r'\bcrawler\b',
        r'\bspider\b',
        r'\bscraper\b',
    ]),
    re.I,
)


def get_client_ip(request):
    """IP для аналитики: тот же trust model, что у RateLimitMiddleware."""
    if getattr(settings, 'TRUST_PROXY_HEADERS', False):
        real_ip = request.META.get('HTTP_X_REAL_IP', '').strip()
        if real_ip:
            return real_ip
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '').strip()
        if forwarded:
            return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '') or ''


def is_bot_request(request):
    ua = request.META.get('HTTP_USER_AGENT', '') or ''
    if not ua.strip():
        return True
    if len(ua) < 12:
        return True
    return bool(BOT_UA_RE.search(ua))


def record_visit(request, path='/'):
    if is_bot_request(request):
        return False

    ip = get_client_ip(request)
    if not ip:
        return False

    visit_date = timezone.localdate()
    if SiteVisit.objects.filter(ip_address=ip, visit_date=visit_date).exists():
        return False

    referer = (request.META.get('HTTP_REFERER') or '')[:500]
    ua = (request.META.get('HTTP_USER_AGENT') or '')[:500]
    path = (path or '/')[:300]

    SiteVisit.objects.create(
        ip_address=ip,
        visit_date=visit_date,
        path=path,
        referer=referer,
        user_agent=ua,
    )
    return True
