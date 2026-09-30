from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .admin import UsuarioChangeForm, UsuarioCreationForm
from .roles import ADMINISTRADOR, ROLE_PERMISSIONS

User = get_user_model()


class RolesTests(TestCase):
    def test_every_role_exists_after_migrate(self):
        expected = set(ROLE_PERMISSIONS) | {ADMINISTRADOR}
        self.assertTrue(expected.issubset(set(Group.objects.values_list("name", flat=True))))

    def test_administrador_has_every_permission(self):
        administrador = Group.objects.get(name=ADMINISTRADOR)
        self.assertEqual(administrador.permissions.count(), Permission.objects.count())

    def test_other_roles_have_their_configured_permissions(self):
        for name, codes in ROLE_PERMISSIONS.items():
            group = Group.objects.get(name=name)
            self.assertEqual(group.permissions.count(), len(codes))


class StaffFlagTests(TestCase):
    def setUp(self):
        self.administrador = Group.objects.get(name=ADMINISTRADOR)
        self.user = User.objects.create_user(username="usuario", password="Clave-segura-123")

    def test_user_becomes_staff_when_added_to_administrador(self):
        self.user.groups.add(self.administrador)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_staff)

    def test_user_stops_being_staff_when_removed_from_administrador(self):
        self.user.groups.add(self.administrador)
        self.user.groups.remove(self.administrador)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_staff)

    def test_adding_user_from_group_side_also_updates_staff(self):
        self.administrador.user_set.add(self.user)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_staff)

        self.administrador.user_set.clear()
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_staff)

    def test_other_roles_do_not_grant_staff(self):
        self.user.groups.add(Group.objects.get(name="Tesorero"))
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_staff)

    def test_superuser_keeps_staff_without_administrador(self):
        superuser = User.objects.create_superuser(username="admin", password="Clave-segura-123")
        superuser.groups.add(Group.objects.get(name="Directivo"))
        superuser.refresh_from_db()
        self.assertTrue(superuser.is_staff)


class AuthEndpointsTests(APITestCase):
    password = "Clave-segura-123"

    def setUp(self):
        # El throttle guarda los intentos en la caché, que se comparte entre tests
        cache.clear()
        self.user = User.objects.create_user(
            username="30123456",
            password=self.password,
            first_name="Juana",
            last_name="Pérez",
        )
        self.user.groups.add(Group.objects.get(name="Tesorero"))

    def login(self, password=None, dni="30123456"):
        return self.client.post(
            reverse("auth-login"),
            {"username": dni, "password": password or self.password},
            format="json",
        )

    def test_login_returns_tokens(self):
        response = self.login()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_accepts_dni_with_dots(self):
        response = self.login(dni="30.123.456")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_with_wrong_password_returns_401(self):
        response = self.login(password="incorrecta")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_is_throttled_after_too_many_attempts(self):
        for _ in range(10):
            self.login(password="incorrecta")
        response = self.login()
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_api_requires_authentication(self):
        response = self.client.get(reverse("auth-me"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_user_roles_and_permissions(self):
        access = self.login().data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = self.client.get(reverse("auth-me"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "30123456")
        self.assertEqual(response.data["full_name"], "Juana Pérez")
        self.assertEqual(response.data["roles"], ["Tesorero"])
        self.assertEqual(response.data["permissions"], [])
        self.assertFalse(response.data["is_superuser"])

    def test_me_lists_every_permission_for_administrador(self):
        self.user.groups.set([Group.objects.get(name=ADMINISTRADOR)])
        self.client.force_authenticate(self.user)

        response = self.client.get(reverse("auth-me"))

        self.assertEqual(len(response.data["permissions"]), Permission.objects.count())

    def test_refresh_rotates_and_invalidates_the_previous_token(self):
        refresh = self.login().data["refresh"]

        response = self.client.post(reverse("auth-refresh"), {"refresh": refresh}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertNotEqual(response.data["refresh"], refresh)

        reused = self.client.post(reverse("auth-refresh"), {"refresh": refresh}, format="json")
        self.assertEqual(reused.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_invalidates_refresh_token(self):
        refresh = self.login().data["refresh"]

        response = self.client.post(reverse("auth-logout"), {"refresh": refresh}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        reused = self.client.post(reverse("auth-refresh"), {"refresh": refresh}, format="json")
        self.assertEqual(reused.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(
            reverse("auth-change-password"),
            {"current_password": self.password, "new_password": "Otra-clave-456"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Otra-clave-456"))

    def test_change_password_rejects_wrong_current_password(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(
            reverse("auth-change-password"),
            {"current_password": "incorrecta", "new_password": "Otra-clave-456"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_password", response.data)

    def test_change_password_rejects_weak_password(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(
            reverse("auth-change-password"),
            {"current_password": self.password, "new_password": "1234"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("new_password", response.data)


class DniUsernameAdminFormTests(TestCase):
    password = "Clave-segura-123"

    def creation_form(self, dni):
        return UsuarioCreationForm(data={"username": dni, "password1": self.password, "password2": self.password})

    def test_creation_form_normalizes_dni(self):
        form = self.creation_form("30.123.456")
        self.assertTrue(form.is_valid(), form.errors)
        self.assertEqual(form.save().username, "30123456")

    def test_creation_form_rejects_invalid_dni(self):
        for dni in ("jperez", "123456", "123456789"):
            with self.subTest(dni=dni):
                form = self.creation_form(dni)
                self.assertFalse(form.is_valid())
                self.assertIn("username", form.errors)

    def test_creation_form_rejects_duplicated_dni(self):
        User.objects.create_user(username="30123456", password=self.password)
        form = self.creation_form("30.123.456")
        self.assertFalse(form.is_valid())
        self.assertIn("username", form.errors)

    def test_change_form_validates_dni(self):
        user = User.objects.create_user(username="30123456", password=self.password)
        form = UsuarioChangeForm(
            instance=user,
            data={"username": "jperez", "date_joined": user.date_joined, "is_active": True},
        )
        self.assertFalse(form.is_valid())
        self.assertIn("username", form.errors)
