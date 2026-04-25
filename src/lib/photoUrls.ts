/**
 * Same remote image, smaller file/decode cost for list thumbnails vs detail hero.
 * Unsplash: adjust w= query. picsum: path segments are width/height.
 */
export function resizeRemotePhotoUrl(uri: string, maxWidth: number): string {
  if (!uri) return uri;
  try {
    if (uri.includes("images.unsplash.com")) {
      if (/[?&]w=\d+/.test(uri)) {
        return uri.replace(/([?&]w=)\d+/, `$1${maxWidth}`);
      }
      const sep = uri.includes("?") ? "&" : "?";
      return `${uri}${sep}w=${maxWidth}`;
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
