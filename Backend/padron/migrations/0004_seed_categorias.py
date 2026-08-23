from django.db import migrations


CATEGORIAS_INICIALES = [
    'Primera',
    'Segunda',
    'Novena',
    'Octava',
    'Septima',
    'Sexta',
]


def crear_categorias(apps, schema_editor):
    Categoria = apps.get_model('padron', 'Categoria')

    for nombre in CATEGORIAS_INICIALES:
        Categoria.objects.get_or_create(nombre=nombre)


def conservar_categorias(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('padron', '0003_remove_socio_telefono_jugador_contactoemergencia_and_more'),
    ]

    operations = [
        migrations.RunPython(crear_categorias, conservar_categorias),
    ]
