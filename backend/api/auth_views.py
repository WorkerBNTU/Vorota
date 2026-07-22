from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsAdminPanelUser, can_access_admin, can_manage_content, user_role


def _auth_payload(user):
    role = user_role(user)
    return {
        'authenticated': True,
        'username': user.username,
        'role': role,
        'is_superuser': user.is_superuser,
        'can_manage_content': can_manage_content(user),
        'can_manage_crm': True,
    }


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CsrfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'csrfToken': get_token(request)})


class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get('username') or '').strip()
        password = request.data.get('password') or ''
        user = authenticate(request, username=username, password=password)
        if user is None or not can_access_admin(user):
            return Response({'detail': 'Неверный логин или пароль'}, status=status.HTTP_401_UNAUTHORIZED)
        login(request, user)
        return Response({'detail': 'ok', **_auth_payload(user)})


class AdminLogoutView(APIView):
    permission_classes = [IsAdminPanelUser]

    def post(self, request):
        logout(request)
        return Response({'detail': 'ok'})


class AdminMeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if can_access_admin(request.user):
            return Response(_auth_payload(request.user))
        return Response({'authenticated': False}, status=status.HTTP_401_UNAUTHORIZED)
