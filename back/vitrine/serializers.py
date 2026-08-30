"""Ce que la gérante règle, et ce que la vitrine en lit."""

from rest_framework import serializers

from .models import Bandeau, EntreeJournal, Reglages


class ReglagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reglages
        exclude = ["id"]
        read_only_fields = ["modifie_le"]


class ReglagesPublicSerializer(serializers.ModelSerializer):
    """
    Ce que la boutique a besoin de savoir.

    Ni seuil de stock ni identifiants : la vitrine n'affiche que l'identité, les
    frais de livraison et le bandeau promotionnel.
    """

    class Meta:
        model = Reglages
        fields = [
            "nom_boutique", "signature", "email_contact", "telephone", "devise",
            "franco_dakar", "frais_dakar", "frais_thies", "frais_regions",
            "accepte_commandes", "affiche_bandeau_promo", "texte_bandeau_promo",
        ]


class BandeauSerializer(serializers.ModelSerializer):
    url = serializers.CharField(source="media.url", read_only=True)
    produit_slug = serializers.CharField(source="produit_associe.slug", read_only=True, default="")
    produit_nom = serializers.CharField(source="produit_associe.nom", read_only=True, default="")
    produit_prix = serializers.IntegerField(source="produit_associe.prix", read_only=True, default=0)

    class Meta:
        model = Bandeau
        fields = [
            "id", "titre", "accroche", "media", "url", "texte_alternatif", "cadrage",
            "etiquette", "produit_associe", "produit_slug", "produit_nom", "produit_prix",
            "active", "ordre",
        ]


class EntreeJournalSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntreeJournal
        fields = ["id", "nom_auteur", "action", "cible", "date"]
