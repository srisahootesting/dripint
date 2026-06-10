import os

from dotenv import load_dotenv

load_dotenv()

QIKINK_CLIENT_ID = os.getenv("QIKINK_CLIENT_ID")

QIKINK_CLIENT_SECRET = os.getenv("QIKINK_CLIENT_SECRET")


def test_qikink_credentials():

    return {
        "client_id_found": bool(QIKINK_CLIENT_ID),
        "client_secret_found": bool(QIKINK_CLIENT_SECRET),
        "client_id_preview": (
            QIKINK_CLIENT_ID[:6] + "..."
            if QIKINK_CLIENT_ID
            else None
        )
    }