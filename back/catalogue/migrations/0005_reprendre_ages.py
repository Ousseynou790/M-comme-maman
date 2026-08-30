"""
Reprend les âges des fiches déjà enregistrées.

La boutique n'habille plus les 0-1 an et s'arrête à 14 : deux valeurs
disparaissent du catalogue. Les fiches qui les portaient ne peuvent pas rester
avec un âge qui n'existe plus — elles deviendraient invisibles à tous les
filtres sans que personne ne comprenne pourquoi.

  « 0-1 »   → « 2-10 »   la fiche reste en vente, à la tranche la plus proche
  « 10-15 » → « 11-14 »  même tranche, borne haute ramenée à 14
"""

from django.db import migrations

REPRISES = {"0-1": "2-10", "10-15": "11-14"}


def reprendre(apps, schema_editor):
    Produit = apps.get_model("catalogue", "Produit")
    for ancien, nouveau in REPRISES.items():
        Produit.objects.filter(age=ancien).update(age=nouveau)


def revenir(apps, schema_editor):
    """Le retour en arrière ne rend pas les 0-1 : on ne sait plus lesquelles l'étaient."""
    Produit = apps.get_model("catalogue", "Produit")
    Produit.objects.filter(age="11-14").update(age="10-15")


class Migration(migrations.Migration):
    dependencies = [("catalogue", "0004_produit_univers_rayon_univers_alter_produit_age_and_more")]
    operations = [migrations.RunPython(reprendre, revenir)]
