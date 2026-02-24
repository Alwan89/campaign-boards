# Campaign Boards — Project Context

## What This Is

React web app (Vite + React Router) that generates pixel-accurate ad preview mockups for client review. Replaces the manual Figma "Mockup Deck v1" process. Deployed on GitHub Pages at `alwan89.github.io/campaign-boards/`.

## Architecture

```
tools/campaign-boards/
├── src/
│   ├── components/
│   │   ├── FeedCard.jsx          # Meta Feed ad (Facebook)
│   │   ├── InstagramFeedCard.jsx # Meta Feed ad (Instagram variant)
│   │   ├── StoryCard.jsx         # Meta Story ad (Facebook + Instagram via platform prop)
│   │   ├── ReelCard.jsx          # Meta Reel ad (Facebook + Instagram via platform prop)
│   │   ├── GoogleAdCards.jsx     # Google Search SERP + Demand Gen cards
│   │   ├── CarouselCreative.jsx  # Carousel swiper for multi-card ads
│   │   ├── PlaceholderCreative.jsx # Gradient placeholder when no image
│   │   ├── DeviceFrame.jsx       # Phone device frame wrapper (internal view only)
│   │   ├── EditPanel.jsx         # Internal view: editable copy fields
│   │   ├── Sidebar.jsx           # Internal view: sidebar nav
│   │   ├── AppShell.jsx          # Layout wrapper
│   │   └── icons/Icons.jsx       # SVG icon components
│   ├── pages/
│   │   ├── CampaignBoard.jsx     # Main page — routes to client or internal view
│   │   └── ClientPreview.jsx     # Client deck: slides + sticky TOC sidebar
│   ├── context/
│   │   └── CampaignContext.jsx   # Campaign data provider
│   ├── hooks/
│   │   └── useCampaignData.js    # Fetches campaign JSON
│   ├── styles/
│   │   ├── ad-cards.css          # Feed, Story, Reel, IG card styles
│   │   ├── google-ads.css        # Google Search + Demand Gen styles
│   │   └── pages/
│   │       └── client-preview.css # Client deck layout, TOC, slides
│   └── main.jsx                  # Entry point + router
├── public/
│   └── campaigns/
│       └── senakw-feb2026/       # Example campaign
│           ├── data.json         # Campaign data (ads, copy, assets)
│           └── assets/           # Creative images + hero bg
├── scripts/
│   ├── build_campaign.py         # CLI: Sheet + Drive → data.json
│   ├── sheets_reader.py          # Parse Google Sheets / .xlsx ad copy
│   ├── drive_scanner.py          # Scan Drive folder for creatives
│   ├── assemble_data.py          # Combine copy + files → campaign JSON
│   └── google_auth.py            # Service account auth (read-only)
└── credentials/
    └── service-account.json      # GCP service account key
```

## Two Views

### Client View (`?view=client`)
- Slide-based presentation with sticky left TOC sidebar
- Title slide with hero background image + gradient overlay
- Each ad gets a full-width slide with multi-placement row (e.g. Facebook Feed + Instagram Feed side by side)
- Placement column headers with platform icons (Facebook/Instagram)
- Feed cards scaled via `zoom: 0.54`, Story/Reel cards rendered at 360x640 then `zoom: 0.56`
- TOC sidebar: sections grouped by "Social Ads" / "Google Ads", active slide tracking via IntersectionObserver
- Footer: "periphery | Project Name | Ad Preview"
- No device frames, no internal controls

### Internal View (`?view=internal`)
- Full app shell with sidebar navigation
- Placement filters (Feed, Story/Reel)
- Editable copy fields with diff tracking
- Device frame preview toggle
- Export to XLSX

## Ad Card Components

### Meta Ads

**FeedCard** — Facebook feed ad
- Header: avatar (uses `campaign.pageAvatar` image or letter initial) + page name (`campaign.pageName`) + verified badge + "Sponsored · globe" + ellipsis + close
- Primary text with "See more" truncation at 125 chars
- Creative: single image, video, or carousel
- Link bar: domain (or "FORM ON FACEBOOK" for lead gen campaigns), headline, description, CTA button
- Engagement row: reactions, comments, shares, Like/Comment/Share buttons
- Internal bar: ad name, type, file count, concept (hidden in client view via `isClient` prop)

**InstagramFeedCard** — Instagram feed ad variant
- IG-specific header with avatar + page name + "Sponsored" + ellipsis
- Heart/comment/share/bookmark action icons below creative
- "View all X comments" link
- Uses same `campaign.pageAvatar` / `campaign.pageName` as FeedCard

**StoryCard** (360x640, 9:16 ratio) — supports `platform` prop ("facebook" | "instagram")
- Progress bars (3 segments)
- Header: avatar (uses `campaign.pageAvatar`) + page name + "Sponsored" + 3-dot menu + close
- Facebook variant: blue "f" logo badge on avatar, slightly different header layout
- Full-bleed creative background
- Bottom: CTA pill sticker ("Learn More" / "Sign Up")
- Safe zones: top 13%, bottom 5%, sides 7.4%

**ReelCard** (360x640, 9:16 ratio) — supports `platform` prop ("facebook" | "instagram")
- "Reels" header with camera icon (Instagram) or blue "f" badge (Facebook)
- Right-side icon stack: heart, comment, share, bookmark, 3-dot, audio disc
- Bottom overlay: avatar + page name + "Follow" button + "Sponsored" label
- Caption text with "...more" truncation at 80 chars
- Audio ticker: music icon + "Original audio"
- Wide white CTA button
- Bottom gradient: 40% from bottom
- Safe zones: top 13%, bottom 35% (for Reels), sides 7.4%

### Google Ads

**SearchAdCard** — Desktop + Mobile SERP with toggle + headline carousel
- Toggle button switches between Desktop and Mobile layouts
- Carousel arrows cycle through headline/description combinations
- **Desktop**: Browser chrome → Google logo + search bar → tabs row → results count → "Sponsored" label → favicon + domain + "Ad" badge → blue headline → description → callouts → image extension (right side) → sitelinks (2x2 grid) → amenities → organic placeholders
- **Mobile**: Phone status bar → hamburger + Google logo + avatar → pill search bar → tabs → "Ad" badge + domain → headline + image → description → callouts → sitelinks (vertical list) → organic placeholder

**DemandGenCard** — Three variants, all accept `logoUrl` for advertiser avatar
- **gmail**: Email promo layout — logo avatar + business name + "Sponsored" → full-width creative image → headline + description → blue CTA button (full-width pill)
- **youtube**: Feed card — creative with CTA overlay → logo + headline + "Sponsored · Business" + description
- **compact**: Thumbnail card — square creative → logo + business name → description → "Sponsored"

## Data Model (data.json)

```json
{
  "campaign": {
    "name": "PD_Senakw_Lead_EN",
    "project": "Seńáḵw",
    "developer": "Seńáḵw",
    "objective": "Lead Generation",
    "landing_page": "https://senakw.com/register",
    "housing_category": true,
    "languages": ["en"],
    "pageName": "Seńákw Village",
    "pageAvatar": "/campaign-boards/campaigns/senakw-feb2026/assets/Senakw_Google_Logo_EN_Feb2026.jpg"
  },
  "adSets": [
    { "id": "as1", "name": "Lead_en_Broad_Feed", "tier": "Broad", "placement": "Feed", "targeting": "...", "ads": ["ad1","ad2"] }
  ],
  "ads": [
    { "id": "ad1", "name": "...", "type": "Image|Single Image", "placement": "Feed|StoryReel|LeadForm", "concept": "General",
      "files": ["filename.jpg"], "imageUrl": "/campaign-boards/campaigns/slug/assets/filename.jpg",
      "copy": { "primary": "...", "headline": "...", "description": "...", "cta": "Sign Up", "link": "..." },
      "subPlacements": ["Story", "Reel"]
    }
  ],
  "googleAds": [
    { "filename": "...", "type": "Search|Demand Gen|Logo", "dimensions": "1200x1200|1200x628|", "imageUrl": "...", "isVideo": false }
  ],
  "googleCopy": {
    "Search – Responsive Ad": { "headlines": [...], "descriptions": [...], "link": "..." },
    "Demand Gen – Single Image Ad": { "headlines": [...], "descriptions": [...], "businessName": "...", "cta": "...", "link": "..." },
    "Search Callout Extension": { "callouts": [...] },
    "Structured Snippet Extension": { "sitelinks": [{"title":"...","desc1":"...","desc2":"...","link":"..."}], "amenities": [...] }
  }
}
```

### Placement Values
- `"Feed"` — renders in feed placement slides (Facebook Feed + Instagram Feed side by side)
- `"StoryReel"` — renders in story/reel slides (IG Stories + FB Stories + IG Reels + FB Reels)
- `"LeadForm"` — excluded from client preview (lead form creative, not a feed ad)
- Only `"Feed"` and `"StoryReel"` are recognized by `CampaignBoard.jsx` for `adsByPlacement`

## Key Design Decisions

### Client View Layout
- Sticky left TOC sidebar (220px) with section grouping and active slide indicator
- IntersectionObserver tracks which slide is in viewport to highlight TOC item
- Title slide uses hero background image (`senakw-hero-bg.jpg`) with gradient overlay
- Multi-placement rows show the same ad across Facebook + Instagram side by side
- Cards are scaled down using CSS `zoom` property to fit multiple placements per slide

### Safe Zones (Instagram, at 1080x1920 native)
- Top zone: 250px = **13%** — status bar, progress bars, avatar row
- Bottom zone (Reel): 670px = **35%** — caption, CTA, nav bar
- Side margins: 80px = **7.4%** — content padding
- All UI elements use percentage-based positioning so they scale proportionally with card size (360px wide = 0.333 scale factor)

### Card Dimensions
- Feed card: flexible width (constrained by parent)
- Story/Reel cards: **360 x 640px** (9:16 at 0.333 scale of 1080x1920)
- In client slides: Story/Reel at 320x568 (or 260x462 on narrow screens)
- Figma native sizes: Story/Reel = 1080x1920, Single 1:1 = 1200x1200, Single 4:5 = 960x1200, Feed 16:9 = 1920x1080

### Page Identity
- `campaign.pageName` — Facebook page display name (e.g. "Seńákw Village")
- `campaign.pageAvatar` — path to page profile image (used across all card types)
- Falls back to letter initial if no avatar image provided

### Logo Asset Handling
- The `Logo` type in `googleAds` array is NOT rendered as a standalone asset
- Instead, its `imageUrl` is passed as `logoUrl` to `DemandGenCard` components
- Used as the circular advertiser avatar in all Demand Gen card variants

### SERP Toggle
- `SearchAdCard` has internal `useState` for `desktop`/`mobile` mode
- Desktop: browser chrome wrapper (`.browser-mockup` class)
- Mobile: phone-style frame with status bar, 360px wide

## Ad Copy Source

The ad copy sheet is at:
```
/Users/alexwan/Library/CloudStorage/GoogleDrive-alex.wan@peripherydigital.com/Shared drives/Clients/Claude Cowork Shared Drive [TEST]/Senakw/Deliverables/Senakw Digital Ad Copy (Internal Use_View Only).xlsx
```
Current copy version: **March 2026** (sheet tab: "March 2026")

## Python Pipeline

### Building data.json from scratch
```bash
cd tools/campaign-boards
python -m scripts.build_campaign --sheet-id SHEET_ID --drive-folder-id FOLDER_ID --slug project-month
```

### Manual assembly (when using local files)
```python
from scripts.sheets_reader import read_copy_sheet
from scripts.assemble_data import assemble

copy_data = read_copy_sheet(xlsx_path="path/to/sheet.xlsx")
file_map = {
    "filename.jpg": {"local_path": "/path/to/file.jpg", "image_url": ""}
}
config = {"name": "PD_Project_Lead_EN", "project": "Project", "developer": "Project", ...}
data, warnings = assemble(copy_data, file_map, config, lang="en", slug="project-month")
# data is the dict, warnings is a dict — write data (not the tuple!) to data.json
```

### Important gotchas
- `assemble()` takes `slug` as a **separate kwarg**, not inside config dict
- `assemble()` returns a **tuple** `(data_dict, warnings_dict)` — extract `data[0]` for JSON
- `file_map` values must be **dicts** with `local_path` key, not plain strings
- Service account has **read-only** scopes (spreadsheets.readonly, drive.readonly)

## Local Google Drive Path
```
/Users/alexwan/Library/CloudStorage/GoogleDrive-alex.wan@peripherydigital.com/Shared drives/Clients/Claude Cowork Shared Drive [TEST]/
```

## Figma References
- Mockup Deck template: `figma.com/design/mTVniKzn60fTq7r6OKOOGL/ProjectName_YYYY_MM` (node 4006:417)
- QC safe zones: `figma.com/design/w3x9ZLdNQcvoBxoHt7fnin/QC` (node 6024:299)
- Kwasen Demand Gen reference: `figma.com/design/iPTuyoFIhQjVNdFD9oNkxC/Kwasen_2025_09` (node 24233:9)

## CSS Architecture

Styles are split across multiple files:
- `ad-cards.css` — Feed card, Instagram feed card, Story card, Reel card styles
- `google-ads.css` — Google Search SERP, Demand Gen card styles, browser mockup
- `pages/client-preview.css` — Client deck layout, TOC sidebar, slides, placement rows

### Key CSS Classes
- `.client-deck` — Top-level flex container (sidebar + slides)
- `.client-toc` — Sticky left sidebar TOC
- `.client-slide` — Individual slide card
- `.client-slide--title` — Title slide with hero bg + overlay
- `.placement-row` / `.placement-col` — Multi-placement layout within slides
- `.placement-col--feed` / `.placement-col--story` — Zoom scaling per placement type
- `.fb-card` — Facebook feed card container
- `.ig-card` — Instagram feed card container
- `.story-card` / `.reel-card` — 360x640 story/reel containers
- `.browser-mockup` — Desktop SERP browser chrome wrapper

## Deployment
- GitHub repo: `github.com/Alwan89/campaign-boards`
- GitHub Pages: `alwan89.github.io/campaign-boards/`
- Client preview URL: `alwan89.github.io/campaign-boards/#/senakw-feb2026?view=client`
- Vite base path: `/campaign-boards/`
