from django.db import migrations

def seed_categorias(apps, schema_editor):
    Categoria = apps.get_model('padron', 'Categoria')
    
    # MASCULINO
    cat_masc = [
        ("SENIOR", 99),
        ("1RA DIVISION", 99),
        ("3RA DIVISION", 26),
        ("4TA DIVISION", 19),
        ("5TA DIVISION", 17),
        ("6TA DIVISION", 16),
        ("7MA DIVISION", 15),
        ("8VA DIVISION", 14),
        ("9NA DIVISION", 13),
        ("PRE 9NA DIVISION", 12),
        ("2015", 11),
        ("2016", 10),
        ("2017", 9),
        ("2018", 8),
        ("2019", 7),
        ("2020", 6),
    ]
    for nombre, max_edad in cat_masc:
        Categoria.objects.update_or_create(
            nombre=nombre, 
            genero="M", 
            defaults={'anio_vigente': 2026, 'edad_maxima': max_edad}
        )
        
    # FEMENINO
    cat_fem = [
        ("SENIOR", 99),
        ("1RA DIVISION", 99),
        ("3RA DIVISION", 99),
        ("4TA DIVISION", 17),
        ("SUB14", 14),
        ("SUB12", 12),
        ("SUB10", 10),
        ("SUB8", 8),
    ]
    for nombre, max_edad in cat_fem:
        Categoria.objects.update_or_create(
            nombre=nombre, 
            genero="F", 
            defaults={'anio_vigente': 2026, 'edad_maxima': max_edad}
        )

def reverse_seed_categorias(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('padron', '0017_crear_schedules_qcluster'),
    ]

    operations = [
        migrations.RunPython(seed_categorias, reverse_seed_categorias)
    ]
