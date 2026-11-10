import re
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.generic import TemplateView
from walgreens.client import WalgreensAPIError
from . import services

class InventoryIndexView(TemplateView):
    template_name = "inventory/index.html"

@require_GET
def store_inventory(request):
    store = request.GET.get("store", "").strip()
    if not re.fullmatch(r"\d{1,6}", store):
        return JsonResponse({"error": "store must be a numeric store number"}, status=400)
    try:
        result = services.get_store_inventory(store)
    except WalgreensAPIError as exc:
        return JsonResponse({"error": str(exc), "details": exc.payload}, status=exc.status)
    return JsonResponse(result)
