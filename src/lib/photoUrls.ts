/**
 * All food images are served from Supabase Storage.
 * Width resizing is handled via the Supabase Image Transformation API
 * (/storage/v1/render/image/public/) when needed in the future.
 * For now, pass URIs through unchanged.
 */
export function resizeRemotePhotoUrl(uri: string, _maxWidth: number): string {
  return uri;
}

export function mapPhotoUrisForMaxWidth(uris: string[], maxWidth: number): string[] {
  return uris.map((u) => resizeRemotePhotoUrl(u, maxWidth));
}
