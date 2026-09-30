from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.test import TestCase

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
