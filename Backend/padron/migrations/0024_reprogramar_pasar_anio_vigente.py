from datetime import datetime
from zoneinfo import ZoneInfo

from django.conf import settings
from django.db import migrations

SCHEDULE_NAME = 'tarea_pasar_anio_vigente'


def next_january_first(hour):
    tz = ZoneInfo(settings.TIME_ZONE)
    now = datetime.now(tz)
    return datetime(now.year + 1, 1, 1, hour, 0, tzinfo=tz)


def reschedule(apps, schema_editor):
    Schedule = apps.get_model('django_q', 'Schedule')
    Schedule.objects.update_or_create(
        name=SCHEDULE_NAME,
        defaults={
            'func': 'padron.services.pasr_de_anio_vigente_a_categoria',
            'schedule_type': 'C',
            'cron': '0 6 1 1 *',
            'repeats': -1,
            'next_run': next_january_first(6),
        },
    )


def restore(apps, schema_editor):
    Schedule = apps.get_model('django_q', 'Schedule')
    Schedule.objects.filter(name=SCHEDULE_NAME).update(
        cron='0 0 1 1 *',
        next_run=next_january_first(0),
    )


class Migration(migrations.Migration):

    dependencies = [
        ('padron', '0023_rename_estadosocio_estadoadministrativo_and_more'),
        ('django_q', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(reschedule, restore),
    ]
