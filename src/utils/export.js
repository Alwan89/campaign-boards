export async function exportToXlsx(adsState, originalAds, campaignName) {
  const XLSX = await import('xlsx');

  const rows = [];
  adsState.forEach((ad, i) => {
    const orig = originalAds[i];
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
    if (ad.carouselCards) {
      ad.carouselCards.forEach((card, ci) => {
        const origCard = orig.carouselCards && orig.carouselCards[ci];
        const cardMod = origCard && (card.headline !== origCard.headline || card.description !== origCard.description);
        rows.push({
          "Ad Name": "  \u2514 Card " + (ci + 1),
          "Type": "", "Concept": "", "Placement": "",
          "Primary Text": "",
          "Headline": card.headline,
          "Description": card.description || "",
          "CTA": "",
          "Status": cardMod ? "MODIFIED" : "",
        });
      });
    }
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{wch:45},{wch:12},{wch:18},{wch:12},{wch:60},{wch:35},{wch:25},{wch:12},{wch:10}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ad Copy");
  XLSX.writeFile(wb, (campaignName || "Campaign") + "_AdCopy_Updated.xlsx");
}
