"""
drive_scanner.py — Scan a Google Drive folder for creative assets.

Lists all files in a shared Drive folder and returns metadata with
direct-access URLs for images and videos.

Usage:
    from scripts.drive_scanner import build_file_id_map
    file_map = build_file_id_map("1DEF...uvw")
    # Returns: { "filename.jpg": { "file_id": "...", "image_url": "...", ... } }
"""
from scripts.google_auth import get_drive_service


# File extensions we care about
IMAGE_EXTS = {"jpg", "jpeg", "png", "gif", "webp"}
VIDEO_EXTS = {"mp4", "mov"}
ALL_CREATIVE_EXTS = IMAGE_EXTS | VIDEO_EXTS

# MIME type to extension mapping
MIME_TO_EXT = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
}


def _make_image_url(file_id):
    """Direct view URL for images (renders in browser/img tag)."""
    return f"https://drive.google.com/uc?export=view&id={file_id}"


def _make_download_url(file_id):
    """Direct download URL for videos."""
    return f"https://drive.google.com/uc?export=download&id={file_id}"


def scan_drive_folder(folder_id, service=None):
    """
    List all creative files in a Google Drive folder.

    Returns a list of dicts:
    [
        {
            "filename": "Edgemont_BrookridgeLane_Meta_Single_Feb2026.jpg",
            "file_id": "1a2b3c4d...",
            "mime_type": "image/jpeg",
            "ext": "jpg",
            "is_video": False,
            "image_url": "https://drive.google.com/uc?export=view&id=...",
            "download_url": "https://drive.google.com/uc?export=download&id=...",
        },
        ...
    ]
    """
    if service is None:
        service = get_drive_service()

    files = []
    page_token = None

    while True:
        response = (
            service.files()
            .list(
                q=f"'{folder_id}' in parents and trashed = false",
                fields="nextPageToken, files(id, name, mimeType, size)",
                pageSize=100,
                pageToken=page_token,
                orderBy="name",
            )
            .execute()
        )

        for f in response.get("files", []):
            name = f["name"]
            ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""

            # Skip non-creative files
            if ext not in ALL_CREATIVE_EXTS:
                continue

            file_id = f["id"]
            is_video = ext in VIDEO_EXTS

            files.append(
                {
                    "filename": name,
                    "file_id": file_id,
                    "mime_type": f.get("mimeType", ""),
                    "ext": ext,
                    "is_video": is_video,
                    "image_url": _make_image_url(file_id),
                    "download_url": _make_download_url(file_id),
                    "size": int(f.get("size", 0)),
                }
            )

        page_token = response.get("nextPageToken")
        if not page_token:
            break

    return files


def build_file_id_map(folder_id, service=None):
    """
    Scan a Drive folder and return a filename → metadata dict.

    Returns:
    {
        "Edgemont_BrookridgeLane_Meta_Single_Feb2026.jpg": {
            "file_id": "1a2b3c4d...",
            "image_url": "https://drive.google.com/uc?export=view&id=...",
            "download_url": "https://drive.google.com/uc?export=download&id=...",
            "is_video": False,
            "ext": "jpg",
        },
        ...
    }
    """
    files = scan_drive_folder(folder_id, service)
    return {
        f["filename"]: {
            "file_id": f["file_id"],
            "image_url": f["image_url"],
            "download_url": f["download_url"],
            "is_video": f["is_video"],
            "ext": f["ext"],
        }
        for f in files
    }


def print_drive_summary(folder_id, service=None):
    """Print a summary of files found in a Drive folder."""
    files = scan_drive_folder(folder_id, service)
    images = [f for f in files if not f["is_video"]]
    videos = [f for f in files if f["is_video"]]

    print(f"Drive folder: {folder_id}")
    print(f"Total creative files: {len(files)}")
    print(f"  Images: {len(images)}")
    print(f"  Videos: {len(videos)}")
    print()

    for f in files:
        size_kb = f["size"] / 1024 if f["size"] else 0
        kind = "VIDEO" if f["is_video"] else "IMAGE"
        print(f"  [{kind}] {f['filename']} ({size_kb:.0f} KB)")
