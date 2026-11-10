from django.views.generic import TemplateView

from scheduling.api import json_api, require, check_date, check_match
from . import services


class EligibilityIndexView(TemplateView):
    template_name = "eligibility/index.html"


@json_api
def check(request, payload):
    require(payload, "state", "dob")
    state = check_match(str(payload["state"]).upper(), r"[A-Z]{2}", "state must be a 2-letter code")
    dob = check_date(payload["dob"], "dob")
    return services.check_eligibility(state, dob)
