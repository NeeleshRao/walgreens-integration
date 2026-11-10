from walgreens import client
from walgreens.client import WalgreensAPIError


def _search(extra, radius, page_size, page, filter_options):
    body = {
        **extra,
        "r": str(radius),
        "s": str(page_size),
        "p": str(page),
        "requestType": "locator",
    }
    if filter_options:                      
        body["filterOptions"] = list(filter_options)
    
    try:
        return client.post("/api/stores/search/v2", body)
    except WalgreensAPIError as exc:
        if filter_options and exc.status >= 500:
            return {
                "debug": {"request": {**body, "apiKey": "****", "affId": "****"}, "status": exc.status},
                "data": {"results": []},
                "notice": "These filters aren't available in the sandbox, so no results were returned.",
            }
        raise


def search_by_geolocation(lat, lng, radius=10, page_size=10, page=1, filter_options=None):
    return _search({"lat": str(lat), "lng": str(lng)}, radius, page_size, page, filter_options)

def search_by_address(address, radius=10, page_size=10, page=1, filter_options=None):
    return _search({"address": address}, radius, page_size, page, filter_options)

def search_by_zip(zip_code, radius=10, page_size=10, page=1, filter_options=None):
    return _search({"zip": str(zip_code)}, radius, page_size, page, filter_options)

