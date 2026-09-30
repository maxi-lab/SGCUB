# Vacio intencionalmente.
# Django solo envia post_migrate a las apps que tienen un models.py
# Los roles se sincronizan en apps.py, no en signals.py, para que se sincronicen incluso si no hay usuarios.
