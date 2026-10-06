import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('padron', '0024_reprogramar_pasar_anio_vigente'),
    ]

    operations = [
        migrations.CreateModel(
            name='Barrio',
            fields=[
                ('barrio_id', models.AutoField(primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=100)),
                ('localidad', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='barrios', to='padron.localidad')),
            ],
            options={
                'db_table': 'barrio',
                'ordering': ['nombre'],
                'constraints': [models.UniqueConstraint(fields=('nombre', 'localidad'), name='unique_barrio_localidad')],
            },
        ),
        migrations.AddField(
            model_name='domicilio',
            name='barrio_nuevo',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='padron.barrio'),
        ),
    ]
