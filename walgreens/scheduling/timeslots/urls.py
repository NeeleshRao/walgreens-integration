from django.urls import path
from . import views

urlpatterns = [
    path("", views.TimeslotsIndexView.as_view(), name="index"),
    path("api/", views.search, name="search"),
]
