from django.db import migrations

def seed_tipos_estados(apps, schema_editor):
    TipoDocumento = apps.get_model('documental', 'TipoDocumento')
    EstadoDocumento = apps.get_model('documental', 'EstadoDocumento')

    tipos = [
        "Apto Físico",
        "Antecedentes Penales",
        "CV",
        "DNI",
        "Pauta de Convivencia",
        "Planilla Inscripción",
        "Pase De Transferencia"
    ]
    for tipo in tipos:
        TipoDocumento.objects.get_or_create(nombre=tipo)

    estados = [
        "Vigente",
        "Vencido",
        "Pendiente",
        "Entregado"
    ]
    for estado in estados:
        EstadoDocumento.objects.get_or_create(nombre=estado)

class Migration(migrations.Migration):

    dependencies = [
        ('documental', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_tipos_estados),
    ]
