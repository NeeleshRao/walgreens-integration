from django.urls import path
from . import views

urlpatterns = [
    path("", views.InventoryIndexView.as_view(), name="index"),
    path("api/", views.store_inventory, name="lookup"),
]
