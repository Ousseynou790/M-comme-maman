from django.contrib import admin

from .models import Bandeau, EntreeJournal, Reglages


@admin.register(Reglages)
class ReglagesAdmin(admin.ModelAdmin):
    """Une seule ligne : on empêche d'en créer une deuxième ou de la supprimer."""

    def has_add_permission(self, request):
        return not Reglages.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Bandeau)
class BandeauAdmin(admin.ModelAdmin):
    list_display = ["__str__", "etiquette", "active", "ordre"]
    list_editable = ["active", "ordre"]


@admin.register(EntreeJournal)
class EntreeJournalAdmin(admin.ModelAdmin):
    list_display = ["date", "nom_auteur", "action", "cible"]
    list_filter = ["date"]
    search_fields = ["nom_auteur", "cible"]
    readonly_fields = ["date"]

    def has_add_permission(self, request):
        return False
