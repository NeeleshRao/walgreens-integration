from django.conf import settings
from walgreens import client

def get_store_inventory(store_number):
    return client.post(
        "/api/products/inventory/v4",
        {"store": str(store_number), "appVer": settings.WALGREENS_APP_VER},
        api_key=settings.WALGREENS_INVENTORY_API_KEY,
        aff_id=settings.WALGREENS_INVENTORY_AFF_ID,
    )
