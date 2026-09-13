from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("finanzas", "0004_cuota_cuenta_corriente"),
    ]

    operations = [
        migrations.AlterField(
            model_name="itemcuota",
            name="concepto",
            field=models.CharField(
                choices=[
                    ("CuotaSocial", "CuotaSocial"),
                    ("CuotaDeportiva", "CuotaDeportiva"),
                    ("Mora", "Mora"),
                    ("DescuentoUnico", "DescuentoUnico"),
                    ("Beca", "Beca"),
                    ("Otro", "Otro"),
                ],
                max_length=50,
            ),
        ),
    ]