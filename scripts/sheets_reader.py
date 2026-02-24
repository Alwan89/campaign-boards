"""
sheets_reader.py — Read ad copy from a Google Sheet via the Sheets API.

Adapts the Google Sheets API response into the same format that
parse_ad_copy.py expects, then reuses its section extraction logic.

Also supports uploaded .xlsx files in Google Drive — if the Sheets API
fails with "not supported for this document", the file is downloaded via
the Drive API and parsed locally with pandas.

Usage:
    from scripts.sheets_reader import parse_copy_from_sheet
    copy_data = parse_copy_from_sheet("1ABC...xyz")
    # Returns: { "project_name": "...", "meta_ads": { ... } }
"""
import io
import re
import pandas as pd
from scripts.google_auth import get_sheets_service, get_drive_service


# Language column mapping (same as parse_ad_copy.py)
LANG_MAP = {
    1: "en",
    2: "zh_s",
    3: "zh_t",
    4: "kr",
    5: "fa",
}

# Tabs to skip when auto-detecting the copy tab
SKIP_TABS = {"lead form", "example mockups"}


def _download_xlsx_from_drive(file_id):
    """Download an .xlsx file from Google Drive and return {tab_name: DataFrame}."""
    service = get_drive_service()
    request = service.files().get_media(fileId=file_id)
    content = request.execute()
    return pd.read_excel(io.BytesIO(content), sheet_name=None, header=None)


def get_sheet_tabs(spreadsheet_id, service=None):
    """Return list of sheet/tab names in the spreadsheet."""
    if service is None:
        service = get_sheets_service()
    meta = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    return [s["properties"]["title"] for s in meta.get("sheets", [])]


def read_sheet_as_dataframe(spreadsheet_id, tab_name=None, service=None):
    """
    Fetch a Google Sheet tab and return as a pandas DataFrame.

    Produces the same shape as pd.read_excel(header=None) —
    column 0 = field labels, columns 1-5 = language values.
    """
    if service is None:
        service = get_sheets_service()

    # Auto-detect tab if not specified
    if tab_name is None:
        tabs = get_sheet_tabs(spreadsheet_id, service)
        for t in tabs:
            if t.lower() not in SKIP_TABS:
                tab_name = t
                break
        if tab_name is None:
            return pd.DataFrame(), None

    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=spreadsheet_id, range=tab_name)
        .execute()
    )
    rows = result.get("values", [])

    if not rows:
        return pd.DataFrame(), tab_name

    # Pad rows to uniform width (Sheets API omits trailing empty cells)
    max_cols = max(len(r) for r in rows)
    padded = [r + [""] * (max_cols - len(r)) for r in rows]

    df = pd.DataFrame(padded)
    return df, tab_name


def _get_copy(df, row_idx):
    """Extract multilingual copy from a row (same logic as parse_ad_copy.py)."""
    copy = {}
    for col_idx, lang_key in LANG_MAP.items():
        if col_idx < df.shape[1]:
            val = df.iloc[row_idx, col_idx]
            copy[lang_key] = str(val).strip() if pd.notna(val) and str(val).strip() else ""
    return copy


def _extract_meta_ads_section(df):
    """
    Find and extract the Meta Ads section from the ad copy sheet.

    Ported from parse_ad_copy.py — identical logic, operates on a DataFrame
    regardless of whether it came from xlsx or Sheets API.
    """
    meta_ads = {}
    in_meta = False
    current_group = None
    current_fields = {}

    for i in range(df.shape[0]):
        label = str(df.iloc[i, 0]).strip() if pd.notna(df.iloc[i, 0]) else ""
        label_lower = label.lower()

        # Detect Meta Ads section start
        if "meta ads" in label_lower:
            in_meta = True
            continue

        # Detect section exit
        if in_meta and any(
            kw in label_lower
            for kw in ("google ads", "linkedin ads", "wechat ads", "priority #")
        ):
            if current_group and current_fields:
                meta_ads[current_group] = current_fields
            in_meta = False
            current_group = None
            current_fields = {}
            continue

        if not in_meta:
            continue

        # Detect creative group headers
        # A group header has text in column 0 but NO copy in column 1
        if label and not any(
            label_lower.startswith(kw)
            for kw in ("text", "primary text", "headline", "description", "button", "link", "cta")
        ):
            col1 = df.iloc[i, 1] if 1 < df.shape[1] else None
            if pd.isna(col1) or str(col1).strip() == "":
                if current_group and current_fields:
                    meta_ads[current_group] = current_fields
                current_group = label
                current_fields = {}
                continue

        # Parse copy fields
        if current_group:
            if label_lower.startswith("text") or label_lower.startswith("primary text"):
                current_fields["text"] = _get_copy(df, i)
            elif label_lower.startswith("headline"):
                num_match = re.search(r"(\d+)", label)
                key = f"headline_{num_match.group(1)}" if num_match else "headline"
                current_fields[key] = _get_copy(df, i)
            elif label_lower.startswith("description"):
                num_match = re.search(r"(\d+)", label)
                key = f"description_{num_match.group(1)}" if num_match else "description"
                current_fields[key] = _get_copy(df, i)
            elif label_lower.startswith("button") or label_lower.startswith("cta"):
                current_fields["cta"] = _get_copy(df, i)
            elif label_lower.startswith("link"):
                current_fields["link"] = _get_copy(df, i)

    # Save last group
    if current_group and current_fields:
        meta_ads[current_group] = current_fields

    return meta_ads


def _extract_google_ads_section(df):
    """
    Find and extract the Google Ads sections from the ad copy sheet.

    Returns a dict of ad groups, each with their copy fields.
    Handles: Search Responsive Ads, Demand Gen, Display, Callout Extensions,
    Sitelink Extensions, Structured Snippets.
    """
    google_ads = {}
    in_google = False
    current_group = None
    current_fields = {}

    for i in range(df.shape[0]):
        label = str(df.iloc[i, 0]).strip() if pd.notna(df.iloc[i, 0]) else ""
        label_lower = label.lower()

        # Detect Google Ads section start
        if "google ads" in label_lower and "meta" not in label_lower:
            in_google = True
            continue

        # Detect section exit
        if in_google and any(
            kw in label_lower
            for kw in ("meta ads", "linkedin ads", "wechat ads", "youtube")
        ):
            if current_group and current_fields:
                google_ads[current_group] = current_fields
            in_google = False
            current_group = None
            current_fields = {}
            continue

        # Also exit on priority headers
        if in_google and "priority #" in label_lower:
            if current_group and current_fields:
                google_ads[current_group] = current_fields
            in_google = False
            current_group = None
            current_fields = {}
            continue

        if not in_google:
            continue

        # Detect group headers (text in col 0, no copy in col 1)
        is_field = any(
            label_lower.startswith(kw)
            for kw in ("text", "primary text", "headline", "description", "button",
                        "link", "cta", "business name", "callout", "amenity",
                        "sitelink", "main headline", "main description")
        )
        if label and not is_field:
            col1 = df.iloc[i, 1] if 1 < df.shape[1] else None
            if pd.isna(col1) or str(col1).strip() == "":
                if current_group and current_fields:
                    google_ads[current_group] = current_fields
                current_group = label
                current_fields = {}
                continue

        # Parse copy fields
        if current_group:
            if label_lower.startswith("business name"):
                current_fields["business_name"] = _get_copy(df, i)
            elif label_lower.startswith("main headline"):
                current_fields["main_headline"] = _get_copy(df, i)
            elif label_lower.startswith("main description"):
                current_fields["main_description"] = _get_copy(df, i)
            elif label_lower.startswith("headline"):
                num_match = re.search(r"(\d+)", label)
                key = f"headline_{num_match.group(1)}" if num_match else "headline"
                current_fields[key] = _get_copy(df, i)
            elif label_lower.startswith("description"):
                num_match = re.search(r"(\d+)", label)
                key = f"description_{num_match.group(1)}" if num_match else "description"
                current_fields[key] = _get_copy(df, i)
            elif label_lower.startswith("button") or label_lower.startswith("cta"):
                current_fields["cta"] = _get_copy(df, i)
            elif label_lower.startswith("link"):
                current_fields["link"] = _get_copy(df, i)
            elif label_lower.startswith("callout"):
                num_match = re.search(r"(\d+)", label)
                key = f"callout_{num_match.group(1)}" if num_match else "callout"
                current_fields[key] = _get_copy(df, i)
            elif label_lower.startswith("amenity"):
                num_match = re.search(r"(\d+)", label)
                key = f"amenity_{num_match.group(1)}" if num_match else "amenity"
                current_fields[key] = _get_copy(df, i)
            elif label_lower.startswith("sitelink"):
                num_match = re.search(r"(\d+)", label)
                key = f"sitelink_{num_match.group(1)}" if num_match else "sitelink"
                current_fields[key] = _get_copy(df, i)

    # Save last group
    if current_group and current_fields:
        google_ads[current_group] = current_fields

    return google_ads


def _extract_lead_form(df):
    """Extract lead form configuration (same logic as parse_ad_copy.py)."""
    form = {}
    for i in range(df.shape[0]):
        label = str(df.iloc[i, 0]).strip() if pd.notna(df.iloc[i, 0]) else ""
        label_lower = label.lower()

        if "headline" in label_lower and "greeting" not in label_lower:
            form.setdefault("headline", _get_copy(df, i))
        elif "description" in label_lower and "prefill" not in label_lower:
            if "description" not in form:
                form["description"] = _get_copy(df, i)
        elif "custom question" in label_lower and "multiple" not in label_lower:
            q_num = re.search(r"(\d+)", label)
            key = f"custom_question_{q_num.group(1)}" if q_num else "custom_question"
            form[key] = _get_copy(df, i)
        elif "privacy policy link" in label_lower:
            form["privacy_url"] = _get_copy(df, i)
        elif "completion" in label_lower:
            form["completion_headline"] = _get_copy(df, i + 1) if i + 1 < df.shape[0] else {}
            form["completion_description"] = _get_copy(df, i + 2) if i + 2 < df.shape[0] else {}
        elif "cta button" in label_lower:
            form["completion_cta"] = _get_copy(df, i)

    return form


def parse_copy_from_sheet(spreadsheet_id, tab_name=None, service=None):
    """
    Read ad copy from a Google Sheet and return structured copy data.

    Falls back to downloading the file via Drive API if the Sheets API
    rejects it (e.g., uploaded .xlsx files).

    Returns same structure as parse_ad_copy.parse_ad_copy_sheet():
    {
        "project_name": "The Edgemont Collection",
        "sheets": ["Jan 2026", "Lead Form"],
        "meta_ads": { group_name: { field: { lang: text } } },
        "lead_form": { ... },
    }
    """
    # Try native Sheets API first, fall back to Drive download for .xlsx files
    try:
        if service is None:
            service = get_sheets_service()
        tabs = get_sheet_tabs(spreadsheet_id, service)
        df, used_tab = read_sheet_as_dataframe(spreadsheet_id, tab_name, service)
    except Exception as e:
        if "not supported for this document" in str(e):
            print("   ℹ️  File is an uploaded .xlsx — downloading via Drive API...")
            return _parse_copy_from_xlsx(spreadsheet_id, tab_name)
        raise

    result = {
        "project_name": "",
        "sheets": tabs,
        "meta_ads": {},
        "google_ads": {},
        "lead_form": {},
    }

    if df.empty:
        return result

    # Get project name from row 0
    if pd.notna(df.iloc[0, 0]):
        result["project_name"] = str(df.iloc[0, 0]).strip()

    # Extract Meta Ads copy
    result["meta_ads"] = _extract_meta_ads_section(df)

    # Extract Google Ads copy
    result["google_ads"] = _extract_google_ads_section(df)

    # Extract Lead Form if tab exists
    if "Lead Form" in tabs:
        lf_df, _ = read_sheet_as_dataframe(spreadsheet_id, "Lead Form", service)
        if not lf_df.empty:
            result["lead_form"] = _extract_lead_form(lf_df)

    return result


def _parse_copy_from_xlsx(file_id, tab_name=None):
    """Parse ad copy from a .xlsx file downloaded via Google Drive."""
    all_sheets = _download_xlsx_from_drive(file_id)
    tabs = list(all_sheets.keys())

    # Pick the right tab
    if tab_name and tab_name in all_sheets:
        df = all_sheets[tab_name]
    else:
        df = None
        for t in tabs:
            if t.lower() not in SKIP_TABS:
                df = all_sheets[t]
                break
        if df is None:
            df = pd.DataFrame()

    result = {
        "project_name": "",
        "sheets": tabs,
        "meta_ads": {},
        "google_ads": {},
        "lead_form": {},
    }

    if df.empty:
        return result

    if pd.notna(df.iloc[0, 0]):
        result["project_name"] = str(df.iloc[0, 0]).strip()

    result["meta_ads"] = _extract_meta_ads_section(df)
    result["google_ads"] = _extract_google_ads_section(df)

    # Extract Lead Form if tab exists
    for t in tabs:
        if t.lower() == "lead form" and t in all_sheets:
            lf_df = all_sheets[t]
            if not lf_df.empty:
                result["lead_form"] = _extract_lead_form(lf_df)
            break

    return result
