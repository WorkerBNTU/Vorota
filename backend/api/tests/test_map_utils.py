"""Проверки is_embeddable_map_url — только официальный map-widget."""

from api.map_utils import is_embeddable_map_url


def test_accepts_yandex_map_widget():
    assert is_embeddable_map_url(
        'https://yandex.ru/map-widget/v1/?um=constructor%3Aabc&source=constructor'
    )
    assert is_embeddable_map_url(
        'https://www.yandex.com/map-widget/v1/?ll=27.5%2C53.9&z=18'
    )


def test_rejects_non_widget_and_host_spoof():
    assert not is_embeddable_map_url('https://yandex.ru/maps/-/XXXX')
    assert not is_embeddable_map_url('https://evil.com/map-widget/v1/?x=1')
    assert not is_embeddable_map_url(
        'https://evil.com/?next=https://yandex.ru/map-widget/v1/'
    )
    assert not is_embeddable_map_url('javascript:alert(1)')
    assert not is_embeddable_map_url('')
    assert not is_embeddable_map_url(None)
