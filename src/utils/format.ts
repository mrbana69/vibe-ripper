export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatArtists(artists: Array<{ name: string }>): string {
  return artists.map(artist => artist.name).join(', ');
}

export function getArtworkUrl(pictureId: string | null | undefined, size: number = 1280): string {
  if (!pictureId) {
    return '';
  }
  // Replace dashes with slashes: "4944372b-dee2-4f19-b20c-88806773c2ae" -> "4944372b/dee2/4f19/b20c/88806773c2ae"
  const formattedId = pictureId.replace(/-/g, '/');
  return `https://resources.tidal.com/images/${formattedId}/${size}x${size}.jpg`;
}
