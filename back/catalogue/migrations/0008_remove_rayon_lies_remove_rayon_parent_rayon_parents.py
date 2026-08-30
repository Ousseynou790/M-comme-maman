"""
Une sous-catégorie peut appartenir à plusieurs catégories.

La clé unique `parent` interdisait de ranger « Chaussures » à la fois sous
« Enfants » et sous « Coin Maman ». Elle devient une liaison multiple :
l'arborescence est un treillis, pas un arbre.

L'ordre des opérations compte. La table de liaison est créée d'abord, la
hiérarchie existante y est recopiée, et seulement ensuite l'ancienne colonne
disparaît — l'inverse effacerait les rattachements avant de les lire.

`lies` part en même temps : ce champ n'a jamais été lu par la boutique ni
enregistré par le back-office. Il cochait des cases sans effet.
"""

from django.db import migrations, models


def reprendre(apps, schema_editor):
    """Recopie chaque `parent` dans la nouvelle liaison."""
    Rayon = apps.get_model("catalogue", "Rayon")
    for rayon in Rayon.objects.exclude(parent__isnull=True):
        rayon.parents.add(rayon.parent)


def rendre(apps, schema_editor):
    """
    Retour en arrière : on ne garde qu'une parente, la première.

    Une colonne unique ne peut pas porter deux rattachements. Redescendre perd
    donc de l'information — c'est le prix de la marche arrière, pas un oubli.
    """
    Rayon = apps.get_model("catalogue", "Rayon")
    for rayon in Rayon.objects.all():
        premiere = rayon.parents.first()
        if premiere:
            rayon.parent = premiere
            rayon.save(update_fields=["parent"])


class Migration(migrations.Migration):
    dependencies = [
        ("catalogue", "0007_categories_racines"),
    ]

    operations = [
        migrations.AddField(
            model_name="rayon",
            name="parents",
            field=models.ManyToManyField(
                blank=True,
                help_text="Vide pour une catégorie de premier niveau",
                related_name="enfants",
                to="catalogue.rayon",
                verbose_name="catégories parentes",
            ),
        ),
        migrations.RunPython(reprendre, rendre),
        migrations.RemoveField(model_name="rayon", name="parent"),
        migrations.RemoveField(model_name="rayon", name="lies"),
    ]
