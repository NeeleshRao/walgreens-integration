from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.views.generic import TemplateView

from scheduling.api import BadRequest, client_name, json_api, require, check_date, check_match
from scheduling.constants import CHANNELS, GENDERS, SMS_CONSENT_TEXT
from . import services


class BookingIndexView(TemplateView):
    template_name = "booking/index.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["sms_consent"] = SMS_CONSENT_TEXT
        ctx["channels"] = CHANNELS
        ctx["genders"] = GENDERS
        return ctx


def _engagement_id(payload):
    require(payload, "engagementId")
    return check_match(str(payload["engagementId"]).strip(), r".{1,200}", "engagementId is invalid")


@json_api
def hold(request, payload):
    client_name()
    require(payload, "locationId", "appointmentDate", "slot", "channel", "vaccines")
    check_match(payload["appointmentDate"], r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}",
                "appointmentDate must look like 2026-11-12T09:30:00-06:00")
    check_match(payload["slot"], r"\d{1,2}:\d{2}\s?[aApP][mM]", 'slot must look like "09:30 am"')
    if payload["channel"] not in CHANNELS:
        raise BadRequest(f"channel must be one of {CHANNELS}")

    raw = payload["vaccines"]
    if not isinstance(raw, list) or not raw:
        raise BadRequest("vaccines must be a non-empty list")
    vaccines = []
    for v in raw:
        if not isinstance(v, dict) or not v.get("code") or not v.get("productId"):
            raise BadRequest("each vaccine needs code and productId")
        vaccines.append({
            "code": str(v["code"]),
            "productId": str(v["productId"]),
            "rxRequired": v.get("rxRequired") in (True, "true"),
        })

    responses = payload.get("userResponses")
    if responses is not None and not isinstance(responses, list):
        raise BadRequest("userResponses must be a list")

    return services.hold_appointment(
        str(payload["locationId"]), payload["appointmentDate"], payload["slot"],
        payload["channel"], vaccines, responses,
    )


@json_api
def patient(request, payload):
    client_name()
    engagement_id = _engagement_id(payload)
    require(payload, "firstName", "lastName", "dob", "gender", "phone", "email", "smsConsent")
    check_date(payload["dob"], "dob")
    check_match(payload["phone"], r"\d{3}-\d{3}-\d{4}", "phone must be ###-###-####")
    if payload["gender"] not in GENDERS:
        raise BadRequest(f"gender must be one of {GENDERS}")
    if payload["smsConsent"] not in ("Agree", "Disagree"):
        raise BadRequest("smsConsent must be Agree or Disagree")
    try:
        validate_email(payload["email"])
    except ValidationError:
        raise BadRequest("email is invalid")
    return services.attach_patient(engagement_id, payload)


@json_api
def confirm(request, payload):
    return services.confirm_appointment(_engagement_id(payload))
