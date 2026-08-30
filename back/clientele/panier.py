"""
Le panier serveur.

Il n'existe que pour une cliente connectée. Tant qu'elle ne l'est pas, son
panier reste dans son navigateur : écrire en base à chaque clic sur « ajouter »
coûterait un aller-retour pour rien, et lui demander un compte avant de
remplir son panier lui ferait fermer l'onglet.

À la connexion, le panier local remonte ici par `fusionner`. C'est le seul
moment où les deux se rencontrent.
"""

from django.db import transaction
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalogue.models import Produit, Variante

from .models import LignePanier, Panier


class LignePanierSerializer(serializers.ModelSerializer):
    """Une ligne, avec de quoi dessiner la vignette sans second appel."""

    produit = serializers.IntegerField(source="variante.produit.id", read_only=True)
    slug = serializers.CharField(source="variante.produit.slug", read_only=True)
    nom = serializers.CharField(source="variante.produit.nom", read_only=True)
    option = serializers.CharField(source="variante.libelle_option", read_only=True)
    prix_unitaire = serializers.IntegerField(source="variante.produit.prix", read_only=True)
    sous_total = serializers.IntegerField(read_only=True)
    image = serializers.SerializerMethodField()
    stock_restant = serializers.IntegerField(source="variante.stock", read_only=True)
    disponible = serializers.SerializerMethodField()

    class Meta:
        model = LignePanier
        fields = [
            "id", "variante", "produit", "slug", "nom", "option", "image",
            "prix_unitaire", "quantite", "sous_total", "stock_restant", "disponible",
        ]

    def get_image(self, obj) -> str:
        photo = obj.variante.produit.photo_principale
        return photo.media.url if photo else ""

    def get_disponible(self, obj) -> bool:
        """
        Ce qu'une ligne devient quand le stock tombe.

        On ne la retire pas d'autorité : la cliente doit voir ce qui a changé
        depuis qu'elle l'a mise là, sinon son panier maigrit tout seul.
        """
        return (
            obj.variante.produit.statut == Produit.Statut.PUBLIE
            and obj.variante.stock >= obj.quantite
        )


class PanierSerializer(serializers.ModelSerializer):
    lignes = LignePanierSerializer(many=True, read_only=True)
    sous_total = serializers.IntegerField(read_only=True)
    nombre_articles = serializers.SerializerMethodField()
    complet = serializers.SerializerMethodField()

    class Meta:
        model = Panier
        fields = ["id", "lignes", "sous_total", "nombre_articles", "complet", "modifie_le"]

    def get_nombre_articles(self, obj) -> int:
        return sum(ligne.quantite for ligne in obj.lignes.all())

    def get_complet(self, obj) -> bool:
        """Faux dès qu'une ligne n'est plus servable : le tunnel doit le dire avant la caisse."""
        return all(LignePanierSerializer().get_disponible(ligne) for ligne in obj.lignes.all())


def panier_de(cliente) -> Panier:
    panier, _ = Panier.objects.get_or_create(cliente=cliente)
    return panier


def _charge(panier: Panier) -> Panier:
    return (
        Panier.objects.prefetch_related(
            "lignes__variante__produit__photos__media",
            "lignes__variante__taille",
            "lignes__variante__coloris",
        ).get(pk=panier.pk)
    )


def _verifier(variante: Variante, quantite: int):
    if variante.produit.statut != Produit.Statut.PUBLIE:
        raise serializers.ValidationError({"variante": ["Cet article n'est plus en vente."]})
    if quantite > variante.stock:
        raise serializers.ValidationError({
            "quantite": [f"Il n'en reste que {variante.stock}."]
        })


class PanierView(APIView):
    """Le panier de la cliente connectée : le lire, le vider."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(PanierSerializer(_charge(panier_de(request.user))).data)

    def delete(self, request):
        panier_de(request.user).lignes.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LignePanierView(APIView):
    """Ajouter un article, changer sa quantité, le retirer."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Ajoute au panier.

        Un article déjà présent voit sa quantité augmenter : c'est ce que la
        cliente attend en cliquant deux fois sur « ajouter », plutôt qu'une
        seconde ligne identique.
        """
        variante_id = request.data.get("variante")
        try:
            quantite = int(request.data.get("quantite", 1))
        except (TypeError, ValueError):
            return Response({"quantite": ["Un nombre entier est attendu."]},
                            status=status.HTTP_400_BAD_REQUEST)
        if quantite < 1:
            return Response({"quantite": ["Au moins un article."]},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            variante = Variante.objects.select_related("produit").get(pk=variante_id)
        except (Variante.DoesNotExist, ValueError, TypeError):
            return Response({"variante": ["Cet article n'existe pas."]},
                            status=status.HTTP_404_NOT_FOUND)

        panier = panier_de(request.user)
        ligne = panier.lignes.filter(variante=variante).first()
        voulue = (ligne.quantite if ligne else 0) + quantite
        _verifier(variante, voulue)

        if ligne:
            ligne.quantite = voulue
            ligne.save(update_fields=["quantite"])
        else:
            LignePanier.objects.create(panier=panier, variante=variante, quantite=quantite)

        return Response(PanierSerializer(_charge(panier)).data, status=status.HTTP_201_CREATED)

    def patch(self, request, ligne_id=None):
        panier = panier_de(request.user)
        try:
            ligne = panier.lignes.select_related("variante__produit").get(pk=ligne_id)
        except LignePanier.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        try:
            quantite = int(request.data.get("quantite"))
        except (TypeError, ValueError):
            return Response({"quantite": ["Un nombre entier est attendu."]},
                            status=status.HTTP_400_BAD_REQUEST)

        # Descendre à zéro retire la ligne : c'est le geste naturel au clavier.
        if quantite < 1:
            ligne.delete()
            return Response(PanierSerializer(_charge(panier)).data)

        _verifier(ligne.variante, quantite)
        ligne.quantite = quantite
        ligne.save(update_fields=["quantite"])
        return Response(PanierSerializer(_charge(panier)).data)

    def delete(self, request, ligne_id=None):
        panier = panier_de(request.user)
        supprimees, _ = panier.lignes.filter(pk=ligne_id).delete()
        if not supprimees:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(PanierSerializer(_charge(panier)).data)


class FusionPanierView(APIView):
    """
    Reprend le panier gardé dans le navigateur avant la connexion.

    Quand les deux paniers contiennent le même article, on garde **la plus
    grande** des deux quantités plutôt que leur somme : additionner ferait
    doubler le panier d'une cliente qui se reconnecte sur le même appareil,
    ce qu'elle n'a jamais demandé.
    """

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        lignes = request.data.get("lignes", [])
        if not isinstance(lignes, list):
            return Response({"lignes": ["Une liste de lignes est attendue."]},
                            status=status.HTTP_400_BAD_REQUEST)

        panier = panier_de(request.user)
        ignorees = []

        for entree in lignes:
            try:
                variante = Variante.objects.select_related("produit").get(pk=entree.get("variante"))
                quantite = max(1, int(entree.get("quantite", 1)))
            except (Variante.DoesNotExist, ValueError, TypeError, AttributeError):
                continue

            # Un article devenu indisponible n'est pas une erreur : on le signale
            # et on continue, plutôt que de refuser toute la fusion.
            if variante.produit.statut != Produit.Statut.PUBLIE or variante.stock < 1:
                ignorees.append(variante.produit.nom)
                continue

            quantite = min(quantite, variante.stock)
            ligne = panier.lignes.filter(variante=variante).first()
            if ligne:
                ligne.quantite = min(max(ligne.quantite, quantite), variante.stock)
                ligne.save(update_fields=["quantite"])
            else:
                LignePanier.objects.create(panier=panier, variante=variante, quantite=quantite)

        reponse = PanierSerializer(_charge(panier)).data
        reponse["ignorees"] = ignorees
        return Response(reponse)
