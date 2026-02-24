/**
 * driveScanner.js — Scan a Google Drive folder for creative assets.
 *
 * Browser port of scripts/drive_scanner.py.
 * Uses fetch() with OAuth2 access token instead of service account.
 *
 * Recursively scans subfolders so users can point at a parent folder
 * that contains per-campaign or per-placement sub-folders.
 */
import { googleFetch } from './googleAuth';

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
const VIDEO_EXTS = new Set(['mp4', 'mov']);
const ALL_CREATIVE_EXTS = new Set([...IMAGE_EXTS, ...VIDEO_EXTS]);
const FOLDER_MIME = 'application/vnd.google-apps.folder';

function makeImageUrl(fileId) {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

function makeDownloadUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * List all items (files + folders) in a single Drive folder.
 */
async function listFolder(folderId) {
  const items = [];
  let pageToken = null;

  do {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent('nextPageToken, files(id, name, mimeType, size)');
    let url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=100&orderBy=name`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }

    const response = await googleFetch(url);
    items.push(...(response.files || []));
    pageToken = response.nextPageToken || null;
  } while (pageToken);

  return items;
}

/**
 * Recursively scan a Google Drive folder for creative files.
 *
 * Returns a filename → metadata map (same as Python's build_file_id_map).
 *
 * @param {string} folderId - Google Drive folder ID
 * @param {function} onProgress - Progress callback
 */
export async function buildFileIdMap(folderId, onProgress = null) {
  const fileMap = {};
  let scannedFolders = 0;

  async function scanFolder(id, depth = 0) {
    scannedFolders++;
    onProgress?.(`Scanning Drive folder${scannedFolders > 1 ? `s (${scannedFolders} scanned)` : ''}…`);

    const items = await listFolder(id);
    console.log(`[DriveScanner] Folder ${id} (depth ${depth}): ${items.length} items`, items.map(f => `${f.name} (${f.mimeType})`));

    for (const f of items) {
      // Recurse into subfolders (max depth 5 to avoid runaway)
      if (f.mimeType === FOLDER_MIME) {
        if (depth < 5) {
          await scanFolder(f.id, depth + 1);
        }
        continue;
      }

      const name = f.name;
      const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';

      // Skip non-creative files
      if (!ALL_CREATIVE_EXTS.has(ext)) continue;

      const fileId = f.id;
      const isVideo = VIDEO_EXTS.has(ext);

      fileMap[name] = {
        file_id: fileId,
        image_url: makeImageUrl(fileId),
        download_url: makeDownloadUrl(fileId),
        is_video: isVideo,
        ext,
      };
    }
  }

  await scanFolder(folderId);
  const fileCount = Object.keys(fileMap).length;
  console.log(`[DriveScanner] DONE: ${fileCount} creative files in ${scannedFolders} folders`, Object.keys(fileMap));
  onProgress?.(`Found ${fileCount} creative files in ${scannedFolders} folder${scannedFolders > 1 ? 's' : ''}.`);

  return fileMap;
}
