"""
assemble_data.py — Combine parsed ad copy + Drive file map into data.json.

Takes the output of sheets_reader + drive_scanner and produces the campaign
data.json structure consumed by the React app.

Usage:
    from scripts.assemble_data import assemble
    data = assemble(copy_data, file_map, campaign_config)
"""
import re
from datetime import datetime, timezone


# --------------------------------------------------------------------------- #
#  Filename parsing (ported from parse_creative_folder.py, adapted for Drive)
# --------------------------------------------------------------------------- #

def _parse_filename(filename):
    """
    Parse a creative filename into structured metadata.

    Ported from parse_creative_folder.py — same logic, but without PIL
    dimension detection (files are in Drive, not local).
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    name_part = filename.rsplit(".", 1)[0] if "." in filename else filename

    # --- Creative type ---
    if "Carousel" in filename:
        card_match = re.search(r"Carousel_(\d+)[-_](\d+)", filename)
        if card_match:
            creative_type = f"Carousel Cards {card_match.group(1)}-{card_match.group(2)}"
        else:
            card_num = re.search(r"Carousel_(\d+)", filename)
            creative_type = f"Carousel Card {card_num.group(1)}" if card_num else "Carousel"
    elif "Single" in filename:
        creative_type = "Single Image"
    elif ext in ("mp4", "mov"):
        creative_type = "Video"
    elif "GIF" in filename or ext == "gif":
        creative_type = "GIF"
    else:
        creative_type = "Image"

    # --- Placement + sub-placement (from filename keywords) ---
    placement = "Unknown"
    sub_placement = "Unknown"

    if ext in ("mp4", "mov"):
        if any(kw in filename for kw in ("Story", "story")):
            placement = "StoryReel"
            sub_placement = "Story"
        elif any(kw in filename for kw in ("Reel", "reel")):
            placement = "StoryReel"
            sub_placement = "Reel"
        elif any(kw in filename for kw in ("StoryReel", "storyreel")):
            placement = "StoryReel"
            sub_placement = "StoryReel"
        elif any(kw in filename for kw in ("Feed", "feed")):
            placement = "Feed"
            sub_placement = "Feed"
    else:
        # For images, use filename keywords (can't read dimensions from Drive)
        if any(kw in filename for kw in ("Story", "story")):
            placement = "StoryReel"
            sub_placement = "Story"
        elif any(kw in filename for kw in ("Reel", "reel")):
            placement = "StoryReel"
            sub_placement = "Reel"
        elif any(kw in filename for kw in ("StoryReel", "storyreel")):
            placement = "StoryReel"
            sub_placement = "StoryReel"
        elif any(kw in filename for kw in ("Feed", "feed")):
            placement = "Feed"
            sub_placement = "Feed"
        else:
            # Default: square images are Feed
            placement = "Feed"
            sub_placement = "Feed"

    # --- Parse segments ---
    segments = name_part.replace("-", "_").split("_")
    project = segments[0] if segments else "Unknown"

    # Sub-community detection
    sub_community = "General"
    name_lower = filename.lower()
    if "brookridgelane" in name_lower or "brookridge_lane" in name_lower or "brookridge" in name_lower:
        sub_community = "Brookridge Lane"
    elif "ridgewoodrow" in name_lower or "ridgewood_row" in name_lower or "ridgewood" in name_lower:
        sub_community = "Ridgewood Row"

    # Platform detection
    platform = "Meta"  # default
    for seg in segments:
        if seg.lower() in ("meta", "facebook", "instagram", "google", "linkedin", "wechat", "tiktok"):
            platform = seg.capitalize()
            if seg.lower() in ("facebook", "instagram"):
                platform = "Meta"
            break

    # Date label
    date_label = ""
    date_match = re.search(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\d{4}", filename)
    if date_match:
        date_label = date_match.group(0)
    else:
        date_match2 = re.search(r"(\d{6})", filename)
        if date_match2:
            date_label = date_match2.group(0)

    # Concept key — strip placement keywords to group Story+Reel together,
    # and strip carousel card numbers so all cards group as one ad
    skip_keywords = {"story", "reel", "storyreel", "feed", "stories", "reels"}
    concept_segments = [s.lower() for s in segments if s.lower() not in skip_keywords]
    # Remove pure-digit segments that follow "carousel" (card numbers like "1", "2")
    filtered = []
    for j, seg in enumerate(concept_segments):
        if seg.isdigit() and j > 0 and concept_segments[j - 1] == "carousel":
            continue
        filtered.append(seg)
    concept_key = "_".join(filtered)

    return {
        "filename": filename,
        "project": project,
        "sub_community": sub_community,
        "platform": platform,
        "creative_type": creative_type,
        "placement": placement,
        "sub_placement": sub_placement,
        "date_label": date_label,
        "ext": ext,
        "concept_key": concept_key,
    }


def _group_into_ads(parsed_files):
    """
    Group creative files into ad objects.

    Same concept_key + same placement → ONE ad.
    Ported from parse_creative_folder.group_into_ads().
    """
    groups = {}
    for c in parsed_files:
        key = (c["concept_key"], c["placement"])
        if key not in groups:
            groups[key] = {
                "concept_key": c["concept_key"],
                "ad_set_type": c["placement"],
                "creative_type": c["creative_type"],
                "project": c["project"],
                "sub_community": c["sub_community"],
                "date_label": c["date_label"],
                "files": [],
                "sub_placements_covered": [],
            }
        groups[key]["files"].append(c)
        if c["sub_placement"] not in groups[key]["sub_placements_covered"]:
            groups[key]["sub_placements_covered"].append(c["sub_placement"])

    # Upgrade creative_type for carousel groups
    for key, group in groups.items():
        card_types = [f["creative_type"] for f in group["files"]]
        if any("Carousel" in t for t in card_types):
            group["creative_type"] = "Carousel"

    return groups


# --------------------------------------------------------------------------- #
#  Copy matching
# --------------------------------------------------------------------------- #

def _match_copy_to_ad(ad_group, meta_ads_copy):
    """
    Find the best matching copy group for an ad.

    Matches by sub_community and creative_type against the copy group names
    from the Google Sheet (e.g., "Single Image Ad + Story/Reel Video - Brookridge Lane").

    Returns the matched copy dict or None.
    """
    sub_comm = ad_group["sub_community"].lower()
    c_type = ad_group["creative_type"].lower()

    best_match = None
    best_score = 0

    for group_name, fields in meta_ads_copy.items():
        name_lower = group_name.lower()
        score = 0

        # Check sub-community match
        if sub_comm != "general" and sub_comm in name_lower:
            score += 2

        # Check creative type match
        if c_type in name_lower:
            score += 1
        elif c_type == "single image" and "single" in name_lower:
            score += 1
        elif c_type == "video" and "video" in name_lower:
            score += 1
        elif c_type == "carousel" and "carousel" in name_lower:
            score += 1

        if score > best_score:
            best_score = score
            best_match = fields

    return best_match if best_score > 0 else None


def _extract_ad_copy(fields, lang="en"):
    """Extract ad copy fields for a given language.

    Handles both unnumbered fields (headline) and numbered fields
    (headline_1, headline_40, etc.) — picks the first non-empty match.
    """
    if not fields:
        return {"primary": "", "headline": "", "description": "", "cta": "", "link": ""}

    def _first_match(prefix):
        """Return first non-empty value for a field prefix."""
        # Try unnumbered key first
        val = fields.get(prefix, {}).get(lang, "")
        if val:
            return val
        # Then try any numbered variant (headline_1, headline_40, etc.)
        for k in sorted(fields.keys()):
            if k.startswith(prefix + "_"):
                v = fields[k].get(lang, "")
                if v:
                    return v
        return ""

    copy = {}
    copy["primary"] = fields.get("text", {}).get(lang, "")
    copy["headline"] = _first_match("headline")
    copy["description"] = _first_match("description")
    copy["cta"] = fields.get("cta", {}).get(lang, "") or fields.get("button", {}).get(lang, "")
    copy["link"] = fields.get("link", {}).get(lang, "")

    return copy


def _extract_carousel_cards(fields, file_map, ad_files, lang="en", slug=""):
    """
    Build carousel card objects from copy + file map.

    Carousel headlines/descriptions use numbered keys: headline_1, headline_2, etc.
    """
    cards = []

    # Find carousel card files (sorted by card number)
    carousel_files = sorted(
        [f for f in ad_files if "Carousel" in f["creative_type"]],
        key=lambda f: f["filename"],
    )

    # Count how many cards we have (from files or numbered copy fields)
    numbered_headlines = sorted(
        [k for k in (fields or {}) if k.startswith("headline_")],
        key=lambda k: int(re.search(r"(\d+)", k).group(1)) if re.search(r"(\d+)", k) else 0,
    )
    card_count = max(len(carousel_files), len(numbered_headlines), 1)

    for i in range(card_count):
        card = {}

        # Image URL from file map
        if i < len(carousel_files):
            fname = carousel_files[i]["filename"]
            fdata = file_map.get(fname, {})
            card["imageUrl"] = _get_image_url(fdata, fname, slug)
        else:
            card["imageUrl"] = ""

        # Headline from numbered field
        h_key = f"headline_{i + 1}"
        if fields and h_key in fields:
            card["headline"] = fields[h_key].get(lang, "")
        elif i == 0 and fields and "headline" in fields:
            card["headline"] = fields["headline"].get(lang, "")
        else:
            card["headline"] = ""

        # Description from numbered field
        d_key = f"description_{i + 1}"
        if fields and d_key in fields:
            card["description"] = fields[d_key].get(lang, "")
        elif i == 0 and fields and "description" in fields:
            card["description"] = fields["description"].get(lang, "")
        else:
            card["description"] = ""

        cards.append(card)

    return cards


# --------------------------------------------------------------------------- #
#  Ad set generation
# --------------------------------------------------------------------------- #

TIER_CONFIG = {
    "Broad": {
        "targeting": "Location only \u2014 Advantage+ ON",
    },
    "Interest": {
        "targeting": "Combined audience \u2014 all interests",
    },
    "Retargeting": {
        "targeting": "Website visitors, video viewers, lead openers",
    },
}

TIERS = ["Broad", "Interest", "Retargeting"]
PLACEMENTS = ["Feed", "StoryReel"]


def _generate_ad_sets(ads, campaign_config, lang="EN"):
    """
    Generate the standard 6 ad-set structure.

    For Lead/Conversion objective: Broad/Interest/Retargeting × Feed/StoryReel.
    Each ad set gets all ads matching its placement.
    """
    # Separate ads by placement
    feed_ad_ids = [a["id"] for a in ads if a["placement"] == "Feed"]
    sr_ad_ids = [a["id"] for a in ads if a["placement"] == "StoryReel"]

    # Extract objective prefix (e.g., "Lead" from "Lead Generation")
    obj = campaign_config.get("objective", "Lead")
    obj_prefix = obj.split()[0] if obj else "Lead"

    ad_sets = []
    as_counter = 1

    for tier in TIERS:
        for placement in PLACEMENTS:
            ad_ids = feed_ad_ids if placement == "Feed" else sr_ad_ids
            ad_sets.append(
                {
                    "id": f"as{as_counter}",
                    "name": f"{obj_prefix}_{lang}_{tier}_{placement}",
                    "tier": tier,
                    "placement": placement,
                    "targeting": TIER_CONFIG[tier]["targeting"],
                    "ads": list(ad_ids),
                }
            )
            as_counter += 1

    return ad_sets


# --------------------------------------------------------------------------- #
#  Main assembler
# --------------------------------------------------------------------------- #

def _get_asset_url(fdata, filename, slug):
    """Get the best available asset URL — prefer local asset path, fall back to Drive URL."""
    if fdata.get("local_path"):
        return f"/campaign-boards/campaigns/{slug}/assets/{filename}"
    return fdata.get("image_url", "")


def _get_image_url(fdata, filename, slug):
    """Get image URL — alias for _get_asset_url."""
    return _get_asset_url(fdata, filename, slug)


def _get_video_url(fdata, filename, slug):
    """Get video URL — prefer local asset path, fall back to Drive download URL."""
    if fdata.get("local_path"):
        return f"/campaign-boards/campaigns/{slug}/assets/{filename}"
    return fdata.get("download_url", "")


def assemble(copy_data, file_map, campaign_config, lang="en", slug="", match_overrides=None):
    """
    Combine parsed copy + Drive file map + campaign config into data.json.

    Args:
        copy_data: Output of sheets_reader.parse_copy_from_sheet()
        file_map: Output of drive_scanner.build_file_id_map()
        campaign_config: Dict with campaign-level metadata
        lang: Language code to use for copy (default "en")
        slug: Campaign slug for local asset paths
        match_overrides: Optional dict mapping concept_keys to copy group
            names, bypassing _match_copy_to_ad() for those entries.
            Format: {"concept_key": "Copy Group Name"}

    Returns:
        tuple of (data_dict, warnings_dict) matching the data.json schema.
    """
    meta_ads_copy = copy_data.get("meta_ads", {})

    # 1. Parse all filenames from the Drive file map
    parsed_files = []
    for filename in file_map:
        parsed = _parse_filename(filename)
        parsed_files.append(parsed)

    # 1b. Separate Meta vs Google (and other platforms)
    meta_files = [f for f in parsed_files if f["platform"] == "Meta"]
    google_files = [f for f in parsed_files if f["platform"] == "Google"]

    # 2. Group Meta files into ads (Google handled separately below)
    ad_groups = _group_into_ads(meta_files)

    # 3. Build ad objects
    ads = []
    ad_counter = 1
    unmatched_ads = []

    for (concept_key, placement), group in sorted(ad_groups.items()):
        # Match copy — use override if provided, otherwise fuzzy match
        # Support placement-aware keys (e.g., "concept_key::Feed") and plain keys
        placement_key = f"{concept_key}::{placement}"
        if match_overrides and placement_key in match_overrides:
            matched_copy = meta_ads_copy.get(match_overrides[placement_key])
        elif match_overrides and concept_key in match_overrides:
            matched_copy = meta_ads_copy.get(match_overrides[concept_key])
        else:
            matched_copy = _match_copy_to_ad(group, meta_ads_copy)
        if matched_copy is None and group["sub_community"] != "General":
            unmatched_ads.append(f"{group['sub_community']} / {group['creative_type']} / {placement}")

        ad_copy = _extract_ad_copy(matched_copy, lang)
        is_carousel = group["creative_type"] == "Carousel"
        is_video = any(f["ext"] in ("mp4", "mov") for f in group["files"])

        # Determine primary image/video URL
        primary_file = group["files"][0]
        primary_fname = primary_file["filename"]
        primary_fdata = file_map.get(primary_fname, {})

        # Build naming parts
        date_label = group["date_label"] or "undated"
        obj_prefix = campaign_config.get("objective", "Lead").split()[0]
        lang_upper = lang.upper()
        c_type_label = group["creative_type"].replace(" ", "")
        concept_label = group["sub_community"].replace(" ", "")
        placement_label = f"_{placement}" if placement == "StoryReel" else ""

        ad_name = f"{obj_prefix}_{lang_upper}_{c_type_label}_{date_label}{placement_label}_{concept_label}"

        ad = {
            "id": f"ad{ad_counter}",
            "name": ad_name,
            "type": group["creative_type"],
            "placement": placement,
            "concept": group["sub_community"],
            "files": [f["filename"] for f in group["files"]],
            "imageUrl": _get_image_url(primary_fdata, primary_fname, slug),
            "copy": ad_copy,
        }

        # Video-specific fields
        if is_video:
            ad["isVideo"] = True
            video_file = next((f for f in group["files"] if f["ext"] in ("mp4", "mov")), None)
            if video_file:
                vdata = file_map.get(video_file["filename"], {})
                ad["videoUrl"] = _get_video_url(vdata, video_file["filename"], slug)
            else:
                ad["videoUrl"] = None

        # StoryReel sub-placements
        if placement == "StoryReel" and group["sub_placements_covered"]:
            ad["subPlacements"] = group["sub_placements_covered"]

        # Carousel cards
        if is_carousel:
            ad["carouselCards"] = _extract_carousel_cards(
                matched_copy, file_map, group["files"], lang, slug
            )

        ads.append(ad)
        ad_counter += 1

    # 4. Generate ad sets
    lang_upper = (campaign_config.get("languages", ["EN"])[0]
                  if campaign_config.get("languages") else "EN")
    ad_sets = _generate_ad_sets(ads, campaign_config, lang_upper)

    # 4b. Build Google ad objects + attach copy from sheet
    google_ads_copy = copy_data.get("google_ads", {})
    google_ads = []

    # Helper to extract all numbered fields as a list
    def _collect_numbered(fields, prefix, lang="en"):
        items = []
        for k in sorted(fields.keys()):
            if k.startswith(prefix):
                val = fields[k].get(lang, "")
                if val:
                    items.append(val)
        return items

    for gf in google_files:
        fdata = file_map.get(gf["filename"], {})
        # Detect ad type from filename
        fname_lower = gf["filename"].lower()
        if "demand-gen" in fname_lower or "demand_gen" in fname_lower:
            ad_type = "Demand Gen"
        elif "search" in fname_lower:
            ad_type = "Search"
        elif "display" in fname_lower:
            ad_type = "Display"
        elif "logo" in fname_lower:
            ad_type = "Logo"
        elif "pmax" in fname_lower or "performance-max" in fname_lower:
            ad_type = "Performance Max"
        else:
            ad_type = "Google"

        # Extract dimensions from filename if present (e.g., 1200x628)
        dim_match = re.search(r"(\d{3,4})x(\d{3,4})", gf["filename"])
        dimensions = f"{dim_match.group(1)}x{dim_match.group(2)}" if dim_match else ""

        google_ads.append({
            "filename": gf["filename"],
            "type": ad_type,
            "dimensions": dimensions,
            "imageUrl": _get_image_url(fdata, gf["filename"], slug),
            "isVideo": gf["ext"] in ("mp4", "mov"),
            "videoUrl": _get_video_url(fdata, gf["filename"], slug) if gf["ext"] in ("mp4", "mov") else "",
        })

    # Build structured Google copy objects from the sheet
    google_copy = {}
    for group_name, fields in google_ads_copy.items():
        entry = {"groupName": group_name}
        entry["headlines"] = _collect_numbered(fields, "headline_", lang)
        entry["descriptions"] = _collect_numbered(fields, "description_", lang)
        entry["link"] = fields.get("link", {}).get(lang, "")
        entry["cta"] = fields.get("cta", {}).get(lang, "")
        entry["businessName"] = fields.get("business_name", {}).get(lang, "")
        entry["mainHeadline"] = fields.get("main_headline", {}).get(lang, "")
        entry["mainDescription"] = fields.get("main_description", {}).get(lang, "")
        entry["callouts"] = _collect_numbered(fields, "callout_", lang)
        entry["amenities"] = _collect_numbered(fields, "amenity_", lang)

        # Sitelinks
        sitelinks = []
        for k in sorted(fields.keys()):
            if k.startswith("sitelink_"):
                num = re.search(r"(\d+)", k).group(1)
                sl = {"title": fields[k].get(lang, "")}
                sl["desc1"] = fields.get(f"description_1", {}).get(lang, "")
                sl["desc2"] = fields.get(f"description_2", {}).get(lang, "")
                sitelinks.append(sl)
        if sitelinks:
            entry["sitelinks"] = sitelinks

        google_copy[group_name] = entry

    # 5. Assemble final structure
    data = {
        "campaign": {
            "name": campaign_config.get("name", ""),
            "project": campaign_config.get("project", copy_data.get("project_name", "")),
            "developer": campaign_config.get("developer", ""),
            "objective": campaign_config.get("objective", "Lead Generation"),
            "budget": campaign_config.get("budget", ""),
            "languages": campaign_config.get("languages", ["EN"]),
            "housing_category": campaign_config.get("housing_category", False),
            "landing_page": campaign_config.get("landing_page", ""),
        },
        "adSets": ad_sets,
        "ads": ads,
        "googleAds": google_ads,
        "googleCopy": google_copy,
        "sources": {
            "driveFolder": campaign_config.get("drive_folder_id"),
            "copySheet": campaign_config.get("sheet_id"),
            "clickupTask": campaign_config.get("clickup_task"),
        },
        "meta": {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "generatedBy": "build_campaign.py",
            "boardVersion": "1.0",
        },
    }

    # 6. Report unmatched items
    matched_groups = set()
    for (concept_key, placement), group in ad_groups.items():
        placement_key = f"{concept_key}::{placement}"
        if match_overrides and placement_key in match_overrides:
            matched_groups.add(match_overrides[placement_key])
        elif match_overrides and concept_key in match_overrides:
            matched_groups.add(match_overrides[concept_key])
        else:
            match = _match_copy_to_ad(group, meta_ads_copy)
            if match:
                for gname, fields in meta_ads_copy.items():
                    if fields is match:
                        matched_groups.add(gname)

    unmatched_copy = [g for g in meta_ads_copy if g not in matched_groups]

    return data, {
        "total_ads": len(ads),
        "total_ad_sets": len(ad_sets),
        "total_files": len(file_map),
        "unmatched_ads": unmatched_ads,
        "unmatched_copy_groups": unmatched_copy,
    }
