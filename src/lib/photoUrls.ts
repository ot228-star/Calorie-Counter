/**
 * Same remote image, smaller file/decode cost for list thumbnails vs detail hero.
 * Unsplash: adjust w= query. picsum: path segments are width/height.
 */
export function resizeRemotePhotoUrl(uri: string, maxWidth: number): string {
  if (!uri) return uri;
  try {
    if (uri.includes("images.unsplash.com")) {
      const parsed = new URL(uri);
      parsed.searchParams.set("w", String(maxWidth));
      // Force a widely supported raster format for device compatibility.
      parsed.searchParams.set("fm", "jpg");
      // Keep quality explicit and predictable across vendors/CDN negotiation.
      if (!parsed.searchParams.has("q")) parsed.searchParams.set("q", "80");
      return parsed.toString();
    }
    if (uri.includes("picsum.photos/")) {
      const m = uri.match(/picsum\.photos\/(\d+)\/(\d+)/);
      if (m) {
        const w = Math.min(maxWidth, Number(m[1]));
        const h = Math.round((Number(m[2]) / Number(m[1])) * w);
        return uri.replace(/picsum\.photos\/\d+\/\d+/, `picsum.photos/${w}/${h}`);
      }
    }
  } catch {
    // ignore
  }
  return uri;
}

export function mapPhotoUrisForMaxWidth(uris: string[], maxWidth: number): string[] {
  return uris.map((u) => resizeRemotePhotoUrl(u, maxWidth));
}
