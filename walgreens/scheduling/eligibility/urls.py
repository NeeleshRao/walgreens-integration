from django.urls import path
from . import views

urlpatterns = [
    path("", views.EligibilityIndexView.as_view(), name="index"),
    path("api/", views.check, name="check"),
]
