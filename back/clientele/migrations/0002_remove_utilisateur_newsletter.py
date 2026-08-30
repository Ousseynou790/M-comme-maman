"""
Retire la lettre d'information.

Le champ était un booléen coché par défaut à l'inscription, sans date ni trace
de l'origine du consentement. Ce n'est pas une preuve : écrire à ces adresses
sur cette base n'aurait rien d'un accord recueilli. Plutôt que de garder une
colonne qui en donne l'illusion, on la retire.

Le jour où la boutique enverra vraiment des messages, il faudra la refaire
autrement : décochée par défaut, avec la date du recueil et l'endroit où il a
eu lieu — inscription, tunnel de commande, formulaire de pied de page.
"""

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("clientele", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="utilisateur",
            name="newsletter",
        ),
    ]
