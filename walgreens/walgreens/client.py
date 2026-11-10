import time

import requests
from django.conf import settings


class WalgreensAPIError(Exception):
    def __init__(self, message, status=502, payload=None):
        super().__init__(message)
        self.status = status
        self.payload = payload


def request(method, path, body, timeout=10, api_key=None, aff_id=None):
    """Call Walgreens with credentials injected. Returns data plus debug info for the UI inspector."""
    url = f"{settings.WALGREENS_BASE_URL}{path}"
    api_key = api_key or settings.WALGREENS_API_KEY
    aff_id = aff_id or settings.WALGREENS_AFF_ID

    full_body = {
        "apiKey": api_key,
        "affId": aff_id,
        **body,
    }
    started = time.monotonic()
    try:
        resp = requests.request(method, url, json=full_body, timeout=timeout)
    except requests.Timeout:
        raise WalgreensAPIError("Walgreens API timed out", status=504)
    except requests.RequestException as exc:
        raise WalgreensAPIError(f"Could not reach Walgreens API: {exc}")

    elapsed_ms = round((time.monotonic() - started) * 1000)

    text = resp.text.strip()
    if not text:                       # 201 / 204 responses have no body
        data = None
    else:
        try:
            data = resp.json()
        except ValueError:
            raise WalgreensAPIError(
                "Walgreens returned a non-JSON response",
                status=502 if resp.ok else resp.status_code,
                payload=text[:500],
            )

    if not resp.ok:
        raise WalgreensAPIError(f"Walgreens returned HTTP {resp.status_code}", status=resp.status_code, payload=data)

    return {
        "debug": {
            "url": url,
            "method": method,
            "request": {**full_body, "apiKey": "****", "affId": "****"},
            "status": resp.status_code,
            "elapsed_ms": elapsed_ms,
        },
        "data": data,
    }


def post(path, body, timeout=10, api_key=None, aff_id=None):
    return request("POST", path, body, timeout, api_key, aff_id)


def patch(path, body, timeout=10, api_key=None, aff_id=None):
    return request("PATCH", path, body, timeout, api_key, aff_id)
