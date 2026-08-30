"""
Ce que coûte une commande.

Une seule règle gouverne ce fichier : **rien de ce que le navigateur annonce
n'est retenu**. Ni le prix d'un article, ni les frais de livraison, ni la
remise, ni le total. Tout est refait ici, depuis la base.
"""

from dataclasses import dataclass, field

from django.utils import timezone

from vitrine.models import Reglages

from .models import Campagne, Commande
from .remises import campagnes_automatiques, prix_effectif


class ErreurTarification(Exception):
    """Ce qui empêche la commande d'aboutir, dit à la cliente."""


@dataclass
class LigneCalculee:
    variante: object
    quantite: int
    prix_unitaire: int

    @property
    def sous_total(self) -> int:
        return self.prix_unitaire * self.quantite


@dataclass
class Devis:
    """Le détail chiffré d'un panier, prêt à devenir une commande."""

    lignes: list[LigneCalculee] = field(default_factory=list)
    sous_total: int = 0
    frais_livraison: int = 0
    remise: int = 0
    code_promo: str = ""
    total: int = 0
    campagne: Campagne | None = None


def chiffrer(lignes_demandees, zone: str, code_promo: str = "", cliente=None) -> Devis:
    """
    Chiffre un panier.

    `lignes_demandees` est une suite de couples (variante, quantité). Le prix
    vient du produit en base ; celui qu'aurait envoyé le navigateur n'est même
    pas lu.
    """
    if not lignes_demandees:
        raise ErreurTarification("Le panier est vide.")

    reglages = Reglages.actuels()
    devis = Devis()

    # Les campagnes en cours sont lues une fois pour tout le panier : chaque
    # ligne les réinterrogerait sinon.
    campagnes = campagnes_automatiques()

    for variante, quantite in lignes_demandees:
        if quantite < 1:
            raise ErreurTarification("Une quantité doit être d'au moins un article.")
        if variante.produit.statut != variante.produit.Statut.PUBLIE:
            raise ErreurTarification(f"« {variante.produit.nom} » n'est plus en vente.")
        if variante.stock < quantite:
            raise ErreurTarification(
                f"« {variante.produit.nom} » en {variante.taille.valeur} : "
                f"il n'en reste que {variante.stock}."
            )
        # Le prix retenu est celui qu'affiche la boutique, remise comprise :
        # annoncer 9 600 F et facturer 12 000 F serait pire que ne pas remiser.
        devis.lignes.append(
            LigneCalculee(
                variante=variante,
                quantite=quantite,
                prix_unitaire=prix_effectif(variante.produit, campagnes),
            )
        )

    devis.sous_total = sum(ligne.sous_total for ligne in devis.lignes)
    devis.frais_livraison = reglages.frais_pour(zone, devis.sous_total)

    if code_promo:
        devis.campagne = _campagne_valide(code_promo, devis.sous_total, cliente)
        devis.remise = _remise(devis.campagne, devis.sous_total)
        devis.code_promo = devis.campagne.code

    devis.total = max(0, devis.sous_total + devis.frais_livraison - devis.remise)
    return devis


def _campagne_valide(code: str, sous_total: int, cliente) -> Campagne:
    """
    Retrouve la campagne et vérifie qu'elle s'applique vraiment.

    Existence, fenêtre de validité, et la condition posée à la saisie : première
    commande ou montant minimum. Le front affichait la remise sans rien vérifier.
    """
    try:
        campagne = Campagne.objects.get(code__iexact=code.strip(), active=True)
    except Campagne.DoesNotExist:
        raise ErreurTarification("Ce code de réduction n'existe pas.")

    aujourdhui = timezone.localdate()
    if aujourdhui < campagne.date_effet:
        raise ErreurTarification("Ce code n'est pas encore actif.")
    if aujourdhui > campagne.date_fin:
        raise ErreurTarification("Ce code a expiré.")

    if campagne.portee == Campagne.Portee.COMMANDE:
        if campagne.condition == Campagne.Condition.MONTANT_MINIMUM:
            if sous_total < campagne.montant_minimum:
                raise ErreurTarification(
                    f"Ce code s'applique à partir de {campagne.montant_minimum:,} F."
                    .replace(",", " ")
                )
        elif campagne.condition == Campagne.Condition.PREMIERE:
            # Sans compte, on ne peut pas savoir si c'est une première commande :
            # on refuse plutôt que d'offrir la remise à chaque visiteur anonyme.
            if cliente is None or not cliente.is_authenticated:
                raise ErreurTarification(
                    "Ce code est réservé à la première commande : connectez-vous pour en profiter."
                )
            if Commande.objects.filter(cliente=cliente).exists():
                raise ErreurTarification("Ce code est réservé à la première commande.")

    return campagne


def _remise(campagne: Campagne, sous_total: int) -> int:
    if campagne.type == Campagne.Type.POURCENTAGE:
        return round(sous_total * campagne.valeur / 100)
    # Une remise fixe ne descend pas le panier sous zéro.
    return min(campagne.valeur, sous_total)


def prochaine_reference() -> str:
    """
    La référence lisible d'une commande : MCM-10240, MCM-10241…

    Tirée du dernier numéro utilisé plutôt que d'un compteur séparé : une
    référence doit rester devinable à l'œil quand la gérante la lit au téléphone.
    """
    derniere = (
        Commande.objects.filter(reference__startswith="MCM-")
        .order_by("-reference")
        .values_list("reference", flat=True)
        .first()
    )
    numero = 10_240
    if derniere:
        try:
            numero = int(derniere.split("-")[1])
        except (IndexError, ValueError):
            pass
    return f"MCM-{numero + 1}"
