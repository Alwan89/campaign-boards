/**
 * assembleData.js — Combine parsed ad copy + Drive file map into data.json.
 *
 * Browser port of scripts/assemble_data.py.
 * Pure JavaScript — no API calls, just data transformation.
 */

// ─── Filename parsing ────────────────────────────────────────────────────────

function parseFilename(filename) {
  const ext = filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
  const namePart = filename.includes('.') ? filename.slice(0, filename.lastIndexOf('.')) : filename;

  // Creative type
  let creativeType;
  if (filename.includes('Carousel')) {
    const rangeMatch = filename.match(/Carousel_(\d+)[-_](\d+)/);
    if (rangeMatch) {
      creativeType = `Carousel Cards ${rangeMatch[1]}-${rangeMatch[2]}`;
    } else {
      const numMatch = filename.match(/Carousel_(\d+)/);
      creativeType = numMatch ? `Carousel Card ${numMatch[1]}` : 'Carousel';
    }
  } else if (filename.includes('Single')) {
    creativeType = 'Single Image';
  } else if (['mp4', 'mov'].includes(ext)) {
    creativeType = 'Video';
  } else if (filename.includes('GIF') || ext === 'gif') {
    creativeType = 'GIF';
  } else {
    creativeType = 'Image';
  }

  // Placement + sub-placement
  let placement = 'Feed';
  let subPlacement = 'Feed';

  const hasStory = /Story/i.test(filename);
  const hasReel = /Reel/i.test(filename);
  const hasStoryReel = /StoryReel/i.test(filename);
  const hasFeed = /Feed/i.test(filename);

  if (hasStoryReel) {
    placement = 'StoryReel';
    subPlacement = 'StoryReel';
  } else if (hasStory) {
    placement = 'StoryReel';
    subPlacement = 'Story';
  } else if (hasReel) {
    placement = 'StoryReel';
    subPlacement = 'Reel';
  } else if (hasFeed) {
    placement = 'Feed';
    subPlacement = 'Feed';
  }

  // Parse segments
  const segments = namePart.replace(/-/g, '_').split('_');
  const project = segments[0] || 'Unknown';

  // Sub-community / concept label — derived from filename segments
  // instead of hard-coding project-specific names
  let subCommunity = 'General';

  // Platform detection
  let platform = 'Meta';
  for (const seg of segments) {
    const sl = seg.toLowerCase();
    if (['meta', 'facebook', 'instagram', 'google', 'linkedin', 'wechat', 'tiktok'].includes(sl)) {
      platform = ['facebook', 'instagram'].includes(sl) ? 'Meta' : seg.charAt(0).toUpperCase() + seg.slice(1);
      break;
    }
  }

  // Date label
  let dateLabel = '';
  const dateMatch1 = filename.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\d{4}/);
  if (dateMatch1) {
    dateLabel = dateMatch1[0];
  } else {
    const dateMatch2 = filename.match(/(\d{6})/);
    if (dateMatch2) dateLabel = dateMatch2[0];
  }

  // Concept key
  const skipKeywords = new Set(['story', 'reel', 'storyreel', 'feed', 'stories', 'reels']);
  const conceptSegments = segments.map(s => s.toLowerCase()).filter(s => !skipKeywords.has(s));
  const conceptKey = conceptSegments.join('_');

  return {
    filename, project, sub_community: subCommunity, platform, creative_type: creativeType,
    placement, sub_placement: subPlacement, date_label: dateLabel, ext, concept_key: conceptKey,
  };
}

// ─── Grouping ────────────────────────────────────────────────────────────────

function groupIntoAds(parsedFiles) {
  const groups = {};

  for (const c of parsedFiles) {
    const key = `${c.concept_key}|${c.placement}`;
    if (!groups[key]) {
      groups[key] = {
        concept_key: c.concept_key,
        ad_set_type: c.placement,
        creative_type: c.creative_type,
        project: c.project,
        sub_community: c.sub_community,
        date_label: c.date_label,
        files: [],
        sub_placements_covered: [],
      };
    }
    groups[key].files.push(c);
    if (!groups[key].sub_placements_covered.includes(c.sub_placement)) {
      groups[key].sub_placements_covered.push(c.sub_placement);
    }
  }

  // Upgrade creative_type for carousel groups
  for (const group of Object.values(groups)) {
    if (group.files.some(f => f.creative_type.includes('Carousel'))) {
      group.creative_type = 'Carousel';
    }
  }

  return groups;
}

// ─── Copy matching ───────────────────────────────────────────────────────────

function matchCopyToAd(adGroup, metaAdsCopy) {
  const cType = adGroup.creative_type.toLowerCase();
  const placement = adGroup.ad_set_type.toLowerCase();
  const copyEntries = Object.entries(metaAdsCopy);

  // If only one copy group exists, use it for everything
  if (copyEntries.length === 1) return copyEntries[0][1];

  let bestMatch = null;
  let bestScore = 0;

  for (const [groupName, fields] of copyEntries) {
    const nameLower = groupName.toLowerCase();
    let score = 0;

    // Creative type match (+2)
    if (nameLower.includes(cType)) {
      score += 2;
    } else if (cType === 'single image' && nameLower.includes('single')) {
      score += 2;
    } else if (cType === 'video' && (nameLower.includes('video') || nameLower.includes('reel'))) {
      score += 2;
    } else if (cType === 'carousel' && nameLower.includes('carousel')) {
      score += 2;
    } else if (cType === 'image' && (nameLower.includes('single') || nameLower.includes('image'))) {
      score += 1;
    }

    // Placement match (+1)
    if (placement === 'storyreel' && (nameLower.includes('story') || nameLower.includes('reel'))) {
      score += 1;
    } else if (placement === 'feed' && (nameLower.includes('feed') || !nameLower.includes('story'))) {
      score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = fields;
    }
  }

  // Fallback: if no match, use the first copy group rather than leaving blank
  if (!bestMatch && copyEntries.length > 0) {
    bestMatch = copyEntries[0][1];
  }

  return bestMatch;
}

function extractAdCopy(fields, lang = 'en') {
  if (!fields) return { primary: '', headline: '', description: '', cta: '' };
  return {
    primary: fields.text?.[lang] || '',
    headline: fields.headline?.[lang] || '',
    description: fields.description?.[lang] || '',
    cta: fields.cta?.[lang] || fields.button?.[lang] || '',
  };
}

function extractCarouselCards(fields, fileMap, adFiles, lang = 'en') {
  const cards = [];

  const carouselFiles = adFiles
    .filter(f => f.creative_type.includes('Carousel'))
    .sort((a, b) => a.filename.localeCompare(b.filename));

  const numberedHeadlines = Object.keys(fields || {})
    .filter(k => k.startsWith('headline_'))
    .sort((a, b) => {
      const na = parseInt(a.match(/(\d+)/)?.[1] || '0');
      const nb = parseInt(b.match(/(\d+)/)?.[1] || '0');
      return na - nb;
    });

  const cardCount = Math.max(carouselFiles.length, numberedHeadlines.length, 1);

  for (let i = 0; i < cardCount; i++) {
    const card = {};

    if (i < carouselFiles.length) {
      const fname = carouselFiles[i].filename;
      const fdata = fileMap[fname] || {};
      card.imageUrl = fdata.image_url || '';
    } else {
      card.imageUrl = '';
    }

    const hKey = `headline_${i + 1}`;
    if (fields?.[hKey]) {
      card.headline = fields[hKey][lang] || '';
    } else if (i === 0 && fields?.headline) {
      card.headline = fields.headline[lang] || '';
    } else {
      card.headline = '';
    }

    const dKey = `description_${i + 1}`;
    if (fields?.[dKey]) {
      card.description = fields[dKey][lang] || '';
    } else if (i === 0 && fields?.description) {
      card.description = fields.description[lang] || '';
    } else {
      card.description = '';
    }

    cards.push(card);
  }

  return cards;
}

// ─── Ad set generation ───────────────────────────────────────────────────────

const TIER_CONFIG = {
  Broad: { targeting: 'Location only — Advantage+ ON' },
  Interest: { targeting: 'Combined audience — all interests' },
  Retargeting: { targeting: 'Website visitors, video viewers, lead openers' },
};

const TIERS = ['Broad', 'Interest', 'Retargeting'];
const PLACEMENTS = ['Feed', 'StoryReel'];

function generateAdSets(ads, campaignConfig, lang = 'EN') {
  const feedAdIds = ads.filter(a => a.placement === 'Feed').map(a => a.id);
  const srAdIds = ads.filter(a => a.placement === 'StoryReel').map(a => a.id);

  const obj = campaignConfig.objective || 'Lead';
  const objPrefix = obj.split(' ')[0] || 'Lead';

  const adSets = [];
  let counter = 1;

  for (const tier of TIERS) {
    for (const placement of PLACEMENTS) {
      const adIds = placement === 'Feed' ? feedAdIds : srAdIds;
      adSets.push({
        id: `as${counter}`,
        name: `${objPrefix}_${lang}_${tier}_${placement}`,
        tier,
        placement,
        targeting: TIER_CONFIG[tier].targeting,
        ads: [...adIds],
      });
      counter++;
    }
  }

  return adSets;
}

// ─── Main assembler ──────────────────────────────────────────────────────────

/**
 * Combine parsed copy + Drive file map + campaign config into data.json.
 *
 * @param {object} copyData - Output of parseCopyFromSheet()
 * @param {object} fileMap - Output of buildFileIdMap()
 * @param {object} campaignConfig - Campaign-level metadata
 * @param {string} lang - Language code for copy (default "en")
 * @returns {object} { data, report }
 */
export function assemble(copyData, fileMap, campaignConfig, lang = 'en') {
  const metaAdsCopy = copyData.meta_ads || {};

  // 1. Parse all filenames
  const parsedFiles = Object.keys(fileMap).map(fn => parseFilename(fn));

  // 2. Group into ads
  const adGroups = groupIntoAds(parsedFiles);

  // 3. Build ad objects
  const ads = [];
  let adCounter = 1;
  const unmatchedAds = [];

  const sortedKeys = Object.keys(adGroups).sort();
  for (const key of sortedKeys) {
    const group = adGroups[key];
    const placement = group.ad_set_type;

    const matchedCopy = matchCopyToAd(group, metaAdsCopy);
    if (!matchedCopy) {
      unmatchedAds.push(`${group.creative_type} / ${placement}`);
    }

    const adCopy = extractAdCopy(matchedCopy, lang);
    const isCarousel = group.creative_type === 'Carousel';
    const isVideo = group.files.some(f => ['mp4', 'mov'].includes(f.ext));

    const primaryFile = group.files[0];
    const primaryFdata = fileMap[primaryFile.filename] || {};

    const dateLabel = group.date_label || 'undated';
    const objPrefix = (campaignConfig.objective || 'Lead').split(' ')[0];
    const langUpper = lang.toUpperCase();
    const cTypeLabel = group.creative_type.replace(/ /g, '');
    const conceptLabel = group.sub_community.replace(/ /g, '');
    const placementLabel = placement === 'StoryReel' ? `_${placement}` : '';

    const adName = `${objPrefix}_${langUpper}_${cTypeLabel}_${dateLabel}${placementLabel}_${conceptLabel}`;

    const ad = {
      id: `ad${adCounter}`,
      name: adName,
      type: group.creative_type,
      placement,
      concept: group.sub_community,
      files: group.files.map(f => f.filename),
      imageUrl: primaryFdata.image_url || '',
      copy: adCopy,
    };

    if (isVideo) {
      ad.isVideo = true;
      const videoFile = group.files.find(f => ['mp4', 'mov'].includes(f.ext));
      if (videoFile) {
        const vdata = fileMap[videoFile.filename] || {};
        ad.videoUrl = vdata.download_url || null;
      } else {
        ad.videoUrl = null;
      }
    }

    if (placement === 'StoryReel' && group.sub_placements_covered.length > 0) {
      ad.subPlacements = group.sub_placements_covered;
    }

    if (isCarousel) {
      ad.carouselCards = extractCarouselCards(matchedCopy, fileMap, group.files, lang);
    }

    ads.push(ad);
    adCounter++;
  }

  // 4. Generate ad sets
  const langUpper = (campaignConfig.languages?.[0]) || 'EN';
  const adSets = generateAdSets(ads, campaignConfig, langUpper);

  // 5. Assemble final structure
  const data = {
    campaign: {
      name: campaignConfig.name || '',
      project: campaignConfig.project || copyData.project_name || '',
      developer: campaignConfig.developer || '',
      objective: campaignConfig.objective || 'Lead Generation',
      budget: campaignConfig.budget || '',
      languages: campaignConfig.languages || ['EN'],
      housing_category: campaignConfig.housing_category || false,
      landing_page: campaignConfig.landing_page || '',
    },
    adSets,
    ads,
    sources: {
      driveFolder: campaignConfig.drive_folder_id || null,
      copySheet: campaignConfig.sheet_id || null,
      clickupTask: null,
    },
    meta: {
      generatedAt: new Date().toISOString(),
      generatedBy: 'campaign-builder-web',
      boardVersion: '1.0',
    },
  };

  // 6. Report
  const matchedGroups = new Set();
  for (const key of sortedKeys) {
    const group = adGroups[key];
    const match = matchCopyToAd(group, metaAdsCopy);
    if (match) {
      for (const [gname, fields] of Object.entries(metaAdsCopy)) {
        if (fields === match) matchedGroups.add(gname);
      }
    }
  }
  const unmatchedCopyGroups = Object.keys(metaAdsCopy).filter(g => !matchedGroups.has(g));

  return {
    data,
    report: {
      total_ads: ads.length,
      total_ad_sets: adSets.length,
      total_files: Object.keys(fileMap).length,
      unmatched_ads: unmatchedAds,
      unmatched_copy_groups: unmatchedCopyGroups,
    },
  };
}
