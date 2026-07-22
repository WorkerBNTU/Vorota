"""Приведение типов из multipart/form-data админских форм.

FormData всегда шлёт строки. DRF частично справляется сам, но пустая строка
для nullable Decimal/FK ломает валидацию, а булевы поля приходят как
'true'/'false'. Раньше '0' ошибочно превращался в False — см. историю
AdminModelViewSet._normalize_request_data.
"""


# Поля, которые в multipart приходят строками, но должны стать None, если пусто.
NULLABLE_STRING_FIELDS = frozenset({
    'parent', 'price', 'manufacturer', 'model', 'availability',
    'external_image_url', 'excerpt', 'content', 'meta_title', 'meta_description',
    'caption', 'external_image_url',
})

INTEGER_FIELDS = frozenset({
    'order', 'section', 'page', 'step_number', 'parent',
})

INTEGER_DEFAULT_ZERO = frozenset({'order', 'step_number'})

DECIMAL_FIELDS = frozenset({'price'})


def _coerce_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return None
    text = str(value).strip().lower()
    if text in ('true', '1', 'on', 'yes'):
        return True
    if text in ('false', '0', 'off', 'no'):
        return False
    return value


def _coerce_int(value, default=None):
    if value is None or value == '':
        return default
    if isinstance(value, int):
        return value
    text = str(value).strip()
    if not text:
        return default
    return int(text)


def _coerce_decimal(value):
    if value is None or value == '':
        return None
    text = str(value).strip()
    if not text:
        return None
    return text


def normalize_multipart_data(data, boolean_fields=None, nullable_fields=None, integer_fields=None):
    """Нормализует dict из request.data перед передачей в сериализатор."""
    if not hasattr(data, 'items'):
        return data

    boolean_fields = boolean_fields or frozenset()
    nullable_fields = nullable_fields or NULLABLE_STRING_FIELDS
    integer_fields = integer_fields or INTEGER_FIELDS

    normalized = {}
    for key, value in data.items():
        if isinstance(value, list) and len(value) == 1:
            value = value[0]

        if key in boolean_fields:
            normalized[key] = _coerce_bool(value)
            continue

        if key in nullable_fields and (value is None or str(value).strip() == ''):
            normalized[key] = None
            continue

        if key in integer_fields:
            default = 0 if key in INTEGER_DEFAULT_ZERO else None
            normalized[key] = _coerce_int(value, default=default)
            continue

        if key in DECIMAL_FIELDS:
            normalized[key] = _coerce_decimal(value)
            continue

        normalized[key] = value

    return normalized


class AdminFormSerializerMixin:
    """Миксин для админских сериализаторов с явной обработкой пустых строк."""

    nullable_string_fields = NULLABLE_STRING_FIELDS

    def to_internal_value(self, data):
        if hasattr(data, 'items'):
            cleaned = {}
            for key, value in data.items():
                if key in self.nullable_string_fields and value == '':
                    cleaned[key] = None
                else:
                    cleaned[key] = value
            data = cleaned
        return super().to_internal_value(data)

    def validate_price(self, value):
        if value in (None, ''):
            return None
        return value

    def validate_parent(self, value):
        if value in (None, ''):
            return None
        return value
