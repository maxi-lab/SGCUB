import unicodedata

from django.db import migrations

BARRIOS_POR_LOCALIDAD = {
    ("La Plata", "1900"): [
        "Abasto",
        "Arana",
        "Arturo Seguí",
        "Barrio El Carmen Oeste",
        "Barrio Gambier",
        "Barrio Las Malvinas",
        "Barrio Las Quintas",
        "City Bell",
        "El Retiro",
        "Joaquín Gorina",
        "José Hernández",
        "José Melchor Romero",
        "La Cumbre",
        "La Plata",
        "Lisandro Olmos",
        "Los Hornos",
        "Manuel B. Gonnet",
        "Ringuelet",
        "Rufino de Elizalde",
        "Tolosa",
        "Transradio",
        "Villa Elisa",
        "Villa Elvira",
        "Villa Garibaldi",
        "Villa Montoro",
        "Villa Parque Sicardi",
        "Ángel Etcheverry",
    ],
    ("Berisso", "1923"): [
        "Barrio Banco Provincia",
        "Barrio El Carmen Este",
        "Barrio Universitario",
        "Berisso",
        "Los Talas",
        "Villa Argüello",
        "Villa Dolores",
        "Villa Independencia",
        "Villa Nueva",
        "Villa Porteña",
        "Villa Progreso",
        "Villa San Carlos",
        "Villa Zula",
    ],
    ("Ensenada", "1925"): [
        "Dique N° 1",
        "Ensenada",
        "Isla Santiago",
        "Punta Lara",
        "Villa Catela",
    ],
}


def normalize(text):
    text = " ".join((text or "").split())
    return "".join(c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c)).casefold()


def seed_barrios(apps, schema_editor):
    Localidad = apps.get_model("padron", "Localidad")
    Barrio = apps.get_model("padron", "Barrio")
    for (localidad_nombre, codigo_postal), barrios in BARRIOS_POR_LOCALIDAD.items():
        localidad, _ = Localidad.objects.get_or_create(nombre=localidad_nombre, defaults={"codigo_postal": codigo_postal})
        for barrio_nombre in barrios:
            Barrio.objects.get_or_create(nombre=barrio_nombre, localidad=localidad)


def migrate_barrio_text(apps, schema_editor):
    Barrio = apps.get_model("padron", "Barrio")
    Domicilio = apps.get_model("padron", "Domicilio")
    cache = {}
    for domicilio in Domicilio.objects.exclude(barrio__isnull=True).exclude(barrio=""):
        nombre = " ".join(domicilio.barrio.split())
        if not nombre:
            continue
        if domicilio.localidad_id not in cache:
            cache[domicilio.localidad_id] = {
                normalize(barrio.nombre): barrio for barrio in Barrio.objects.filter(localidad_id=domicilio.localidad_id)
            }
        barrios = cache[domicilio.localidad_id]
        barrio = barrios.get(normalize(nombre))
        if barrio is None:
            barrio = Barrio.objects.create(nombre=nombre, localidad_id=domicilio.localidad_id)
            barrios[normalize(nombre)] = barrio
        domicilio.barrio_nuevo = barrio
        domicilio.save(update_fields=["barrio_nuevo"])


class Migration(migrations.Migration):

    dependencies = [
        ("padron", "0025_barrio"),
    ]

    operations = [
        migrations.RunPython(seed_barrios, migrations.RunPython.noop),
        migrations.RunPython(migrate_barrio_text, migrations.RunPython.noop),
    ]
