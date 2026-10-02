from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('documental', '0002_seed_data'),
    ]

    operations = [
        migrations.AlterField(
            model_name='documento',
            name='archivoUrl',
            field=models.FileField(blank=True, max_length=200, null=True, upload_to='documentos/'),
        ),
    ]
