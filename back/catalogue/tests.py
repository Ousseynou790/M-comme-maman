"""
Ce que le catalogue doit garantir.

Deux préoccupations : la vitrine ne voit que ce qui la regarde, et le
back-office ne peut pas publier n'importe quoi.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Coloris, Matiere, Media, MouvementStock, PhotoProduit, Produit, Rayon, Taille, Variante
from .recherche import mots, normaliser

Utilisateur = get_user_model()


def fabriquer_produit(nom="Robe de fête écrue", slug="robe-fete", sku="RBF-001",
                      statut=Produit.Statut.PUBLIE, prix=11000, avec_photo=True,
                      description="Robe sans manches en satin écru, jupe en plumetis, doublure intégrale.",
                      rayon=None, stock=5):
    rayon = rayon or Rayon.objects.get_or_create(nom="Robes & jupes", defaults={"slug": "robes-jupes"})[0]
    produit = Produit.objects.create(
        nom=nom, slug=slug, sku=sku, prix=prix, description=description,
        rayon=rayon, statut=statut,
    )
    if avec_photo:
        media = Media.objects.get_or_create(url=f"https://exemple.test/{slug}.jpg",
                                            defaults={"nom": nom})[0]
        PhotoProduit.objects.create(produit=produit, media=media, position=0)
    taille = Taille.objects.get_or_create(valeur="4", defaults={"repere": "4 ans", "ordre": 6})[0]
    coloris = Coloris.objects.get_or_create(nom="Écru", defaults={"hexa": "#efe6da"})[0]
    Variante.objects.create(produit=produit, taille=taille, coloris=coloris,
                            sku=f"{sku}-4", stock=stock)
    return produit


class RechercheTest(TestCase):
    def test_les_accents_sont_ignores(self):
        self.assertEqual(normaliser("Robe d'été"), "robe d ete")

    def test_les_synonymes_sont_traduits(self):
        self.assertIn("chaussures", mots("baskets"))
        self.assertIn("0-1", mots("bébé"))


class ReferentielsUniquesTest(APITestCase):
    def setUp(self):
        gerante = Utilisateur.objects.create_user(
            email="referentiels@test.sn",
            nom="Gérante",
            password="motdepasse123",
            role=Utilisateur.Role.GERANTE,
        )
        self.client.force_authenticate(gerante)

    def test_une_taille_ne_se_duplique_pas_avec_une_autre_casse(self):
        Taille.objects.create(valeur="L")
        reponse = self.client.post(
            reverse("taille-list"),
            {"valeur": " l ", "repere": "", "ordre": 1},
            format="json",
        )
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_un_coloris_ne_se_duplique_pas_avec_une_autre_casse(self):
        Coloris.objects.create(nom="Rose poudré", hexa="#e8b7c8")
        reponse = self.client.post(
            reverse("coloris-list"),
            {"nom": " rose   POUDRÉ ", "hexa": "#abcdef"},
            format="json",
        )
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_une_teinte_ne_peut_pas_porter_deux_noms(self):
        Coloris.objects.create(nom="Rose", hexa="#e0417f")
        reponse = self.client.post(
            reverse("coloris-list"),
            {"nom": "Framboise", "hexa": "#E0417F"},
            format="json",
        )
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_une_matiere_ne_se_duplique_pas_avec_une_autre_casse(self):
        Matiere.objects.create(nom="Coton biologique")
        reponse = self.client.post(
            reverse("matiere-list"),
            {"nom": "  coton BIOLOGIQUE  "},
            format="json",
        )
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)


class CataloguePublicTest(APITestCase):
    def setUp(self):
        self.publie = fabriquer_produit()
        self.brouillon = fabriquer_produit(
            nom="Fiche en cours", slug="fiche-en-cours", sku="BRO-001",
            statut=Produit.Statut.BROUILLON,
        )

    def test_la_boutique_est_lisible_sans_compte(self):
        reponse = self.client.get(reverse("produit-public-list"))
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)

    def test_un_brouillon_n_apparait_jamais_en_boutique(self):
        liste = self.client.get(reverse("produit-public-list")).data["results"]
        self.assertEqual([p["slug"] for p in liste], ["robe-fete"])

    def test_un_brouillon_reste_introuvable_meme_par_son_adresse(self):
        reponse = self.client.get(reverse("produit-public-detail", args=["fiche-en-cours"]))
        self.assertEqual(reponse.status_code, status.HTTP_404_NOT_FOUND)

    def test_la_fiche_publique_ne_montre_ni_stock_ni_statut(self):
        fiche = self.client.get(reverse("produit-public-detail", args=["robe-fete"])).data
        self.assertNotIn("statut", fiche)
        self.assertNotIn("stock_total", fiche)
        # La disponibilité, oui : c'est elle qui grise le bouton.
        self.assertIn("en_rupture", fiche)

    def test_la_recherche_ignore_les_accents(self):
        reponse = self.client.get(reverse("produit-public-list"), {"q": "fete"})
        self.assertEqual(len(reponse.data["results"]), 1)

    def test_le_filtre_par_rayon(self):
        autre = Rayon.objects.create(nom="Chaussures", slug="chaussures")
        fabriquer_produit(nom="Babies", slug="babies", sku="CHS-001", rayon=autre)
        reponse = self.client.get(reverse("produit-public-list"), {"rayon": "chaussures"})
        self.assertEqual([p["slug"] for p in reponse.data["results"]], ["babies"])

    def test_le_tri_par_prix(self):
        fabriquer_produit(nom="Petit prix", slug="petit-prix", sku="PET-001", prix=3000)
        reponse = self.client.get(reverse("produit-public-list"), {"tri": "prix-croissant"})
        prix = [p["prix"] for p in reponse.data["results"]]
        self.assertEqual(prix, sorted(prix))


class PublicationTest(APITestCase):
    def setUp(self):
        self.gerante = Utilisateur.objects.create_user(
            email="gerante@test.sn", nom="Gérante", password="motdepasse123",
            role=Utilisateur.Role.GERANTE,
        )
        self.cliente = Utilisateur.objects.create_user(
            email="cliente@test.sn", nom="Cliente", password="motdepasse123"
        )

    def test_une_cliente_n_entre_pas_dans_la_gestion(self):
        self.client.force_authenticate(self.cliente)
        reponse = self.client.get(reverse("produit-gestion-list"))
        self.assertEqual(reponse.status_code, status.HTTP_403_FORBIDDEN)

    def test_un_visiteur_n_entre_pas_dans_la_gestion(self):
        reponse = self.client.get(reverse("produit-gestion-list"))
        self.assertIn(reponse.status_code, {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN})

    def test_une_fiche_incomplete_ne_se_publie_pas(self):
        """Le garde-fou de l'audit : c'est lui qui manquait pour « Safari enfant »."""
        self.client.force_authenticate(self.gerante)
        incomplete = fabriquer_produit(
            nom="Sans", slug="sans-rien", sku="SAN-001", prix=0,
            avec_photo=False, description="court", statut=Produit.Statut.BROUILLON,
        )
        reponse = self.client.post(reverse("produit-gestion-publier", args=[incomplete.pk]))
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("un prix supérieur à zéro", reponse.data["manques"])
        self.assertIn("au moins une photo", reponse.data["manques"])
        incomplete.refresh_from_db()
        self.assertEqual(incomplete.statut, Produit.Statut.BROUILLON)

    def test_une_fiche_complete_se_publie(self):
        self.client.force_authenticate(self.gerante)
        prete = fabriquer_produit(nom="Prête à publier", slug="prete", sku="PRE-001",
                                  statut=Produit.Statut.BROUILLON)
        reponse = self.client.post(reverse("produit-gestion-publier", args=[prete.pk]))
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        prete.refresh_from_db()
        self.assertEqual(prete.statut, Produit.Statut.PUBLIE)

    def test_le_statut_publie_est_refuse_en_modification_directe(self):
        """Passer par PATCH plutôt que par l'action ne contourne pas le contrôle."""
        self.client.force_authenticate(self.gerante)
        incomplete = fabriquer_produit(
            nom="Sans", slug="sans-photo", sku="SAN-002", avec_photo=False,
            description="trop court", statut=Produit.Statut.BROUILLON,
        )
        reponse = self.client.patch(
            reverse("produit-gestion-detail", args=[incomplete.pk]),
            {"statut": "publie"}, format="json",
        )
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_archiver_plutot_que_supprimer(self):
        self.client.force_authenticate(self.gerante)
        produit = fabriquer_produit(nom="À retirer", slug="a-retirer", sku="RET-001")
        self.client.post(reverse("produit-gestion-archiver", args=[produit.pk]))
        produit.refresh_from_db()
        self.assertEqual(produit.statut, Produit.Statut.ARCHIVE)
        # Archivé, donc invisible en boutique — mais toujours en base.
        liste = self.client.get(reverse("produit-public-list")).data["results"]
        self.assertNotIn("a-retirer", [p["slug"] for p in liste])


class StockTest(APITestCase):
    def setUp(self):
        self.gerante = Utilisateur.objects.create_user(
            email="g@test.sn", nom="G", password="motdepasse123", role=Utilisateur.Role.GERANTE
        )
        self.client.force_authenticate(self.gerante)
        self.produit = fabriquer_produit(stock=10)
        self.variante = self.produit.variantes.first()

    def test_un_ajustement_laisse_une_trace(self):
        reponse = self.client.post(
            reverse("variante-ajuster", args=[self.variante.pk]),
            {"quantite": 12, "motif": "reappro"}, format="json",
        )
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.variante.refresh_from_db()
        self.assertEqual(self.variante.stock, 22)
        mouvement = MouvementStock.objects.get(variante=self.variante)
        self.assertEqual(mouvement.quantite, 12)
        self.assertEqual(mouvement.reste, 22)
        self.assertEqual(mouvement.auteur, self.gerante)

    def test_on_ne_descend_pas_sous_zero(self):
        reponse = self.client.post(
            reverse("variante-ajuster", args=[self.variante.pk]),
            {"quantite": -50}, format="json",
        )
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.variante.refresh_from_db()
        self.assertEqual(self.variante.stock, 10)


class PhotothequeTest(APITestCase):
    def setUp(self):
        self.gerante = Utilisateur.objects.create_user(
            email="g2@test.sn", nom="G", password="motdepasse123", role=Utilisateur.Role.GERANTE
        )
        self.client.force_authenticate(self.gerante)

    def test_une_image_en_service_ne_se_supprime_pas(self):
        produit = fabriquer_produit()
        media = produit.photos.first().media
        reponse = self.client.delete(reverse("media-detail", args=[media.pk]))
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Media.objects.filter(pk=media.pk).exists())

    def test_un_rayon_qui_porte_des_produits_ne_se_supprime_pas(self):
        produit = fabriquer_produit()
        reponse = self.client.delete(reverse("rayon-gestion-detail", args=[produit.rayon.pk]))
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_un_brouillon_peut_etre_supprime_avec_son_rayon(self):
        produit = fabriquer_produit(
            slug="brouillon-supprime", sku="BRO-SUP", statut=Produit.Statut.BROUILLON,
        )
        rayon_id = produit.rayon_id
        url = reverse("rayon-gestion-detail", args=[rayon_id]) + "?brouillons=supprimer"
        reponse = self.client.delete(url)
        self.assertEqual(reponse.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Produit.objects.filter(pk=produit.pk).exists())
        self.assertFalse(Rayon.objects.filter(pk=rayon_id).exists())

    def test_un_brouillon_peut_etre_deplace_avant_la_suppression_du_rayon(self):
        produit = fabriquer_produit(
            slug="brouillon-deplace", sku="BRO-DEP", statut=Produit.Statut.BROUILLON,
        )
        ancien_rayon = produit.rayon
        destination = Rayon.objects.create(nom="Destination", slug="destination")
        url = (
            reverse("rayon-gestion-detail", args=[ancien_rayon.pk])
            + f"?brouillons=deplacer&destination={destination.pk}"
        )
        reponse = self.client.delete(url)
        self.assertEqual(reponse.status_code, status.HTTP_204_NO_CONTENT)
        produit.refresh_from_db()
        self.assertEqual(produit.rayon, destination)
        self.assertFalse(Rayon.objects.filter(pk=ancien_rayon.pk).exists())
