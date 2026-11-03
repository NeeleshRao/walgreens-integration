from django.urls import path
from . import views

app_name = "storelocator"

urlpatterns = [
    path("", views.IndexView.as_view(), name="index"),
    path("api/search/geo/", views.search_geo, name="search_geo"),
    path("api/search/address/", views.search_address, name="search_address"),
    path("api/search/zip/", views.search_zip, name="search_zip"),
]
