import os
import uuid
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load frontend .env for REACT_APP_BACKEND_URL
load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def api_base():
    assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
    return API


@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def registered_user(http, api_base):
    email = f"test_{uuid.uuid4().hex[:10]}@cvforge.dev"
    password = "TestPass123!"
    full_name = "Marie Dubois"
    r = http.post(f"{api_base}/auth/register",
                  json={"email": email, "password": password, "full_name": full_name},
                  timeout=30)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    return {
        "email": email,
        "password": password,
        "full_name": full_name,
        "token": data["access_token"],
        "user": data["user"],
    }


@pytest.fixture(scope="session")
def auth_headers(registered_user):
    return {
        "Authorization": f"Bearer {registered_user['token']}",
        "Content-Type": "application/json",
    }
