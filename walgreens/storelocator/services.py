from walgreens import client


def search_by_geolocation(lat, lng, radius=10, page_size=10, page=1):
    return client.post("/api/stores/search/v2", {
        "lat": str(lat),
        "lng": str(lng),
        "r": str(radius),
        "s": str(page_size),
        "p": str(page),
        "requestType": "locator",
    })

def search_by_address(address, radius=10, page_size=10, page=1):
    return client.post("/api/stores/search/v2", {
        "address": address,
        "r": str(radius),
        "s": str(page_size),
        "p": str(page),
        "requestType": "locator",
    })

def search_by_zip(zip_code, radius=10, page_size=10, page=1):
    return client.post("/api/stores/search/v2", {
        "zip": str(zip_code),
        "r": str(radius),
        "s": str(page_size),
        "p": str(page),
        "requestType": "locator",
    })
