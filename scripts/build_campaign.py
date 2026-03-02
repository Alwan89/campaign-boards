#!/usr/bin/env python3
"""
build_campaign.py — CLI to generate a campaign board data.json.

Reads ad copy from a Google Sheet or local .xlsx file, scans a Google Drive
folder or local directory for creatives, matches copy to ads, and writes
public/campaigns/<slug>/data.json.

Usage (Google API mode):
    python -m scripts.build_campaign \
        --sheet-id 1ABC...xyz \
        --drive-folder-id 1DEF...uvw \
        --slug edgemont-feb2026 \
        --name "PD_Edgemont_Lead_EN"

Usage (local filesystem mode):
    python -m scripts.build_campaign \
        --xlsx "/path/to/ad-copy.xlsx" \
        --creative-folder "/path/to/creative-assets/" \
        --slug edgemont-feb2026 \
        --name "PD_Edgemont_Lead_EN"
"""
import argparse
import json
import os
import shutil
import sys

from scripts.assemble_data import assemble


# File extensions recognized as creative assets
IMAGE_EXTS = {"jpg", "jpeg", "png", "gif", "webp"}
VIDEO_EXTS = {"mp4", "mov"}
ALL_CREATIVE_EXTS = IMAGE_EXTS | VIDEO_EXTS


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


def _infer_hints_from_path(rel_path):
    """
    Infer platform and placement hints from subfolder names in the relative path.

    Recognized folder name patterns:
      Platform: Google, Meta, Meta-Social, Facebook, Instagram
      Placement: Feed, Story/Stories, Reel/Reels, Carousel (→ Feed)
      Special: Logo (→ platform=Google)
    """
    parts = [p.lower().replace("-", "").replace("_", "") for p in rel_path.split(os.sep)]

    platform = ""
    placement = ""

    for part in parts:
        # Platform detection
        if part in ("google",):
            platform = "Google"
        elif part in ("meta", "metasocial", "facebook", "instagram"):
            platform = "Meta"
        # Placement detection
        if part in ("feed",):
            placement = "Feed"
        elif part in ("story", "stories"):
            placement = "StoryReel"
        elif part in ("reel", "reels"):
            placement = "StoryReel"
        elif part in ("carousel", "carousel1x1"):
            placement = "Feed"
        elif part in ("logo",):
            platform = "Google"

    return {"platform": platform, "placement": placement}


def build_local_file_map(folder_path):
    """
    Recursively scan a local folder for creative assets and return a file_map
    plus folder-based hints for each file.

    Same format as drive_scanner.build_file_id_map() but for local files.
    Walks all subdirectories to find assets in nested folder structures.

    Returns:
        tuple of (file_map, file_map_hints) where file_map_hints maps each
        filename to {platform, placement} inferred from its subfolder path.
    """
    file_map = {}
    file_map_hints = {}

    for dirpath, _dirnames, filenames in os.walk(folder_path):
        rel_dir = os.path.relpath(dirpath, folder_path)
        hints = _infer_hints_from_path(rel_dir) if rel_dir != "." else {}

        for filename in sorted(filenames):
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
            if ext not in ALL_CREATIVE_EXTS:
                continue

            # If duplicate filename exists in a different subfolder, prefix with subfolder name
            if filename in file_map:
                unique_name = rel_dir.replace(os.sep, "_") + "_" + filename
            else:
                unique_name = filename

            file_map[unique_name] = {
                "local_path": os.path.join(dirpath, filename),
                "image_url": "",
                "download_url": "",
                "is_video": ext in VIDEO_EXTS,
                "ext": ext,
            }

            if hints:
                file_map_hints[unique_name] = hints

    return file_map, file_map_hints


def copy_local_assets(file_map, assets_dir):
    """Copy local creative files to the campaign assets directory."""
    os.makedirs(assets_dir, exist_ok=True)
    copied = 0

    for filename, meta in file_map.items():
        src = meta.get("local_path", "")
        if not src or not os.path.exists(src):
            continue

        dst = os.path.join(assets_dir, filename)
        if not os.path.exists(dst) or os.path.getmtime(src) > os.path.getmtime(dst):
            shutil.copy2(src, dst)
            copied += 1
        meta["local_path"] = dst

    return copied


def main():
    parser = argparse.ArgumentParser(
        description="Build a campaign board data.json from ad copy + creative assets."
    )

    # Sources — either Google API or local filesystem
    source_group = parser.add_argument_group("Data sources (use Google API OR local files)")
    source_group.add_argument("--sheet-id", default=None, help="Google Sheet spreadsheet ID")
    source_group.add_argument("--drive-folder-id", default=None, help="Google Drive folder ID for creatives")
    source_group.add_argument("--xlsx", default=None, help="Path to local .xlsx ad copy file")
    source_group.add_argument("--creative-folder", default=None, help="Path to local creative assets folder")

    # Required
    parser.add_argument("--slug", required=True, help="Campaign slug (e.g., edgemont-feb2026)")
    parser.add_argument("--name", required=True, help="Campaign name (e.g., PD_Edgemont_Lead_EN)")

    # Campaign metadata
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
    parser.add_argument("--tab", default=None, help="Specific sheet tab name")
    parser.add_argument("--match-overrides", default=None,
        help="JSON file path with creative→copy match overrides (concept_key → copy group name)")
    parser.add_argument("--dry-run", action="store_true", help="Print summary without writing files")

    args = parser.parse_args()

    # Validate: need either Google API sources or local filesystem sources
    use_local_copy = args.xlsx is not None
    use_local_assets = args.creative_folder is not None
    use_api_copy = args.sheet_id is not None
    use_api_assets = args.drive_folder_id is not None

    if not use_local_copy and not use_api_copy:
        parser.error("Provide either --xlsx (local file) or --sheet-id (Google API)")
    if not use_local_assets and not use_api_assets:
        parser.error("Provide either --creative-folder (local) or --drive-folder-id (Google API)")

    # --- Step 1: Read ad copy ---
    if use_local_copy:
        print(f"\n📋 Reading ad copy from local .xlsx: {args.xlsx}")
        if args.tab:
            print(f"   Tab: {args.tab}")
        try:
            from scripts.sheets_reader import read_copy_from_xlsx
            copy_data = read_copy_from_xlsx(args.xlsx, tab_name=args.tab)
        except Exception as e:
            print(f"\n❌ Failed to read .xlsx: {e}")
            sys.exit(1)
    else:
        print(f"\n📋 Reading ad copy from Google Sheet: {args.sheet_id}")
        if args.tab:
            print(f"   Tab: {args.tab}")
        try:
            from scripts.sheets_reader import parse_copy_from_sheet
            copy_data = parse_copy_from_sheet(args.sheet_id, tab_name=args.tab)
        except Exception as e:
            print(f"\n❌ Failed to read Google Sheet: {e}")
            sys.exit(1)

    meta_groups = copy_data.get("meta_ads", {})
    print(f"   Project: {copy_data.get('project_name', '(unknown)')}")
    print(f"   Copy groups found: {len(meta_groups)}")
    for g in meta_groups:
        print(f"     • {g}")

    # --- Step 2: Scan for creative assets ---
    file_map_hints = None
    if use_local_assets:
        print(f"\n📁 Scanning local folder: {args.creative_folder}")
        try:
            file_map, file_map_hints = build_local_file_map(args.creative_folder)
        except Exception as e:
            print(f"\n❌ Failed to scan folder: {e}")
            sys.exit(1)
    else:
        print(f"\n📁 Scanning Drive folder: {args.drive_folder_id}")
        try:
            from scripts.drive_scanner import build_file_id_map
            file_map = build_file_id_map(args.drive_folder_id)
        except Exception as e:
            print(f"\n❌ Failed to scan Drive folder: {e}")
            sys.exit(1)

    images = [f for f, d in file_map.items() if not d["is_video"]]
    videos = [f for f, d in file_map.items() if d["is_video"]]
    print(f"   Files found: {len(file_map)} ({len(images)} images, {len(videos)} videos)")
    if file_map_hints:
        print(f"   Folder hints: {len(file_map_hints)} files with subfolder-based metadata")

    # --- Step 2b: Copy/download assets locally ---
    campaigns_dir = get_output_dir()
    slug_dir = os.path.join(campaigns_dir, args.slug)
    assets_dir = os.path.join(slug_dir, "assets")

    if use_local_assets:
        print(f"\n📥 Copying creative files to {assets_dir}")
        try:
            copied = copy_local_assets(file_map, assets_dir)
            print(f"   Copied: {copied}/{len(file_map)} files")
        except Exception as e:
            print(f"\n⚠️  Copy failed: {e}")
    else:
        print(f"\n📥 Downloading creative files to {assets_dir}")
        try:
            from scripts.drive_scanner import download_files
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
        "sheet_id": args.sheet_id or "",
        "drive_folder_id": args.drive_folder_id or "",
        "date": args.date,
    }

    # Load match overrides if provided
    overrides = None
    if args.match_overrides:
        with open(args.match_overrides, "r") as f:
            overrides = json.load(f)
        print(f"   Using {len(overrides)} match override(s)")

    data, report = assemble(copy_data, file_map, campaign_config,
                            lang=args.lang, slug=args.slug, match_overrides=overrides,
                            file_map_hints=file_map_hints)

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
