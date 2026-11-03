from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.generic import TemplateView

from walgreens.client import WalgreensAPIError
from . import services


class IndexView(TemplateView):
    template_name = "storelocator/index.html"


@require_GET
def search_geo(request):
    try:
        lat = float(request.GET["lat"])
        lng = float(request.GET["lng"])
        radius = int(request.GET.get("r", 10))
        page_size = int(request.GET.get("s", 10))
        page = int(request.GET.get("p", 1))
    except (KeyError, ValueError):
        return JsonResponse({"error": "lat and lng are required and must be numbers"}, status=400)

    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return JsonResponse({"error": "lat/lng out of range"}, status=400)

    try:
        result = services.search_by_geolocation(lat, lng, radius, page_size, page)
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
    except ValueError:
        return JsonResponse({"error": "r, s and p must be integers"}, status=400)

    try:
        result = services.search_by_address(address, radius, page_size, page)
    except WalgreensAPIError as exc:
        return JsonResponse({"error": str(exc), "details": exc.payload}, status=exc.status)

    return JsonResponse(result)