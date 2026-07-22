"""Права админки: полный доступ (superuser) vs менеджер CRM (группа manager)."""

from rest_framework.permissions import BasePermission

MANAGER_GROUP = 'manager'


def user_role(user) -> str | None:
    if not user or not user.is_authenticated or not user.is_staff:
        return None
    if user.is_superuser:
        return 'admin'
    if user.groups.filter(name=MANAGER_GROUP).exists():
        return 'manager'
    return None


def can_access_admin(user) -> bool:
    return user_role(user) is not None


def can_manage_content(user) -> bool:
    return bool(user and user.is_authenticated and user.is_superuser)


def can_manage_crm(user) -> bool:
    return user_role(user) in ('admin', 'manager')


class IsAdminPanelUser(BasePermission):
    """Любой допущенный в /admin (admin или manager)."""

    def has_permission(self, request, view):
        return can_access_admin(request.user)


class IsContentAdmin(BasePermission):
    """Контент, настройки, медиа, аналитика посещений — только полный админ."""

    def has_permission(self, request, view):
        return can_manage_content(request.user)


class IsCrmStaff(BasePermission):
    """Заявки CRM — админ и менеджер."""

    def has_permission(self, request, view):
        return can_manage_crm(request.user)
