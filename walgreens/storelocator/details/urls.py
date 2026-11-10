from django.urls import path
from . import views

urlpatterns = [
    path("", views.DetailsIndexView.as_view(), name="index"),
    path("api/", views.store_details, name="lookup"),
]
