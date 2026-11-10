from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.generic import TemplateView

from walgreens.client import WalgreensAPIError
from . import services
import re

from .filters import ALLOWED_FILTERS, FILTER_GROUPS

def _filters(request):
    """Selected filter codes from ?f=a&f=b. Raises ValueError on unknown codes."""
    selected = request.GET.getlist("f")
    if not set(selected) <= ALLOWED_FILTERS:
        raise ValueError("unknown filter option")
    return selected


class IndexView(TemplateView):
    template_name = "storelocator/index.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["filter_groups"] = FILTER_GROUPS
        return ctx




@require_GET
def search_geo(request):
    try:
        lat = float(request.GET["lat"])
        lng = float(request.GET["lng"])
        radius = int(request.GET.get("r", 10))
        page_size = int(request.GET.get("s", 10))
        page = int(request.GET.get("p", 1))
        filter_options = _filters(request)
    except (KeyError, ValueError):
        return JsonResponse({"error": "lat and lng are required and must be numbers"}, status=400)

    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return JsonResponse({"error": "lat/lng out of range"}, status=400)

    try:
        result = services.search_by_geolocation(lat, lng, radius, page_size, page, filter_options)
    except WalgreensAPIError as exc:
        return JsonResponse({"error": str(exc), "details": exc.payload}, status=exc.status)

    return JsonResponse(result)

@require_GET
def search_address(request):
    address = request.GET.get("address", "").strip()
    if not address:
        return JsonResponse({"error": "address is required"}, status=400)

    try:
        radius = int(request.GET.get("r", 10))
        page_size = int(request.GET.get("s", 10))
        page = int(request.GET.get("p", 1))
        filter_options = _filters(request)

    except ValueError:
        return JsonResponse({"error": "r, s and p must be integers"}, status=400)

    try:
        result = services.search_by_address(address, radius, page_size, page, filter_options)
    except WalgreensAPIError as exc:
        return JsonResponse({"error": str(exc), "details": exc.payload}, status=exc.status)

    return JsonResponse(result)

@require_GET
def search_zip(request):
    zip_code = request.GET.get("zip", "").strip()
    if not re.fullmatch(r"\d{5}", zip_code):
        return JsonResponse({"error": "zip must be a 5-digit ZIP code"}, status=400)

    try:
        radius, page_size, page = _paging(request)
        filter_options = _filters(request)
    except ValueError:
        return JsonResponse({"error": "r, s and p must be integers"}, status=400)

    try:
        result = services.search_by_zip(zip_code, radius, page_size, page, filter_options)
    except WalgreensAPIError as exc:
        return JsonResponse({"error": str(exc), "details": exc.payload}, status=exc.status)

    return JsonResponse(result)


def _paging(request):
    """Parse radius/page size/page from the query string. Raises ValueError if not integers."""
    return (
        int(request.GET.get("r", 10)),
        int(request.GET.get("s", 10)),
        int(request.GET.get("p", 1)),
    )
