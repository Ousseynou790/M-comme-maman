"""
Point d'entrée du serveur.

Tout ce qui est API vit sous `/api/`. L'admin Django reste à part : il sert
l'équipe technique, pas la gérante — elle, elle a le back-office de la vitrine.
"""

from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/compte/", include("clientele.urls")),
    path("api/gestion/", include("clientele.urls_gestion")),
    path("api/", include("catalogue.urls")),
    path("api/", include("vitrine.urls")),
    path("api/", include("ventes.urls")),
]

# Les images envoyées depuis le back-office sont servies par Django, en
# développement comme en production. Ce n'est pas ce qu'on fait de mieux — un
# serveur de fichiers ou un CDN irait plus vite — mais la boutique n'en a que
# quelques centaines et cela évite un service de plus à installer.
#
# À savoir : sur une instance sans disque persistant, le dossier `media/` est
# reconstruit à chaque livraison. Les visuels envoyés depuis le back-office
# disparaissent alors. Monter un disque, ou passer à un stockage externe, avant
# que la gérante n'y range son catalogue.
urlpatterns += [
    re_path(
        rf"^{settings.MEDIA_URL.lstrip('/')}(?P<path>.*)$",
        serve,
        {"document_root": settings.MEDIA_ROOT},
    ),
]

admin.site.site_header = "M comme Maman — administration technique"
admin.site.site_title = "M comme Maman"
admin.site.index_title = "Données de la boutique"
