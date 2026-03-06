/**
 * Export studio state to XLSX matching the standard ad copy template structure.
 * Exports all languages as separate sheets, with all ad types included.
 */
export async function exportStudioToXlsx(state) {
  const XLSX = await import('xlsx');

  const project = state.project;
  const languages = project.languages || ['en'];
  const wb = XLSX.utils.book_new();

  const LANG_LABELS = { en: 'EN', zh_s: 'ZH-S', zh_t: 'ZH-T', kr: 'KR', fa: 'FA' };

  for (const lang of languages) {
    const rows = [];

    // Single Image
    const si = state.meta['single-image'];
    if (si.text[lang] || si.headline[lang]) {
      rows.push({
        'Ad Type': 'Single Image',
        'Placement': 'Feed + Story/Reel',
        'Primary Text': si.text[lang] || '',
        'Headline': si.headline[lang] || '',
        'Description': si.description[lang] || '',
        'CTA': si.cta || 'Learn More',
        'Destination URL': si.link || project.landingPage || '',
      });
    }

    // Video
    const vid = state.meta.video;
    if (vid.text[lang] || vid.headline[lang]) {
      rows.push({
        'Ad Type': 'Video',
        'Placement': 'Feed + Story/Reel',
        'Primary Text': vid.text[lang] || '',
        'Headline': vid.headline[lang] || '',
        'Description': vid.description[lang] || '',
        'CTA': vid.cta || 'Learn More',
        'Destination URL': vid.link || project.landingPage || '',
      });
    }

    // Carousel
    const car = state.meta.carousel;
    if (car.text[lang] || car.cards.some(c => c.headline[lang])) {
      rows.push({
        'Ad Type': 'Carousel',
        'Placement': 'Feed',
        'Primary Text': car.text[lang] || '',
        'Headline': '',
        'Description': '',
        'CTA': car.cta || 'Learn More',
        'Destination URL': car.link || project.landingPage || '',
      });
      car.cards.forEach((card, i) => {
        if (card.headline[lang] || card.description[lang]) {
          rows.push({
            'Ad Type': `  └ Card ${i + 1}`,
            'Placement': '',
            'Primary Text': '',
            'Headline': card.headline[lang] || '',
            'Description': card.description[lang] || '',
            'CTA': '',
            'Destination URL': '',
          });
        }
      });
    }

    if (rows.length === 0) {
      rows.push({
        'Ad Type': '(no copy entered)',
        'Placement': '', 'Primary Text': '', 'Headline': '',
        'Description': '', 'CTA': '', 'Destination URL': '',
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 18 }, { wch: 20 }, { wch: 60 }, { wch: 35 },
      { wch: 25 }, { wch: 14 }, { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, LANG_LABELS[lang] || lang.toUpperCase());
  }

  const filename = `${project.projectName || project.name || 'Campaign'}_CopyStudio.xlsx`;
  XLSX.writeFile(wb, filename);
}
