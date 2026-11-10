from django.urls import path
from . import views

urlpatterns = [
    path("", views.BookingIndexView.as_view(), name="index"),
    path("api/hold/", views.hold, name="hold"),
    path("api/patient/", views.patient, name="patient"),
    path("api/confirm/", views.confirm, name="confirm"),
]
