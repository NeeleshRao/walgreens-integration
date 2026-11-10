import json
import re
from datetime import datetime
from functools import wraps

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_POST

from walgreens import client
from walgreens.client import WalgreensAPIError


class BadRequest(Exception):
    """Raised by views for invalid input; becomes a 400 JSON response."""


def call(method, path, body):
    """Call Walgreens with the scheduling credentials."""
    return client.request(
        method,
        path,
        body,
        api_key=settings.WALGREENS_SCHEDULING_API_KEY,
        aff_id=settings.WALGREENS_SCHEDULING_AFF_ID,
    )


def client_name():
    if not settings.WALGREENS_SCHEDULING_CLIENT:
        raise BadRequest("WALGREENS_SCHEDULING_CLIENT is not set in .env")
    return settings.WALGREENS_SCHEDULING_CLIENT


def require(payload, *fields):
    missing = [f for f in fields if payload.get(f) in (None, "", [])]
    if missing:
        raise BadRequest(f"missing required field(s): {', '.join(missing)}")


def check_date(value, field):
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except (TypeError, ValueError):
        raise BadRequest(f"{field} must be YYYY-MM-DD")
    return value


def check_match(value, pattern, message):
    if not isinstance(value, str) or not re.fullmatch(pattern, value):
        raise BadRequest(message)
    return value


def json_api(view):
    """POST-only JSON endpoint: parses the body, maps errors to JSON responses.

    The wrapped view receives (request, payload) and returns the dict to send back.
    """
    @wraps(view)
    @require_POST
    def wrapper(request, *args, **kwargs):
        try:
            payload = json.loads(request.body or b"{}")
            if not isinstance(payload, dict):
                raise ValueError
        except ValueError:
            return JsonResponse({"error": "body must be a JSON object"}, status=400)
        try:
            return JsonResponse(view(request, payload, *args, **kwargs))
        except BadRequest as exc:
            return JsonResponse({"error": str(exc)}, status=400)
        except WalgreensAPIError as exc:
            return JsonResponse({"error": str(exc), "details": exc.payload}, status=exc.status)
    return wrapper
