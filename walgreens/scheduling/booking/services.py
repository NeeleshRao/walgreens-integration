from django.conf import settings

from scheduling.api import call

BASE = "/api/vaccine/scheduling"


def hold_appointment(location_id, appointment_date, slot, channel, vaccines, user_responses):
    body = {
        "locationId": location_id,
        "appointmentDate": appointment_date,
        "slot": slot,
        "channel": channel,
        "client": settings.WALGREENS_SCHEDULING_CLIENT,
        "engagementType": "Guest",
        "vaccines": vaccines,
    }
    if user_responses:
        body["userResponses"] = user_responses
    return call("POST", f"{BASE}/hold/v1", body)


def attach_patient(engagement_id, p):
    return call("POST", f"{BASE}/patient/v1", {
        "engagementId": engagement_id,
        "partnerId": settings.WALGREENS_SCHEDULING_CLIENT,
        "firstName": p["firstName"],
        **({"middleName": p["middleName"]} if p.get("middleName") else {}),
        "lastName": p["lastName"],
        "dob": p["dob"],
        "gender": p["gender"],
        "contact": {
            "phones": [{"type": "Mobile", "number": p["phone"], "smsConsent": p["smsConsent"]}],
            "emails": [{"type": "Email", "address": p["email"]}],
        },
    })


def confirm_appointment(engagement_id):
    # Docs overview says POST, but the Confirm section and curl example use PATCH
    return call("PATCH", f"{BASE}/confirm/v1", {"engagementId": engagement_id})
