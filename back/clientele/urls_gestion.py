"""La liste des clientes, réservée au back-office."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ClienteGestionViewSet

routeur = DefaultRouter()
routeur.register("clientes", ClienteGestionViewSet, basename="cliente-gestion")

urlpatterns = [path("", include(routeur.urls))]
