from scheduling.api import call


def check_eligibility(state, dob):
    return call("POST", "/api/vaccine/scheduling/eligibility/v1", {"state": state, "dob": dob})
