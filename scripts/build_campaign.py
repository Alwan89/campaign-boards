#!/usr/bin/env python3
"""
build_campaign.py — CLI to generate a campaign board data.json.

Reads ad copy from a Google Sheet, scans a Google Drive folder for creatives,
matches copy to ads, and writes public/campaigns/<slug>/data.json.

Usage:
    python -m scripts.build_campaign \
        --sheet-id 1ABC...xyz \
        --drive-folder-id 1DEF...uvw \
        --slug edgemont-feb2026 \
        --name "PD_Edgemont_Lead_EN" \
        --project "The Edgemont Collection" \
        --developer "Domus Homes" \
        --objective "Lead Generation" \
        --budget "$75/day" \
        --languages EN \
        --landing-page "theedgemontcollection.com" \
        --housing-category
"""
import argparse
import json
import os
import sys

from scripts.sheets_reader import parse_copy_from_sheet
from scripts.drive_scanner import build_file_id_map, download_files
from scripts.assemble_data import assemble


def get_output_dir():
    """Return the project root's public/campaigns/ directory."""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(project_root, "public", "campaigns")


def update_index(campaigns_dir, slug, campaign_config):
    """Add or update the campaign in index.json."""
    index_path = os.path.join(campaigns_dir, "index.json")

    if os.path.exists(index_path):
        with open(index_path, "r") as f:
            index = json.load(f)
    else:
        index = []

    # Find existing entry or create new
    entry = next((e for e in index if e["slug"] == slug), None)
    if entry is None:
        entry = {"slug": slug}
        index.append(entry)

    entry["name"] = campaign_config.get("name", "")
    entry["project"] = campaign_config.get("project", "")
    entry["client"] = campaign_config.get("developer", "")
    entry["date"] = campaign_config.get("date", "")
    entry["status"] = "active"

    with open(index_path, "w") as f:
        json.dump(index, f, indent=2)

    return index_path


def main():
    parser = argparse.ArgumentParser(
        description="Build a campaign board data.json from Google Sheet + Drive folder."
    )

    # Required sources
    parser.add_argument("--sheet-id", required=True, help="Google Sheet spreadsheet ID")
    parser.add_argument("--drive-folder-id", required=True, help="Google Drive folder ID for creatives")
    parser.add_argument("--slug", required=True, help="Campaign slug (e.g., edgemont-feb2026)")

    # Campaign metadata
    parser.add_argument("--name", required=True, help="Campaign name (e.g., PD_Edgemont_Lead_EN)")
    parser.add_argument("--project", default="", help="Project name (e.g., The Edgemont Collection)")
    parser.add_argument("--developer", default="", help="Developer/client name (e.g., Domus Homes)")
    parser.add_argument("--objective", default="Lead Generation", help="Campaign objective")
    parser.add_argument("--budget", default="", help="Daily budget (e.g., $75/day)")
    parser.add_argument("--languages", nargs="+", default=["EN"], help="Languages (e.g., EN ZH_S)")
    parser.add_argument("--landing-page", default="", help="Landing page domain")
    parser.add_argument("--housing-category", action="store_true", help="Enable housing category (Meta Special Ad Category)")
    parser.add_argument("--date", default="", help="Campaign date (e.g., 2026-02)")

    # Options
    parser.add_argument("--lang", default="en", help="Language code for copy (default: en)")
    parser.add_argument("--tab", default=None, help="Specific Google Sheet tab name")
    parser.add_argument("--dry-run", action="store_true", help="Print summary without writing files")

    args = parser.parse_args()

    # --- Step 1: Read copy from Google Sheet ---
    print(f"\n📋 Reading ad copy from Google Sheet: {args.sheet_id}")
    if args.tab:
        print(f"   Tab: {args.tab}")

    try:
        copy_data = parse_copy_from_sheet(args.sheet_id, tab_name=args.tab)
    except Exception as e:
        print(f"\n❌ Failed to read Google Sheet: {e}")
        sys.exit(1)

    meta_groups = copy_data.get("meta_ads", {})
    print(f"   Project: {copy_data.get('project_name', '(unknown)')}")
    print(f"   Copy groups found: {len(meta_groups)}")
    for g in meta_groups:
        print(f"     • {g}")

    # --- Step 2: Scan Drive folder ---
    print(f"\n📁 Scanning Drive folder: {args.drive_folder_id}")

    try:
        file_map = build_file_id_map(args.drive_folder_id)
    except Exception as e:
        print(f"\n❌ Failed to scan Drive folder: {e}")
        sys.exit(1)

    images = [f for f, d in file_map.items() if not d["is_video"]]
    videos = [f for f, d in file_map.items() if d["is_video"]]
    print(f"   Files found: {len(file_map)} ({len(images)} images, {len(videos)} videos)")

    # --- Step 2b: Download files locally ---
    campaigns_dir = get_output_dir()
    slug_dir = os.path.join(campaigns_dir, args.slug)
    assets_dir = os.path.join(slug_dir, "assets")
    print(f"\n📥 Downloading creative files to {assets_dir}")

    try:
        downloaded = download_files(file_map, assets_dir)
        print(f"   Downloaded: {downloaded}/{len(file_map)} files")
    except Exception as e:
        print(f"\n⚠️  Download failed (will use Drive URLs): {e}")

    # --- Step 3: Assemble ---
    print(f"\n🔧 Assembling campaign data...")

    campaign_config = {
        "name": args.name,
        "project": args.project or copy_data.get("project_name", ""),
        "developer": args.developer,
        "objective": args.objective,
        "budget": args.budget,
        "languages": args.languages,
        "housing_category": args.housing_category,
        "landing_page": args.landing_page,
        "sheet_id": args.sheet_id,
        "drive_folder_id": args.drive_folder_id,
        "date": args.date,
    }

    data, report = assemble(copy_data, file_map, campaign_config, lang=args.lang, slug=args.slug)

    # --- Step 4: Report ---
    print(f"\n📊 Summary:")
    print(f"   Ads: {report['total_ads']}")
    print(f"   Ad Sets: {report['total_ad_sets']}")
    print(f"   Files matched: {report['total_files']}")

    if report["unmatched_ads"]:
        print(f"\n⚠️  Ads without matching copy ({len(report['unmatched_ads'])}):")
        for u in report["unmatched_ads"]:
            print(f"     • {u}")

    if report["unmatched_copy_groups"]:
        print(f"\n⚠️  Copy groups without matching ads ({len(report['unmatched_copy_groups'])}):")
        for u in report["unmatched_copy_groups"]:
            print(f"     • {u}")

    # --- Step 5: Write ---
    if args.dry_run:
        print(f"\n🔍 Dry run — data.json preview:")
        print(json.dumps(data, indent=2))
        return

    os.makedirs(slug_dir, exist_ok=True)

    data_path = os.path.join(slug_dir, "data.json")
    with open(data_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\n✅ Written: {data_path}")

    # Update index.json
    index_path = update_index(campaigns_dir, args.slug, campaign_config)
    print(f"✅ Updated: {index_path}")

    print(f"\n🚀 Done! View at: http://localhost:5173/campaign-boards/#{args.slug}")


if __name__ == "__main__":
    main()
