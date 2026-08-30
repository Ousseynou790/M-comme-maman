"""
Installe l'extension `unaccent` de PostgreSQL.

Sans elle, chercher « bebe » ne trouverait pas « bébé » : la recherche
comparerait des chaînes accentuées à des chaînes qui ne le sont pas.
"""

from django.contrib.postgres.operations import UnaccentExtension
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("catalogue", "0002_initial")]
    operations = [UnaccentExtension()]
