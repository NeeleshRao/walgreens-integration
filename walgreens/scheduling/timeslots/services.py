from scheduling.api import call


def search_timeslots(state, zip_code, dob, vaccines, start, end, lat, lng):
    availability = {"startDateTime": start}
    if end:
        availability["endDateTime"] = end
    return call("POST", "/api/vaccine/scheduling/timeslots/v1", {
        "state": state,
        "zipCode": zip_code,
        "dob": dob,
        "vaccine": vaccines,
        "appointmentAvailability": availability,
        "position": {"latitude": lat, "longitude": lng},
        "isEligibility": False,   # appears in the doc's example request, not in its field table
    })
