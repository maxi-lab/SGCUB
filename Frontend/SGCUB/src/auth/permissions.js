// Códigos "<app_label>.<codename>" del backend que habilitan cada sección (ver usuarios/roles.py).
// Administrador tiene todos los permisos, por lo que ve todas las secciones.
// ACA VAN LAS RESTRICCIONES
export const PERMISSIONS = {
  manageUsers: 'auth.view_user',
  manageAutomations: 'django_q.view_schedule',
}
