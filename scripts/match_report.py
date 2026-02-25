"""
match_report.py — Generate a structured report of creatives and copy groups
for AI-powered matching review.

Called by the ad-mockup skill to give Claude a clean view of both datasets
before it proposes creative-to-copy matches.

Usage (local filesystem):
    python -m scripts.match_report \
        --xlsx "/path/to/ad-copy.xlsx" \
        --creative-folder "/path/to/creative-assets/" \
        [--tab "March 2026"] \
        [--lang en]

Usage (Google API):
    python -m scripts.match_report \
        --sheet-id 1ABC...xyz \
        --drive-folder-id 1DEF...uvw \
        [--tab "March 2026"] \
        [--lang en]
"""
import argparse
import json
import sys

from scripts.assemble_data import _parse_filename, _group_into_ads


def generate_match_report(copy_data, file_map, lang="en"):
    """
    Generate a structured report for AI matching review.

    Args:
        copy_data: Output of sheets_reader.parse_copy_from_sheet()
        file_map: Output of drive_scanner.build_file_id_map()
        lang: Language code for copy previews

    Returns:
        dict with creatives, ad_groups, and copy_groups for AI review.
    """
    # Parse all filenames
    parsed_files = []
    for filename in file_map:
        parsed = _parse_filename(filename)
        parsed["is_video"] = file_map[filename].get("is_video", False)
        parsed_files.append(parsed)

    # Separate by platform
    meta_files = [f for f in parsed_files if f["platform"] == "Meta"]
    google_files = [f for f in parsed_files if f["platform"] == "Google"]

    # Group Meta files into ad groups
    ad_groups = _group_into_ads(meta_files)

    # Build creative inventory
    creatives = []
    for (concept_key, placement), group in sorted(ad_groups.items()):
        creatives.append({
            "concept_key": concept_key,
            "placement": placement,
            "creative_type": group["creative_type"],
            "sub_community": group["sub_community"],
            "file_count": len(group["files"]),
            "filenames": [f["filename"] for f in group["files"]],
            "sub_placements": group["sub_placements_covered"],
        })

    # Build Google creative list
    google_creatives = []
    for gf in google_files:
        google_creatives.append({
            "filename": gf["filename"],
            "type_hint": _detect_google_type(gf["filename"]),
            "is_video": gf.get("is_video", False),
        })

    # Build copy group summaries
    meta_ads_copy = copy_data.get("meta_ads", {})
    meta_copy_groups = []
    for group_name, fields in meta_ads_copy.items():
        preview = {}
        for field_name in ("text", "headline", "headline_1", "description",
                           "description_1", "cta", "button", "link"):
            if field_name in fields:
                val = fields[field_name].get(lang, "")
                if val:
                    display_name = field_name.replace("_1", "")
                    if display_name not in preview:
                        preview[display_name] = val[:80] + ("..." if len(val) > 80 else "")

        meta_copy_groups.append({
            "group_name": group_name,
            "fields_preview": preview,
            "field_count": len(fields),
        })

    google_ads_copy = copy_data.get("google_ads", {})
    google_copy_groups = []
    for group_name, fields in google_ads_copy.items():
        headline_count = sum(1 for k in fields if k.startswith("headline"))
        desc_count = sum(1 for k in fields if k.startswith("description"))
        google_copy_groups.append({
            "group_name": group_name,
            "headline_count": headline_count,
            "description_count": desc_count,
        })

    return {
        "meta_creatives": creatives,
        "google_creatives": google_creatives,
        "meta_copy_groups": meta_copy_groups,
        "google_copy_groups": google_copy_groups,
        "summary": {
            "total_files": len(file_map),
            "meta_ad_groups": len(creatives),
            "google_files": len(google_creatives),
            "meta_copy_groups": len(meta_copy_groups),
            "google_copy_groups": len(google_copy_groups),
        },
    }


def _detect_google_type(filename):
    """Detect Google ad type from filename."""
    fname_lower = filename.lower()
    if "demand-gen" in fname_lower or "demand_gen" in fname_lower:
        return "Demand Gen"
    elif "search" in fname_lower:
        return "Search"
    elif "display" in fname_lower:
        return "Display"
    elif "logo" in fname_lower:
        return "Logo"
    elif "pmax" in fname_lower or "performance-max" in fname_lower:
        return "Performance Max"
    return "Google"


def main():
    parser = argparse.ArgumentParser(
        description="Generate a match report for AI-powered creative-to-copy matching."
    )

    # Sources — either local filesystem or Google API
    parser.add_argument("--xlsx", default=None, help="Path to local .xlsx ad copy file")
    parser.add_argument("--creative-folder", default=None, help="Path to local creative assets folder")
    parser.add_argument("--sheet-id", default=None, help="Google Sheet spreadsheet ID")
    parser.add_argument("--drive-folder-id", default=None, help="Google Drive folder ID")
    parser.add_argument("--tab", default=None, help="Specific sheet tab name")
    parser.add_argument("--lang", default="en", help="Language code for copy previews")

    args = parser.parse_args()

    # Read copy data
    if args.xlsx:
        try:
            from scripts.sheets_reader import read_copy_from_xlsx
            copy_data = read_copy_from_xlsx(args.xlsx, tab_name=args.tab)
        except Exception as e:
            print(json.dumps({"error": f"Failed to read .xlsx: {e}"}))
            sys.exit(1)
    elif args.sheet_id:
        try:
            from scripts.sheets_reader import parse_copy_from_sheet
            copy_data = parse_copy_from_sheet(args.sheet_id, tab_name=args.tab)
        except Exception as e:
            print(json.dumps({"error": f"Failed to read sheet: {e}"}))
            sys.exit(1)
    else:
        parser.error("Provide either --xlsx (local file) or --sheet-id (Google API)")

    # Scan for creative files
    if args.creative_folder:
        try:
            from scripts.build_campaign import build_local_file_map
            file_map = build_local_file_map(args.creative_folder)
        except Exception as e:
            print(json.dumps({"error": f"Failed to scan folder: {e}"}))
            sys.exit(1)
    elif args.drive_folder_id:
        try:
            from scripts.drive_scanner import build_file_id_map
            file_map = build_file_id_map(args.drive_folder_id)
        except Exception as e:
            print(json.dumps({"error": f"Failed to scan Drive: {e}"}))
            sys.exit(1)
    else:
        parser.error("Provide either --creative-folder (local) or --drive-folder-id (Google API)")

    report = generate_match_report(copy_data, file_map, lang=args.lang)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
