from django.views.generic import TemplateView

from scheduling.api import BadRequest, json_api, require, check_date, check_match
from scheduling.constants import VACCINES
from . import services


class TimeslotsIndexView(TemplateView):
    template_name = "timeslots/index.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["vaccines"] = VACCINES
        return ctx


@json_api
def search(request, payload):
    require(payload, "state", "zipCode", "dob", "vaccine", "startDateTime", "latitude", "longitude")
    state = check_match(str(payload["state"]).upper(), r"[A-Z]{2}", "state must be a 2-letter code")
    zip_code = check_match(str(payload["zipCode"]), r"\d{5}", "zipCode must be 5 digits")
    dob = check_date(payload["dob"], "dob")
    start = check_date(payload["startDateTime"], "startDateTime")
    end = check_date(payload["endDateTime"], "endDateTime") if payload.get("endDateTime") else None

    vaccines = payload["vaccine"]
    if (not isinstance(vaccines, list) or not 1 <= len(vaccines) <= 4
            or not all(v in VACCINES for v in vaccines)):
        raise BadRequest("vaccine must be a list of 1-4 known vaccine codes")

    try:
        lat, lng = float(payload["latitude"]), float(payload["longitude"])
    except (TypeError, ValueError):
        raise BadRequest("latitude and longitude must be numbers")
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise BadRequest("latitude/longitude out of range")

    return services.search_timeslots(state, zip_code, dob, vaccines, start, end, lat, lng)
