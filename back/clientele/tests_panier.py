"""
Le panier serveur.

Il n'existe que pour une cliente connectée, et il ne ment jamais sur le stock :
une ligne devenue inservable reste visible, signalée, plutôt que de disparaître
en silence.
"""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from catalogue.models import Produit
from ventes.tests import commande_type, fabriquer_variante

Utilisateur = get_user_model()


class PanierTest(APITestCase):
    def setUp(self):
        self.variante = fabriquer_variante(prix=10000, stock=5)
        self.cliente = Utilisateur.objects.create_user(
            email="panier@test.sn", nom="Panier", password="motdepasse123"
        )
        self.client.force_authenticate(self.cliente)

    def test_le_panier_commence_vide(self):
        reponse = self.client.get(reverse("panier"))
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data["lignes"], [])
        self.assertEqual(reponse.data["sous_total"], 0)

    def test_ajouter_un_article(self):
        reponse = self.client.post(reverse("panier-lignes"),
                                   {"variante": self.variante.pk, "quantite": 2}, format="json")
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reponse.data["nombre_articles"], 2)
        self.assertEqual(reponse.data["sous_total"], 20000)

    def test_ajouter_deux_fois_augmente_la_quantite(self):
        """Deux clics sur « ajouter » ne créent pas deux lignes identiques."""
        self.client.post(reverse("panier-lignes"), {"variante": self.variante.pk},
                         format="json")
        reponse = self.client.post(reverse("panier-lignes"), {"variante": self.variante.pk},
                                   format="json")
        self.assertEqual(len(reponse.data["lignes"]), 1)
        self.assertEqual(reponse.data["lignes"][0]["quantite"], 2)

    def test_on_n_ajoute_pas_plus_que_le_stock(self):
        reponse = self.client.post(reverse("panier-lignes"),
                                   {"variante": self.variante.pk, "quantite": 9}, format="json")
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Il n'en reste que 5", str(reponse.data))

    def test_le_cumul_respecte_aussi_le_stock(self):
        self.client.post(reverse("panier-lignes"),
                         {"variante": self.variante.pk, "quantite": 4}, format="json")
        reponse = self.client.post(reverse("panier-lignes"),
                                   {"variante": self.variante.pk, "quantite": 3}, format="json")
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_changer_la_quantite(self):
        ajout = self.client.post(reverse("panier-lignes"), {"variante": self.variante.pk},
                                 format="json")
        ligne = ajout.data["lignes"][0]["id"]
        reponse = self.client.patch(reverse("panier-ligne", args=[ligne]), {"quantite": 3},
                                    format="json")
        self.assertEqual(reponse.data["sous_total"], 30000)

    def test_descendre_a_zero_retire_la_ligne(self):
        ajout = self.client.post(reverse("panier-lignes"), {"variante": self.variante.pk},
                                 format="json")
        ligne = ajout.data["lignes"][0]["id"]
        reponse = self.client.patch(reverse("panier-ligne", args=[ligne]), {"quantite": 0},
                                    format="json")
        self.assertEqual(reponse.data["lignes"], [])

    def test_retirer_une_ligne(self):
        ajout = self.client.post(reverse("panier-lignes"), {"variante": self.variante.pk},
                                 format="json")
        ligne = ajout.data["lignes"][0]["id"]
        reponse = self.client.delete(reverse("panier-ligne", args=[ligne]))
        self.assertEqual(reponse.data["lignes"], [])

    def test_vider_le_panier(self):
        self.client.post(reverse("panier-lignes"), {"variante": self.variante.pk}, format="json")
        self.client.delete(reverse("panier"))
        self.assertEqual(self.client.get(reverse("panier")).data["lignes"], [])

    def test_une_ligne_devenue_inservable_reste_visible_et_signalee(self):
        """Le panier ne maigrit pas tout seul : la cliente doit voir ce qui a changé."""
        self.client.post(reverse("panier-lignes"),
                         {"variante": self.variante.pk, "quantite": 3}, format="json")
        self.variante.stock = 1
        self.variante.save()

        panier = self.client.get(reverse("panier")).data
        self.assertEqual(len(panier["lignes"]), 1)
        self.assertFalse(panier["lignes"][0]["disponible"])
        self.assertFalse(panier["complet"])

    def test_un_brouillon_ne_s_ajoute_pas(self):
        self.variante.produit.statut = Produit.Statut.BROUILLON
        self.variante.produit.save()
        reponse = self.client.post(reverse("panier-lignes"), {"variante": self.variante.pk},
                                   format="json")
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_le_panier_est_ferme_aux_visiteurs(self):
        self.client.force_authenticate(None)
        reponse = self.client.get(reverse("panier"))
        self.assertIn(reponse.status_code,
                      {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN})

    def test_chacune_son_panier(self):
        autre = Utilisateur.objects.create_user(
            email="autre@test.sn", nom="Autre", password="motdepasse123"
        )
        self.client.post(reverse("panier-lignes"), {"variante": self.variante.pk}, format="json")
        self.client.force_authenticate(autre)
        self.assertEqual(self.client.get(reverse("panier")).data["lignes"], [])

    def test_commander_vide_le_panier(self):
        self.client.post(reverse("panier-lignes"), {"variante": self.variante.pk}, format="json")
        self.client.post(reverse("commande-list"), commande_type(self.variante), format="json")
        self.assertEqual(self.client.get(reverse("panier")).data["lignes"], [])


class FusionPanierTest(APITestCase):
    def setUp(self):
        self.variante = fabriquer_variante(prix=10000, stock=5)
        self.autre = fabriquer_variante(prix=7000, stock=4, slug="jupe", sku="JUP-100")
        self.cliente = Utilisateur.objects.create_user(
            email="fusion@test.sn", nom="Fusion", password="motdepasse123"
        )
        self.client.force_authenticate(self.cliente)

    def test_la_fusion_apporte_le_panier_du_navigateur(self):
        reponse = self.client.post(reverse("panier-fusionner"), {
            "lignes": [{"variante": self.variante.pk, "quantite": 2},
                       {"variante": self.autre.pk, "quantite": 1}],
        }, format="json")
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data["nombre_articles"], 3)

    def test_sur_un_article_commun_on_garde_la_plus_grande_quantite(self):
        """Additionner ferait doubler le panier d'une reconnexion sur le même appareil."""
        self.client.post(reverse("panier-lignes"),
                         {"variante": self.variante.pk, "quantite": 3}, format="json")
        reponse = self.client.post(reverse("panier-fusionner"), {
            "lignes": [{"variante": self.variante.pk, "quantite": 2}],
        }, format="json")
        self.assertEqual(reponse.data["lignes"][0]["quantite"], 3)

    def test_la_fusion_plafonne_au_stock(self):
        reponse = self.client.post(reverse("panier-fusionner"), {
            "lignes": [{"variante": self.variante.pk, "quantite": 40}],
        }, format="json")
        self.assertEqual(reponse.data["lignes"][0]["quantite"], 5)

    def test_un_article_epuise_est_signale_sans_bloquer_la_fusion(self):
        self.autre.stock = 0
        self.autre.save()
        reponse = self.client.post(reverse("panier-fusionner"), {
            "lignes": [{"variante": self.variante.pk, "quantite": 1},
                       {"variante": self.autre.pk, "quantite": 1}],
        }, format="json")
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(len(reponse.data["lignes"]), 1)
        self.assertEqual(reponse.data["ignorees"], [self.autre.produit.nom])
