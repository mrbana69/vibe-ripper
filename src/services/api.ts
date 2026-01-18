import JSZip from 'jszip';
import type { SearchResponse, AlbumResponse, TrackManifestResponse, LosslessManifest, ArtistProfileResponse, CsvRow } from '../types/api';
import type { Track } from '../types/api';

const API_BASE_URL = 'https://wolf.qqdl.site';

export async function searchTracks(query: string): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/search/?s=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }
  return response.json();
}

export async function findExactTrack(csvRow: CsvRow): Promise<Track | null> {
  // Search only by track title for broader matching
  const query = csvRow['Track Name'];
  const searchResponse = await searchTracks(query);

  const expectedDuration = parseInt(csvRow['Duration (ms)'], 10);
  const expectedAlbum = csvRow['Album Name'].toLowerCase().trim();
  const expectedTrack = csvRow['Track Name'].toLowerCase().trim();
  const expectedArtists = csvRow['Artist Name(s)'].split(',').map(a => a.toLowerCase().trim());

  // Filter for matches with relaxed criteria
  const matches = searchResponse.data.items.filter(track => {
    const trackTitle = track.title.toLowerCase().trim();
    const albumTitle = track.album.title.toLowerCase().trim();
    const trackArtists = track.artists.map(a => a.name.toLowerCase().trim());
    const durationDiff = Math.abs(track.duration - expectedDuration);

    // Check if track title is similar (contains the expected title or vice versa)
    const titleMatch = trackTitle.includes(expectedTrack) || expectedTrack.includes(trackTitle) ||
                      // Also check for very close matches (allowing for minor differences)
                      levenshteinDistance(trackTitle, expectedTrack) <= 2;

    // Check if album is similar
    const albumMatch = albumTitle.includes(expectedAlbum) || expectedAlbum.includes(albumTitle) ||
                      levenshteinDistance(albumTitle, expectedAlbum) <= 2;

    // Check if artists match (at least one artist should match significantly)
    const artistMatch = expectedArtists.some(expectedArtist =>
      trackArtists.some(trackArtist =>
        trackArtist.includes(expectedArtist) || expectedArtist.includes(trackArtist) ||
        levenshteinDistance(trackArtist, expectedArtist) <= 2
      )
    );

    // Duration should be within 10 seconds (10000 ms) for more flexibility
    const durationMatch = durationDiff <= 10000;

    // Require title + artist match (album optional for flexibility)
    return titleMatch && artistMatch;
  });

  // Return the best match (first one, or the one with closest duration if multiple)
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // If multiple matches, prefer the one with closest duration
  return matches.reduce((best, current) => {
    const bestDiff = Math.abs(best.duration - expectedDuration);
    const currentDiff = Math.abs(current.duration - expectedDuration);
    return currentDiff < bestDiff ? current : best;
  });
}

// Simple Levenshtein distance for fuzzy string matching
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export async function getAlbum(albumId: number): Promise<AlbumResponse> {
  const response = await fetch(`${API_BASE_URL}/album/?id=${albumId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch album: ${response.statusText}`);
  }
  return response.json();
}

export async function getArtist(artistId: number): Promise<ArtistProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/artist/?id=${artistId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch artist: ${response.statusText}`);
  }
  return response.json();
}

export async function getTrackManifest(trackId: number, quality: string = 'LOSSLESS'): Promise<TrackManifestResponse> {
  const response = await fetch(`${API_BASE_URL}/track/?id=${trackId}&q=${quality}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch track manifest: ${response.statusText}`);
  }
  return response.json();
}

function decodeBase64(encoded: string): string {
  try {
    return atob(encoded);
  } catch (e) {
    throw new Error('Failed to decode base64 manifest');
  }
}

function parseLosslessManifest(manifest: string): LosslessManifest {
  const decoded = decodeBase64(manifest);
  try {
    return JSON.parse(decoded) as LosslessManifest;
  } catch (e) {
    throw new Error('Failed to parse manifest as JSON. Manifest might be in XML format.');
  }
}

function isMPDManifest(manifestMimeType: string): boolean {
  return manifestMimeType === 'application/dash+xml' || manifestMimeType.includes('dash') || manifestMimeType.includes('xml');
}

function parseMPDManifest(manifest: string): string[] {
  const decoded = decodeBase64(manifest);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(decoded, 'text/xml');
  
  // Helper function to find elements by local name (ignoring namespace)
  function findElementByLocalName(parent: Element | Document, localName: string): Element | null {
    const allElements = parent.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      if (el.localName === localName || el.tagName === localName) {
        return el;
      }
    }
    return null;
  }
  
  function findElementsByLocalName(parent: Element, localName: string): Element[] {
    const result: Element[] = [];
    const allElements = parent.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      if ((el.localName === localName || el.tagName === localName) && 
          parent.contains(el)) {
        result.push(el);
      }
    }
    return result;
  }
  
  // Handle XML namespaces - find by local name
  const representation = findElementByLocalName(xmlDoc, 'Representation');
  if (!representation) {
    throw new Error('No Representation found in MPD');
  }

  const segmentTemplate = findElementByLocalName(representation, 'SegmentTemplate');
  if (!segmentTemplate) {
    throw new Error('No SegmentTemplate found in MPD');
  }

  const initialization = segmentTemplate.getAttribute('initialization');
  const media = segmentTemplate.getAttribute('media');
  const startNumber = parseInt(segmentTemplate.getAttribute('startNumber') || '1', 10);
  const representationId = representation.getAttribute('id') || '';
  
  const segmentTimeline = findElementByLocalName(segmentTemplate, 'SegmentTimeline');
  if (!segmentTimeline) {
    throw new Error('No SegmentTimeline found in MPD');
  }

  // Parse segment timeline to get segment count
  // <S d="176128" r="24"/> means: 1 segment + 24 repeats = 25 total segments
  // <S d="139075"/> means: 1 segment (no repeat)
  const sElements = findElementsByLocalName(segmentTimeline, 'S');
  let segmentCount = 0;
  
  sElements.forEach((s) => {
    const r = parseInt(s.getAttribute('r') || '0', 10);
    segmentCount += r + 1; // r=0 means 1 segment, r=24 means 25 segments total
  });

  const urls: string[] = [];
  
  // Add initialization segment (usually 0.mp4)
  if (initialization) {
    // URLs in the XML are already full URLs, just replace placeholders
    let initUrl = initialization
      .replace('$RepresentationID$', representationId)
      .replace(/\$Number\$/g, '0'); // Initialization is usually segment 0
    
    // Decode HTML entities like &amp; to &
    initUrl = initUrl.replace(/&amp;/g, '&');
    urls.push(initUrl);
  }
  
  // Add media segments
  for (let i = 0; i < segmentCount; i++) {
    if (media) {
      const segmentNumber = startNumber + i;
      let mediaUrl = media
        .replace('$RepresentationID$', representationId)
        .replace(/\$Number\$/g, segmentNumber.toString());
      
      // Handle $Time$ if present (though the example uses $Number$)
      if (mediaUrl.includes('$Time$')) {
        // Calculate time from segment timeline
        let currentTime = 0;
        let segmentIndex = 0;
        sElements.forEach((s) => {
          const d = parseInt(s.getAttribute('d') || '0', 10);
          const r = parseInt(s.getAttribute('r') || '0', 10);
          
          for (let j = 0; j <= r; j++) {
            if (segmentIndex === i) {
              mediaUrl = mediaUrl.replace('$Time$', currentTime.toString());
              break;
            }
            currentTime += d;
            segmentIndex++;
          }
        });
      }
      
      // Decode HTML entities
      mediaUrl = mediaUrl.replace(/&amp;/g, '&');
      urls.push(mediaUrl);
    }
  }

  return urls;
}

async function downloadFile(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  return response.blob();
}

async function downloadLosslessTrack(trackId: number, quality: string): Promise<Blob> {
  const manifestResponse = await getTrackManifest(trackId, quality);
  
  // Check manifest type - if it's MPD/XML, use MPD parser
  if (isMPDManifest(manifestResponse.data.manifestMimeType)) {
    const urls = parseMPDManifest(manifestResponse.data.manifest);
    
    if (urls.length === 0) {
      throw new Error('No URLs found in MPD manifest');
    }

    // Download all segments
    const blobs = await Promise.all(urls.map(url => downloadFile(url)));
    
    // Combine all blobs into one
    return new Blob(blobs, { type: 'audio/mp4' });
  } else {
    // It's a JSON manifest (LOSSLESS)
    const manifest = parseLosslessManifest(manifestResponse.data.manifest);
    
    if (manifest.urls.length === 0) {
      throw new Error('No URLs found in manifest');
    }

    // Download the FLAC file
    const blob = await downloadFile(manifest.urls[0]);
    return blob;
  }
}

async function downloadHiResTrack(trackId: number): Promise<Blob> {
  const manifestResponse = await getTrackManifest(trackId, 'HI_RES_LOSSLESS');
  const urls = parseMPDManifest(manifestResponse.data.manifest);
  
  if (urls.length === 0) {
    throw new Error('No URLs found in MPD manifest');
  }

  // Download all segments
  const blobs = await Promise.all(urls.map(url => downloadFile(url)));
  
  // Combine all blobs into one
  return new Blob(blobs, { type: 'audio/mp4' });
}

export async function downloadTrack(trackId: number, trackTitle: string, quality: string = 'LOSSLESS'): Promise<void> {
  let blob: Blob;
  
  try {
    if (quality === 'HI_RES_LOSSLESS') {
      blob = await downloadHiResTrack(trackId);
    } else {
      blob = await downloadLosslessTrack(trackId, quality);
    }
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFileName(trackTitle)}.${quality === 'HI_RES_LOSSLESS' ? 'm4a' : 'flac'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to download track: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function downloadAlbum(
  tracks: Track[],
  albumTitle: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  
  try {
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      onProgress?.(i + 1, tracks.length);
      
      try {
        let blob: Blob;
        const quality = track.audioQuality === 'HI_RES_LOSSLESS' ? 'HI_RES_LOSSLESS' : 'LOSSLESS';
        
        if (quality === 'HI_RES_LOSSLESS') {
          blob = await downloadHiResTrack(track.id);
        } else {
          blob = await downloadLosslessTrack(track.id, quality);
        }
        
        const trackNumber = track.trackNumber || i + 1;
        const fileName = `${trackNumber.toString().padStart(2, '0')} - ${sanitizeFileName(track.title)}.${quality === 'HI_RES_LOSSLESS' ? 'm4a' : 'flac'}`;
        zip.file(fileName, blob);
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download track ${track.title}:`, error);
        // Continue with other tracks even if one fails
      }
    }
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Download zip
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFileName(albumTitle)}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to download album: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[<>:"/\\|?*]/g, '_').trim();
}
