"""
Range les rayons existants sous deux catégories racines.

Jusqu'ici la boutique séparait ses deux mondes par un champ `univers` posé sur
chaque rayon. Maintenant que les catégories s'emboîtent, la hiérarchie dit la
même chose plus clairement : « Coin Maman » contient « Tissus » et « Voiles »,
« Enfants » contient le vestiaire.

`univers` reste, pour l'instant : il sert encore de filtre rapide côté vitrine.
Mais il est désormais **dérivé** — une sous-catégorie prend celui de sa parente.
"""

from django.db import migrations
from django.utils.text import slugify

RACINES = [
    ("Enfants", "enfant", "Le vestiaire de 2 à 14 ans", 0),
    ("Coin Maman", "maman", "Tissus et voiles, pour celles qui cousent", 1),
]


def ranger(apps, schema_editor):
    Rayon = apps.get_model("catalogue", "Rayon")

    racines = {}
    for nom, univers, description, ordre in RACINES:
        racine, _ = Rayon.objects.get_or_create(
            nom=nom,
            defaults={
                "slug": slugify(nom),
                "univers": univers,
                "description": description,
                "ordre": ordre,
                "visible": True,
            },
        )
        racines[univers] = racine

    # Chaque rayon existant passe sous la racine de son univers. On saute les
    # racines elles-mêmes, qui n'ont pas de parente.
    for rayon in Rayon.objects.exclude(pk__in=[r.pk for r in racines.values()]):
        rayon.parent = racines[rayon.univers]
        rayon.ordre = rayon.ordre + 10
        rayon.save(update_fields=["parent", "ordre"])


def defaire(apps, schema_editor):
    """Détache les rayons et retire les deux racines, si elles sont vides."""
    Rayon = apps.get_model("catalogue", "Rayon")
    Rayon.objects.exclude(parent__isnull=True).update(parent=None)
    for nom, *_ in RACINES:
        Rayon.objects.filter(nom=nom, produits__isnull=True).delete()


class Migration(migrations.Migration):
    dependencies = [("catalogue", "0006_rayon_parent")]
    operations = [migrations.RunPython(ranger, defaire)]
