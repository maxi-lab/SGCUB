import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('padron', '0004_seed_categorias'),
    ]

    operations = [
        migrations.AlterField(
            model_name='jugador',
            name='socio',
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='jugadores',
                to='padron.socio',
            ),
        ),
    ]