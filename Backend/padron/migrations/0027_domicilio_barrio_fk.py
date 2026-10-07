import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('padron', '0026_seed_barrios'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='domicilio',
            name='barrio',
        ),
        migrations.RenameField(
            model_name='domicilio',
            old_name='barrio_nuevo',
            new_name='barrio',
        ),
        migrations.AlterField(
            model_name='domicilio',
            name='barrio',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='domicilios', to='padron.barrio'),
        ),
    ]
