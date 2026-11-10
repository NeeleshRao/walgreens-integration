from django.urls import path, include
from django.views.generic import RedirectView

app_name = "scheduling"

urlpatterns = [
    path("", RedirectView.as_view(pattern_name="scheduling:eligibility:index"), name="index"),
    path("eligibility/", include(("scheduling.eligibility.urls", "eligibility"))),
    path("timeslots/", include(("scheduling.timeslots.urls", "timeslots"))),
    path("booking/", include(("scheduling.booking.urls", "booking"))),
]
