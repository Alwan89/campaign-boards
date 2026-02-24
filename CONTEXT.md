# Campaign Boards — Project Context

## What This Is

React web app (Vite + React Router) that generates pixel-accurate ad preview mockups for client review. Replaces the manual Figma "Mockup Deck v1" process. Deployed on GitHub Pages at `peripherydigital.github.io/campaign-boards/`.

## Architecture

```
tools/campaign-boards/
├── src/
│   ├── components/
│   │   ├── FeedCard.jsx          # Meta Feed ad (Facebook/Instagram)
│   │   ├── StoryCard.jsx         # Meta Story ad (Instagram)
│   │   ├── ReelCard.jsx          # Meta Reel ad (Instagram)
│   │   ├── GoogleAdCards.jsx     # Google Search SERP + Demand Gen cards
│   │   ├── CarouselCreative.jsx  # Carousel swiper for multi-card ads
│   │   ├── PlaceholderCreative.jsx # Gradient placeholder when no image
│   │   ├── DeviceFrame.jsx       # Phone device frame wrapper
│   │   ├── EditPanel.jsx         # Internal view: editable copy fields
│   │   ├── Sidebar.jsx           # Internal view: sidebar nav
│   │   ├── AppShell.jsx          # Layout wrapper
│   │   └── icons/Icons.jsx       # SVG icon components
│   ├── pages/
│   │   └── CampaignBoard.jsx     # Main page — client deck + internal view
│   ├── context/
│   │   └── CampaignContext.jsx   # Campaign data provider
│   ├── hooks/
│   │   └── useCampaignData.js    # Fetches campaign JSON
│   ├── styles/
│   │   └── campaign-board.css    # All styles
│   └── main.jsx                  # Entry point + router
├── public/
│   └── campaigns/
│       └── senakw-feb2026/       # Example campaign
│           ├── data.json         # Campaign data (ads, copy, assets)
│           └── assets/           # Creative images
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
- Presentation deck layout — one slide per ad
- Each slide has: section tag, title, copy fields on left, mockup preview on right
- Footer: "periphery | Project Name | Ad Preview"
- No internal controls, no edit panel

### Internal View (`?view=internal`)
- Full app shell with sidebar navigation
- Placement filters (Feed, Story/Reel)
- Editable copy fields with diff tracking
- Device frame preview toggle
- Export to XLSX

## Ad Card Components

### Meta Ads

**FeedCard** — Facebook/Instagram feed ad
- Header: avatar + page name + verified badge + "Sponsored · globe" + ellipsis + close
- Primary text with "See more" truncation at 125 chars
- Creative: single image, video, or carousel
- Link bar: domain, headline, description, CTA button
- Engagement row: reactions, comments, shares, Like/Comment/Share buttons
- Internal bar: ad name, type, file count, concept

**StoryCard** (360x640, 9:16 ratio)
- Progress bars (3 segments)
- Header: avatar + page name + "Sponsored" + 3-dot menu + close
- Full-bleed creative background
- Bottom: CTA pill sticker ("Learn More" / "Sign Up")
- Safe zones: top 13%, bottom 5%, sides 7.4%

**ReelCard** (360x640, 9:16 ratio)
- "Reels" header with camera icon
- Right-side icon stack: heart, comment, share, bookmark, 3-dot, audio disc
- Bottom overlay: avatar + page name + "Follow" button + "Sponsored" label
- Caption text with "...more" truncation at 80 chars
- Audio ticker: music icon + "Original audio"
- Wide white CTA button
- Bottom gradient: 40% from bottom
- Safe zones: top 13%, bottom 35% (for Reels), sides 7.4%

### Google Ads

**SearchAdCard** — Desktop + Mobile SERP with toggle
- Toggle button switches between Desktop and Mobile layouts
- **Desktop**: Browser chrome → Google logo + search bar → tabs row (All/Images/Maps/Shopping/News/More/Tools) → results count → "Sponsored" label → favicon + domain + "Ad" badge → blue headline → description → callouts → image extension (right side) → sitelinks (2x2 grid) → amenities → organic placeholders
- **Mobile**: Phone status bar → hamburger + Google logo + avatar → pill search bar → tabs (All/Images/Videos/Shopping/News) → "Ad" badge + domain + info icon → headline + image (side by side) → description → callouts → sitelinks (vertical list) → organic placeholder

**DemandGenCard** — Three variants, all accept `logoUrl` for advertiser avatar
- **gmail**: Email promo layout — back arrow + action icons header → logo avatar + business name + "Sponsored" → full-width creative image → headline + description → blue CTA button (full-width pill)
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
    "languages": ["en"]
  },
  "adSets": [
    { "id": "as1", "name": "Lead_en_Broad_Feed", "tier": "Broad", "placement": "Feed", "targeting": "...", "ads": ["ad1","ad2"] }
  ],
  "ads": [
    { "id": "ad1", "name": "Lead_EN_Image_Feb2026_General", "type": "Image", "placement": "Feed", "concept": "General",
      "files": ["filename.jpg"], "imageUrl": "/campaign-boards/campaigns/slug/assets/filename.jpg",
      "copy": { "primary": "...", "headline": "...", "description": "...", "cta": "Sign Up", "link": "..." },
      "subPlacements": ["Story", "Reel"]  // for StoryReel placement
    }
  ],
  "googleAds": [
    { "filename": "...", "type": "Search|Demand Gen|Logo", "dimensions": "1200x1200|1200x628|", "imageUrl": "...", "isVideo": false }
  ],
  "googleCopy": {
    "Search – Responsive Ad": { "headlines": [...], "descriptions": [...], "link": "..." },
    "Demand Gen – Single Image Ad": { "headlines": [...], "descriptions": [...], "businessName": "...", "cta": "...", "link": "..." },
    "Search Callout Extension": { "callouts": [...] },
    "Structured Snippet Extension": { "sitelinks": [{"title":"...","desc1":"...","desc2":"..."}], "amenities": [...] }
  }
}
```

## Key Design Decisions

### Safe Zones (Instagram, at 1080x1920 native)
- Top zone: 250px = **13%** — status bar, progress bars, avatar row
- Bottom zone (Reel): 670px = **35%** — caption, CTA, nav bar
- Side margins: 80px = **7.4%** — content padding
- All UI elements use percentage-based positioning so they scale proportionally with card size (360px wide = 0.333 scale factor)

### Card Dimensions
- Feed card: flexible width (constrained by parent)
- Story/Reel cards: **360 x 640px** (9:16 at 0.333 scale of 1080x1920)
- Figma native sizes: Story/Reel = 1080x1920, Single 1:1 = 1200x1200, Single 4:5 = 960x1200, Feed 16:9 = 1920x1080

### Logo Asset Handling
- The `Logo` type in `googleAds` array is NOT rendered as a standalone asset
- Instead, its `imageUrl` is passed as `logoUrl` to `DemandGenCard` components
- Used as the circular advertiser avatar in all Demand Gen card variants
- Filtered out of the "Additional Assets" slide

### SERP Toggle
- `SearchAdCard` has internal `useState` for `desktop`/`mobile` mode
- Desktop: browser chrome wrapper (`.browser-mockup` class)
- Mobile: phone-style frame with status bar, 360px wide

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

## CSS Classes (campaign-board.css)
- `.browser-mockup` — Desktop SERP browser chrome wrapper
- `.browser-mockup__chrome` / `__dots` / `__url` — Browser toolbar
- `.fb-card` — Feed card container
- `.story-card` / `.reel-card` — 360x640 story/reel containers
- `.deck-slide` — Client view presentation slide
- `.deck-slide__header` / `__body` / `__copy` / `__preview` / `__footer` — Slide sections
- `.deck-container` — Client view scroll container
- `.internal-bar` / `.internal-bar-dark` — Ad name/meta shown in internal view only
