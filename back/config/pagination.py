"""
La pagination de l'API.

`PageNumberPagination` de DRF ignore `?page_size=` tant qu'on ne lui a pas dit
quel paramètre écouter. Sans cette classe, un client qui demande deux cents
lignes en reçoit vingt-quatre sans que rien ne le signale : la réponse a l'air
complète, elle porte juste un `next` que personne ne suit.

Le plafond existe pour que « toutes les lignes » reste une demande bornée : une
table qui grossit ne doit pas pouvoir être tirée d'un seul coup par mégarde.
"""

from rest_framework.pagination import PageNumberPagination


class Pagination(PageNumberPagination):
    page_size_query_param = "page_size"
    max_page_size = 500
