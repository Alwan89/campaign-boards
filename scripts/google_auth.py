"""
google_auth.py — Google API service account authentication.

Loads credentials from credentials/service-account.json and returns
authenticated service objects for Google Sheets and Google Drive APIs.

Setup:
    1. Create a GCP project (or use existing)
    2. Enable Google Sheets API + Google Drive API
    3. Create a service account → download JSON key
    4. Save as credentials/service-account.json
    5. Share your Google Sheet with the service account email
    6. Share your Drive creative folder with the service account email
"""
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
]

_CREDENTIALS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "credentials",
    "service-account.json",
)


def _get_credentials(credentials_path=None):
    """Load service account credentials."""
    path = credentials_path or _CREDENTIALS_PATH
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Service account key not found at {path}.\n"
            "Download it from GCP Console → IAM → Service Accounts → Keys,\n"
            "then save as credentials/service-account.json"
        )
    return service_account.Credentials.from_service_account_file(path, scopes=SCOPES)


def get_sheets_service(credentials_path=None):
    """Return an authenticated Google Sheets API v4 service."""
    creds = _get_credentials(credentials_path)
    return build("sheets", "v4", credentials=creds)


def get_drive_service(credentials_path=None):
    """Return an authenticated Google Drive API v3 service."""
    creds = _get_credentials(credentials_path)
    return build("drive", "v3", credentials=creds)
