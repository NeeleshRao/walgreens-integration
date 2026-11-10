from django.conf import settings
from walgreens import client

def get_store_details(store_number):
    return client.post("/api/stores/details/v1", {
        "storeNo": str(store_number),
        "appVer": settings.WALGREENS_APP_VER,
    })
