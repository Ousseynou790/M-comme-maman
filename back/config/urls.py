"""
Point d'entrée du serveur.

Tout ce qui est API vit sous `/api/`. L'admin Django reste à part : il sert
l'équipe technique, pas la gérante — elle, elle a le back-office de la vitrine.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/compte/", include("clientele.urls")),
    path("api/gestion/", include("clientele.urls_gestion")),
    path("api/", include("catalogue.urls")),
    path("api/", include("vitrine.urls")),
    path("api/", include("ventes.urls")),
]

# En développement, c'est Django qui sert les images envoyées. En
# production, ce sera le serveur de fichiers — jamais celui-ci.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

admin.site.site_header = "M comme Maman — administration technique"
admin.site.site_title = "M comme Maman"
admin.site.index_title = "Données de la boutique"
