import os
import time
import requests

from dotenv import load_dotenv

load_dotenv()

QIKINK_BASE_URL = os.getenv(
    "QIKINK_BASE_URL",
    "https://sandbox.qikink.com"
)

QIKINK_CLIENT_ID = os.getenv(
    "QIKINK_CLIENT_ID"
)

QIKINK_CLIENT_SECRET = os.getenv(
    "QIKINK_CLIENT_SECRET"
)

_cached_token = None
_token_expiry = 0


def test_qikink_credentials():

    return {
        "client_id_found": bool(QIKINK_CLIENT_ID),
        "client_secret_found": bool(QIKINK_CLIENT_SECRET),
        "base_url": QIKINK_BASE_URL,
        "client_id_preview": (
            str(QIKINK_CLIENT_ID)[:6] + "..."
            if QIKINK_CLIENT_ID
            else None
        )
    }


def get_access_token(force_refresh=False):

    global _cached_token
    global _token_expiry

    current_time = time.time()

    if (
        not force_refresh
        and _cached_token
        and current_time < _token_expiry
    ):
        return _cached_token

    url = f"{QIKINK_BASE_URL}/api/token"

    response = requests.post(
        url,
        data={
            "ClientId": QIKINK_CLIENT_ID,
            "client_secret": QIKINK_CLIENT_SECRET
        },
        timeout=30
    )

    response.raise_for_status()

    data = response.json()

    token = data.get("Accesstoken")

    if not token:
        raise Exception(
            f"Qikink token missing: {data}"
        )

    expires_in = int(
        data.get("expires_in", 3600)
    )

    _cached_token = token

    _token_expiry = (
        current_time + expires_in - 60
    )

    return token


def _get_headers():

    token = get_access_token()

    return {
        "ClientId": str(QIKINK_CLIENT_ID),
        "Accesstoken": token
    }


def get_orders():

    url = f"{QIKINK_BASE_URL}/api/order"

    response = requests.get(
        url,
        headers=_get_headers(),
        timeout=30
    )

    response.raise_for_status()

    return response.json()


def get_order(order_id):

    url = f"{QIKINK_BASE_URL}/api/order"

    response = requests.get(
        url,
        params={
            "id": order_id
        },
        headers=_get_headers(),
        timeout=30
    )

    response.raise_for_status()

    return response.json()


def create_order(payload):

    url = f"{QIKINK_BASE_URL}/api/order/create"

    response = requests.post(
        url,
        json=payload,
        headers=_get_headers(),
        timeout=60
    )

    response.raise_for_status()

    return response.json()