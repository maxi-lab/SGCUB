from django.db import migrations


CATEGORIAS_INICIALES = [
    'Primera',
    'Reserva',
    'Cuarta',
    'Quinta',
    'Sexta',
    'Septima',
    'Octava',
    'Novena',
]


def crear_categorias(apps, schema_editor):
    pass


def conservar_categorias(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('padron', '0003_remove_socio_telefono_jugador_contactoemergencia_and_more'),
    ]

    operations = [
        migrations.RunPython(crear_categorias, conservar_categorias),
    ]
