import time

import requests
from django.conf import settings


class WalgreensAPIError(Exception):
    def __init__(self, message, status=502, payload=None):
        super().__init__(message)
        self.status = status
        self.payload = payload


def post(path, body, timeout=10):
    """POST to Walgreens with credentials injected. Returns data plus debug info for the UI inspector."""
    url = f"{settings.WALGREENS_BASE_URL}{path}"
    full_body = {
        "apiKey": settings.WALGREENS_API_KEY,
        "affId": settings.WALGREENS_AFF_ID,
        **body,
    }
    started = time.monotonic()
    try:
        resp = requests.post(url, json=full_body, timeout=timeout)
    except requests.Timeout:
        raise WalgreensAPIError("Walgreens API timed out", status=504)
    except requests.RequestException as exc:
        raise WalgreensAPIError(f"Could not reach Walgreens API: {exc}")

    elapsed_ms = round((time.monotonic() - started) * 1000)
    try:
        data = resp.json()
    except ValueError:
        raise WalgreensAPIError("Walgreens returned a non-JSON response", payload=resp.text[:500])

    if not resp.ok:
        raise WalgreensAPIError(f"Walgreens returned HTTP {resp.status_code}", status=resp.status_code, payload=data)

    return {
        "debug": {
            "url": url,
            "request": {**full_body, "apiKey": "****", "affId": "****"},
            "status": resp.status_code,
            "elapsed_ms": elapsed_ms,
        },
        "data": data,
    }