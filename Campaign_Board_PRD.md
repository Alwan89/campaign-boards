# Campaign Board Web App — Product Requirements Document

**Author:** Alex Wan, Periphery Digital
**Date:** February 15, 2026
**Version:** 1.0
**Status:** Ready for Build

---

## 1. Executive Summary

Periphery Digital needs a hosted web app that replaces the current self-contained HTML campaign board files. The app lets the internal team and clients visually review Meta Ads campaigns as pixel-accurate Facebook ad previews (Feed, Story, Reel), with the ability to edit ad copy in real-time and export corrections. It is hosted on GitHub Pages with creative assets (images, videos) served from Google Drive, and ad copy read from / written back to Google Sheets. The build pipeline is triggered through a Claude skill (Cowork plugin), making campaign board generation a one-step workflow.

### Why This Exists

Today, when Periphery Digital sets up a Meta Ads campaign for a real estate client, the team needs to:

1. **QA the creative + copy** — verify that the right images/videos are paired with the right ad copy, check for typos, confirm CTA text, and ensure each ad set has the correct placements.
2. **Get client approval** — share a visual preview that shows the client exactly how their ads will appear on Facebook, without giving them access to Ads Manager.
3. **Correct mistakes** — when copy errors are found, edits need to flow back to the ad copy source (currently an xlsx sheet, moving to Google Sheets) so the campaign manager can update Ads Manager.

The current approach generates a ~400KB self-contained HTML file plus a `campaign_videos/` folder (~55MB). Sharing requires zipping the two together and sending via Google Drive or Slack. This is fragile (the folder structure must stay intact), heavy (55MB+), and doesn't allow corrections to flow back.

The web app solves all of this: one shareable link, assets streamed from Google Drive, ad copy editable in the browser with changes synced to Google Sheets.

---

## 2. Users and Personas

### 2.1 Campaign Manager (Internal — Primary User)
- Sets up Meta Ads campaigns for real estate clients (pre-sale, rental, lease-up)
- Needs to QA creative + copy before launch
- Needs to catch and fix copy errors
- Wants a fast workflow: run a skill → get a link → review → correct → launch
- Uses Cowork and Claude Code daily

### 2.2 Account Manager (Internal)
- Reviews campaigns before sharing with clients
- Needs the "internal view" with ad set structure, file names, tier information
- May flag copy corrections

### 2.3 Client (External)
- Receives a shareable link to review their ads
- Sees a clean "client view" — just the ad previews, no internal metadata
- Should not see ad set names, file names, targeting details, or the edit panel

### 2.4 Future: Approver
- Eventually, clients should be able to "approve" directly in the web app
- Out of scope for v1, but the architecture should not preclude this

---

## 3. Product Architecture

### 3.1 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  CLAUDE SKILL (Cowork Plugin / Claude Code)                     │
│                                                                 │
│  Inputs:                                                        │
│  ├── Creative export folder (Google Drive)                      │
│  ├── Ad copy (Google Sheet)                                     │
│  └── Campaign brief / ClickUp task                              │
│                                                                 │
│  Processing:                                                    │
│  ├── Scan creative files → inventory assets                     │
│  ├── Parse ad copy from Google Sheet                            │
│  ├── Map creatives to copy (by naming convention)               │
│  ├── Generate campaign data.json                                │
│  ├── Get Google Drive share links for all assets                │
│  └── Commit data.json to GitHub repo                            │
│                                                                 │
│  Output:                                                        │
│  └── Shareable URL: peripherydigital.github.io/boards/[slug]   │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│  GITHUB REPO: periphery-campaign-boards                         │
│                                                                 │
│  /                                                              │
│  ├── src/                    ← React app source (Vite)          │
│  │   ├── components/                                            │
│  │   │   ├── FeedCard.jsx                                       │
│  │   │   ├── StoryCard.jsx                                      │
│  │   │   ├── ReelCard.jsx                                       │
│  │   │   ├── CarouselCard.jsx                                   │
│  │   │   ├── EditPanel.jsx                                      │
│  │   │   ├── CampaignHeader.jsx                                 │
│  │   │   └── ExportButton.jsx                                   │
│  │   ├── App.jsx                                                │
│  │   ├── main.jsx                                               │
│  │   └── styles/                                                │
│  ├── campaigns/              ← Campaign data (one JSON per)     │
│  │   ├── edgemont-feb2026/                                      │
│  │   │   └── data.json                                          │
│  │   ├── anotherproject-mar2026/                                │
│  │   │   └── data.json                                          │
│  │   └── index.json          ← Campaign registry                │
│  ├── public/                                                    │
│  ├── dist/                   ← Built output (GitHub Pages)      │
│  ├── vite.config.js                                             │
│  └── package.json                                               │
│                                                                 │
│  Deploy: GitHub Actions → GitHub Pages on push                  │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│  HOSTED WEB APP: peripherydigital.github.io/campaign-boards     │
│                                                                 │
│  URL pattern: /campaign-boards/[campaign-slug]                  │
│  Optional:    ?view=client  (defaults to client view)           │
│               ?view=internal                                    │
│                                                                 │
│  Loads:                                                         │
│  ├── Campaign data from /campaigns/[slug]/data.json             │
│  ├── Images from Google Drive (direct links in data.json)       │
│  ├── Videos from Google Drive (direct links in data.json)       │
│  └── All rendering happens client-side (React)                  │
│                                                                 │
│  Writes back:                                                   │
│  └── Copy edits → Google Sheets API (via client-side auth       │
│      or a lightweight API proxy)                                │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + Vite | Fast build, modern tooling, components already exist |
| Styling | CSS (custom) | Pixel-accurate Facebook UI requires precise control; the existing CSS already achieves this |
| Routing | React Router (hash-based) | GitHub Pages doesn't support server-side routing; hash routing works without config |
| Export | SheetJS (xlsx) | Client-side xlsx generation, already integrated |
| Hosting | GitHub Pages | Free, auto-deploy via GitHub Actions, team already uses GitHub |
| Assets | Google Drive | Team's standard for file storage; videos too large for GitHub |
| Ad Copy Source | Google Sheets | Replaces xlsx files; real-time collaboration, API access for read/write |
| CI/CD | GitHub Actions | Auto-build + deploy on push to main |

### 3.3 Google Drive Integration

All creative assets (images and videos) are stored in Google Drive. The web app loads them via direct links.

**Image URLs:**
```
https://drive.google.com/uc?export=view&id={FILE_ID}
```

**Video URLs:**
```
https://drive.google.com/uc?export=download&id={FILE_ID}
```

**Requirements:**
- All creative files must be shared as "Anyone with the link can view"
- The skill should automate setting this permission when generating the board
- `data.json` stores the Drive file IDs, and the web app constructs the URLs

**Drive Folder Structure (standardized):**
```
Periphery Digital/
  Campaign Boards/
    [Client Name] - [Campaign Name]/
      Feed/
        *.jpg, *.png
      StoryReel/
        *.jpg, *.mp4
```

### 3.4 Google Sheets Integration

Ad copy lives in Google Sheets instead of xlsx files. This enables:
- Real-time collaboration on copy
- API-based read/write from the web app
- No file downloads/uploads needed

**Read flow:** The skill reads the Google Sheet to populate `data.json` with ad copy.

**Write-back flow (v2):** When someone edits copy in the campaign board and clicks "Save to Sheet," the web app writes the changes back to the Google Sheet via the Sheets API. This requires either:
- A lightweight API proxy (Cloudflare Worker or similar) with a service account
- Or client-side Google OAuth for authenticated Periphery team members

**For v1:** Export to xlsx download (already implemented). Google Sheets write-back is a v2 feature once auth is sorted.

**Standard Ad Copy Sheet Columns:**
| Column | Description |
|--------|-------------|
| Ad Name | Internal naming convention (e.g., `Lead_EN_SingleImage_202602_BrookridgeLane`) |
| Type | Single Image, Video, Carousel |
| Concept | Creative concept name |
| Placement | Feed, StoryReel |
| Primary Text | Main ad body copy |
| Headline | Link bar headline |
| Description | Link bar description line |
| CTA | Call-to-action button text |
| Carousel Card Headlines | One per card (Carousel only) |
| Carousel Card Descriptions | One per card (Carousel only) |

### 3.5 Cowork Plugin Integration

The campaign board is part of the `periphery-meta-ads` Cowork plugin. The existing plugin has these skills:

| Skill | Purpose | Board Integration |
|-------|---------|-------------------|
| `meta-creative-intake` | Scans creative folders + parses ad copy | **Primary input** — feeds data to board generation |
| `meta-ads-setup` | Sets up campaigns from briefs | Can trigger board generation as final step |
| `meta-ads-qa` | QA checks campaigns | Board is the visual QA layer |
| `meta-ad-previews` | Formats preview links | Board replaces this entirely |
| `meta-ads-preview-mockup` | Current board generation skill | **This gets replaced** by the new web app flow |

**New Skill: `generate-campaign-board`**

This skill should:
1. Accept inputs: Google Drive folder URL, Google Sheet URL, campaign name
2. Run `meta-creative-intake` to scan assets and parse copy
3. Generate `data.json` with Drive file IDs and ad copy
4. Commit to the GitHub repo via `gh` CLI
5. Return the shareable URL

**Cowork Review Workflow:**

Eventually, the campaign board should be reviewable directly in Cowork:
- The team member runs the skill → gets a link
- They can open the board in Cowork's browser (Claude in Chrome) for interactive review
- Claude can assist: "Check if the carousel headlines match the copy sheet," "Flag any ads missing descriptions," etc.
- This means the web app should be fully functional in an embedded browser context

---

## 4. Feature Specification

### 4.1 Campaign Board Viewer

**Two views:**
- **Client View** (default): Clean ad previews only. No internal metadata, no edit panels, no file names. This is what gets shared with clients.
- **Internal View**: Full details — ad set membership, file names, tier badges, targeting info, campaign structure tree, and the copy edit panel.

**URL Parameters:**
- `?view=client` — Client view (default)
- `?view=internal` — Internal view
- Optionally: `?view=internal&key=[token]` — simple token-based access control for internal view

### 4.2 Ad Preview Components

All components are pixel-accurate reproductions of real Facebook ad UI. These have been built and validated against real Meta Ads preview screenshots. The existing component code (877 lines of JSX/CSS) is the reference implementation.

**Feed Card (FeedCard)**
- Page avatar + name + "Sponsored · 🌐"
- Primary text with "See more" truncation (expands on click)
- Creative area: single image, video (autoplay/loop/muted), or carousel
- Link bar: domain label, headline (max 2 lines), description, CTA button
- Engagement row: reaction icons, comment count, Like/Comment/Share buttons
- Internal bar: ad name, type, file count, concept, file tags

**Story Card (StoryCard)**
- 270×480px portrait format
- Progress bars at top
- Page avatar + name + "Sponsored"
- Full-bleed image or autoplaying video
- Bottom: chevron icon + white pill CTA with link icon
- Internal overlay bar (dark)

**Reel Card (ReelCard)**
- 270×480px portrait format
- Full-bleed image or autoplaying video
- Bottom gradient overlay
- Page avatar + name
- Caption with interactive "...more" expand
- Full-width white CTA button
- "Sponsored" label + dots menu
- Internal overlay bar (dark)

**Carousel (CarouselCreative)**
- Horizontally scrollable cards (260px each)
- Per-card: image, headline, description, CTA button
- Left/right navigation arrows
- Smooth CSS transition on scroll

### 4.3 Copy Editing (Internal View Only)

Each ad gets an **EditPanel** beside the preview showing:
- **Primary Text** — textarea (multi-line)
- **Headline** — text input
- **Description** — text input
- **CTA** — text input
- **Carousel Cards** — per-card headline + description inputs (if carousel type)

**Behavior:**
- Edits update the adjacent preview in real-time (React state)
- Modified fields get an amber highlight + dot indicator
- Each ad has a "Reset" button to undo changes
- Header shows count of modified ads
- All copy lives in React state; original values stored in a ref for diffing

### 4.4 Export

**v1: XLSX Download**
- Green "Export Copy" button in header (internal view only)
- Downloads `[Campaign Name]_AdCopy_Updated.xlsx` via SheetJS
- Columns: Ad Name, Type, Concept, Placement, Primary Text, Headline, Description, CTA, Status
- Carousel card rows nested under parent ad
- Modified rows marked with "MODIFIED" status
- Badge on button shows count of modifications

**v2: Google Sheets Write-Back**
- "Save to Sheet" button syncs edits back to the source Google Sheet
- Requires auth (service account or OAuth)
- Only modified cells are updated
- Confirmation dialog before write

### 4.5 Ad Deduplication

Ads that appear in multiple ad sets (e.g., the same 3 Feed ads used across Broad/Interest/Retargeting tiers) are shown **once** with tier membership badges:
- Internal view: "Ad Sets:" with named pills showing color-coded tier dots
- Client view: "Runs in:" with tier badges (only shown if ad runs in multiple tiers)

### 4.6 Video Handling

- Videos load from Google Drive direct download URLs
- `<video>` elements with `autoPlay loop muted playsInline` (matches real FB Stories/Reels behavior)
- `poster` attribute uses a thumbnail image (also from Drive) for loading state
- Graceful fallback: if video URL fails, show static image + play button overlay

### 4.7 Campaign Registry

The app needs a way to list all available campaign boards:

**`/campaigns/index.json`:**
```json
[
  {
    "slug": "edgemont-feb2026",
    "name": "PD_Edgemont_Lead_EN",
    "project": "The Edgemont Collection",
    "client": "Domus Homes",
    "date": "2026-02",
    "status": "active"
  }
]
```

**Landing page** (`/campaign-boards/`): Lists all campaigns with links. Internal-only (not shared with clients). Clients receive direct campaign URLs only.

---

## 5. Data Model

### 5.1 Campaign Data JSON (`data.json`)

This is the core data file generated by the skill. It replaces the current approach of injecting JS variables into the HTML template.

```typescript
interface CampaignData {
  campaign: {
    name: string;           // "PD_Edgemont_Lead_EN"
    project: string;        // "The Edgemont Collection"
    developer: string;      // "Domus Homes"
    objective: string;      // "Lead Generation"
    budget: string;         // "$75/day"
    languages: string[];    // ["EN"]
    housing_category: boolean;
    landing_page: string;   // "theedgemontcollection.com"
  };

  adSets: Array<{
    id: string;
    name: string;           // "Lead_EN_Broad_Feed"
    tier: "Broad" | "Interest" | "Retargeting";
    placement: "Feed" | "StoryReel";
    targeting: string;
    ads: string[];          // ad IDs
  }>;

  ads: Array<{
    id: string;
    name: string;           // "Lead_EN_SingleImage_202602_BrookridgeLane"
    type: "Single Image" | "Video" | "Carousel";
    placement: "Feed" | "StoryReel";
    subPlacements?: string[];  // ["Story", "Reel"]
    concept: string;
    files: string[];        // original filenames
    isVideo?: boolean;

    // Google Drive asset references
    imageUrl: string;       // Drive direct view URL
    videoUrl?: string;      // Drive direct download URL (video ads only)
    thumbnailUrl?: string;  // Drive thumbnail URL (video poster)

    copy: {
      primary: string;
      headline?: string;
      description?: string;
      cta: string;
    };

    carouselCards?: Array<{
      imageUrl: string;     // Drive direct view URL
      headline: string;
      description?: string;
    }>;
  }>;

  // Source references
  sources: {
    driveFolder: string;    // Google Drive folder URL
    copySheet?: string;     // Google Sheet URL
    clickupTask?: string;   // ClickUp task URL
  };

  // Metadata
  meta: {
    generatedAt: string;    // ISO timestamp
    generatedBy: string;    // "periphery-meta-ads v0.4.0"
    boardVersion: string;   // "1.0"
  };
}
```

### 5.2 Google Drive File ID Extraction

Given a Google Drive URL like:
```
https://drive.google.com/file/d/1a2b3c4d5e6f/view
```

The file ID is: `1a2b3c4d5e6f`

The web app constructs:
- Image URL: `https://drive.google.com/uc?export=view&id=1a2b3c4d5e6f`
- Video URL: `https://drive.google.com/uc?export=download&id=1a2b3c4d5e6f`

Alternatively, `data.json` can store pre-constructed URLs so the app doesn't need to know about Drive URL patterns.

---

## 6. Existing Code Reference

The following code is the **proven, working implementation** that should be used as the starting point. It has been validated against real Meta Ads preview screenshots for pixel accuracy.

### 6.1 CSS (157 lines)

The CSS includes precise Facebook UI reproduction:
- Feed card layout with exact padding, font sizes, colors matching `facebook.com`
- Story card: 270×480px, progress bars, bottom gradient, pill CTA
- Reel card: 270×480px, bottom gradient, avatar + caption, full-width CTA
- Carousel: 260px per card, navigation arrows, smooth scroll
- Edit panel: sticky positioning, input styling, modified highlights
- Color variables: `--fb-bg`, `--fb-text`, `--fb-secondary`, `--fb-link`, `--fb-cta-bg`, `--periphery` (#6B2D8B), tier colors

### 6.2 Component Structure

The existing template has these components:
- `PlayIcon`, `GlobeIcon`, `LikeIcon`, `ThumbIcon`, `CommentIcon`, `ShareIcon`, `LinkIcon` — SVG icons matching Facebook UI
- `FeedCard({ ad, isClient })` — Full feed ad card
- `CarouselCreative({ ad })` — Carousel within feed card
- `StoryCard({ ad, isClient })` — Story format preview
- `ReelCard({ ad, isClient })` — Reel format preview with interactive "...more"
- `EditPanel({ ad, originalAd, onUpdateCopy, onUpdateCarousel, onReset })` — Copy editor
- `App()` — Main app with view toggle, state management, deduplication, export

### 6.3 State Management Pattern

```javascript
// Editable copy state (deep clone of original ads)
const [adsState, setAdsState] = useState(() =>
  ADS.map(a => ({
    ...a,
    copy: {...a.copy},
    carouselCards: a.carouselCards ? a.carouselCards.map(c => ({...c})) : undefined
  }))
);

// Original for diffing
const originalAdsRef = useRef(
  ADS.map(a => ({
    id: a.id, name: a.name, type: a.type, concept: a.concept, placement: a.placement,
    copy: {...a.copy},
    carouselCards: a.carouselCards ? a.carouselCards.map(c => ({...c})) : undefined
  }))
);

// Update functions
const updateAdCopy = (adId, field, value) => {
  setAdsState(prev => prev.map(ad =>
    ad.id === adId ? {...ad, copy: {...ad.copy, [field]: value}} : ad
  ));
};

const updateCarouselCard = (adId, cardIndex, field, value) => {
  setAdsState(prev => prev.map(ad => {
    if (ad.id !== adId || !ad.carouselCards) return ad;
    const newCards = ad.carouselCards.map((c, i) => i === cardIndex ? {...c, [field]: value} : c);
    return {...ad, carouselCards: newCards};
  }));
};
```

### 6.4 Deduplication Pattern

```javascript
// Build map: adId → array of { tier, adSetName, targeting }
const adTierMap = {};
AD_SETS.forEach(as => {
  as.ads.forEach(adId => {
    if (!adTierMap[adId]) adTierMap[adId] = [];
    adTierMap[adId].push({ tier: as.tier, adSetName: as.name, targeting: as.targeting });
  });
});

// Group unique ads by placement
const placements = [
  { key: "Feed", label: "Feed Ads", clientLabel: "Feed Ads" },
  { key: "StoryReel", label: "Story & Reel Ads", clientLabel: "Story & Reel Ads" },
];

const adsByPlacement = {};
placements.forEach(p => { adsByPlacement[p.key] = []; });
const seen = new Set();
adsState.forEach(ad => {
  const pl = ad.placement || "Feed";
  if (!seen.has(ad.id)) {
    seen.add(ad.id);
    if (adsByPlacement[pl]) adsByPlacement[pl].push(ad);
  }
});
```

### 6.5 Export Pattern

```javascript
const exportToXlsx = () => {
  const rows = [];
  adsState.forEach((ad, i) => {
    const orig = originalAdsRef.current[i];
    const modified = JSON.stringify(ad.copy) !== JSON.stringify(orig.copy);
    rows.push({
      "Ad Name": ad.name,
      "Type": ad.type,
      "Concept": ad.concept,
      "Placement": ad.placement || "Feed",
      "Primary Text": ad.copy.primary,
      "Headline": ad.copy.headline || "",
      "Description": ad.copy.description || "",
      "CTA": ad.copy.cta,
      "Status": modified ? "MODIFIED" : "",
    });
    // ... carousel card sub-rows
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ad Copy");
  XLSX.writeFile(wb, campaignName + "_AdCopy_Updated.xlsx");
};
```

---

## 7. Periphery Digital Brand

The web app should use Periphery Digital's visual identity:
- **Primary color (Insight Purple):** `#6B2D8B`
- **Font:** Inter (Google Fonts) for UI; system fonts for Facebook preview accuracy
- **Logo:** "PD" monogram in purple circle (or actual logo if available)
- **Tier colors:** Broad = `#3b82f6` (blue), Interest = `#10b981` (green), Retargeting = `#f97316` (orange)

---

## 8. Build Phases

### Phase 1: Core Web App (MVP)
- [ ] Scaffold Vite + React project
- [ ] Port all existing components (FeedCard, StoryCard, ReelCard, Carousel, EditPanel)
- [ ] Port all existing CSS
- [ ] Implement campaign data loading from `/campaigns/[slug]/data.json`
- [ ] Implement hash-based routing (`/#/[campaign-slug]`)
- [ ] Client/Internal view toggle via URL param
- [ ] Copy editing with real-time preview updates
- [ ] XLSX export
- [ ] GitHub Actions auto-deploy to GitHub Pages
- [ ] Test with Edgemont campaign as proof of concept

### Phase 2: Google Drive Asset Integration
- [ ] Build skill script to scan Drive folders and extract file IDs
- [ ] Generate `data.json` with Drive URLs for all images/videos
- [ ] Test video playback from Drive direct download links
- [ ] Handle Drive permission automation (set "Anyone with the link")
- [ ] Fallback handling: if Drive URL fails, show placeholder with filename

### Phase 3: Google Sheets Integration
- [ ] Build skill to read ad copy from Google Sheet (replace xlsx parsing)
- [ ] Map Sheet columns to campaign data model
- [ ] Write-back: implement "Save to Sheet" in web app (requires auth)
- [ ] Service account setup or OAuth flow for Periphery team

### Phase 4: Skill Integration (Cowork Plugin)
- [ ] Create `generate-campaign-board` skill in `periphery-meta-ads` plugin
- [ ] Skill accepts: Drive folder URL, Sheet URL, campaign name
- [ ] Skill generates `data.json`, commits to GitHub, returns shareable URL
- [ ] Integrate with existing `meta-creative-intake` and `meta-ads-setup` skills
- [ ] Cowork review workflow: open board in Claude in Chrome, assist with QA

### Phase 5: Polish & Future
- [ ] Campaign index/landing page
- [ ] Simple password or token-based access for internal view
- [ ] Client approval workflow (approve/request changes)
- [ ] Commenting per ad
- [ ] Version history (track copy changes over time)
- [ ] Mobile responsive layout

---

## 9. Files to Include as Context

When building this in Claude Code, provide the following files for reference:

1. **`board_template.html`** (877 lines) — The complete working template with all components, CSS, state management, edit panel, and export. This is the gold standard for the React components and pixel-accurate CSS.

2. **`build_board_v2.py`** (152 lines) — The current Edgemont-specific builder script showing the data injection pattern, video handling, and image base64 approach (which will be replaced by Drive URLs).

3. **`edgemont_images.json`** — Base64-encoded images for Edgemont (for testing during development before Drive integration is complete).

4. **This PRD** — Full context on architecture, integrations, and feature requirements.

---

## 10. Claude Code Build Prompt

Use the following as the initial prompt when starting the Claude Code build:

---

**PROMPT START**

I'm building a hosted campaign board web app for my digital marketing agency (Periphery Digital). The app shows pixel-accurate Facebook ad previews (Feed, Story, Reel) for Meta Ads campaigns, with internal copy editing and export.

**What I need built:**

A Vite + React web app deployed to GitHub Pages at `peripherydigital.github.io/campaign-boards`. Each campaign loads a `data.json` from the repo. Images and videos are served from Google Drive via direct links. The app has two views: a clean client preview and an internal QA view with editable ad copy fields.

**I have a complete working HTML template** (877 lines) with all components already built and validated against real Facebook screenshots. The React components (FeedCard, StoryCard, ReelCard, CarouselCreative, EditPanel), CSS, state management, deduplication logic, and SheetJS export all work. This needs to be ported into a proper Vite + React project with proper component files, routing, and campaign data loading.

**Key architecture decisions:**
- Vite + React 18 (no Next.js, no backend needed)
- Hash-based routing for GitHub Pages compatibility (`/#/campaign-slug`)
- Campaign data in `/campaigns/[slug]/data.json` committed to the repo
- Creative assets (images, videos) referenced as Google Drive URLs in data.json
- Google Sheets replaces xlsx as the ad copy source (read via Sheets API in the skill, write-back in v2)
- SheetJS for client-side xlsx export (already implemented)
- GitHub Actions for auto-deploy on push

**What the components do:**
- `FeedCard` — Facebook feed ad with header, primary text (expandable), creative (image/video/carousel), link bar (domain, headline, description, CTA), engagement row
- `StoryCard` — 270×480px story format with progress bars, avatar, video/image, pill CTA
- `ReelCard` — 270×480px reel format with avatar, caption (interactive "...more" expand), full-width CTA, Sponsored label
- `CarouselCreative` — Horizontally scrollable cards with nav arrows
- `EditPanel` — Copy editor with Primary Text, Headline, Description, CTA fields; shows modified indicators; has Reset button per ad
- `App` — Main layout with view toggle, campaign header, structure tree, deduplication, export button

**For v1, I need:**
1. The Vite project scaffolded with all components ported from the template
2. Campaign data loading from JSON files in the repo
3. Hash routing so `/#/edgemont-feb2026` loads that campaign
4. The campaign index page listing all campaigns
5. GitHub Actions workflow for auto-deploy to Pages
6. The Edgemont campaign working as proof of concept (using the existing data)

**Attached files:**
- `board_template.html` — The complete working template (port components from this)
- `build_board_v2.py` — Current builder showing the data structure
- `Campaign_Board_PRD.md` — Full PRD with architecture, data model, integrations

Please read the PRD first, then the template, then scaffold the project and port everything over. Keep the CSS pixel-accurate — don't change any of the Facebook UI styling. The edit panel and export functionality should work exactly as they do in the template.

**PROMPT END**

---

## 11. Success Criteria

### v1 Launch Criteria
- [ ] Edgemont campaign board renders identically to current HTML file
- [ ] Client view shows no internal metadata
- [ ] Internal view shows edit panel with real-time preview updates
- [ ] Export produces correct xlsx with modification tracking
- [ ] Videos play from Google Drive URLs
- [ ] Auto-deploys on push via GitHub Actions
- [ ] Link loads in < 3 seconds on standard connection
- [ ] Works in Chrome, Safari, Firefox
- [ ] Shareable URL works without any downloads or folder management

### Ongoing Criteria
- [ ] New campaign board can be generated in < 5 minutes using the skill
- [ ] Copy corrections flow back to source (v2: Google Sheets)
- [ ] Client can review without Periphery team intervention
