from django.urls import path

from .views import LoginView, LogoutView, RefreshView, change_password, current_user

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", current_user, name="auth-me"),
    path("change-password/", change_password, name="auth-change-password"),
]
