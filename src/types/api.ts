export interface Artist {
  id: number;
  name: string;
  handle: string | null;
  type: string;
  picture: string | null;
}

export interface Album {
  id: number;
  title: string;
  cover: string;
  vibrantColor: string;
  videoCover: string | null;
}

export interface Track {
  id: number;
  title: string;
  duration: number;
  replayGain: number;
  peak: number;
  allowStreaming: boolean;
  streamReady: boolean;
  payToStream: boolean;
  adSupportedStreamReady: boolean;
  djReady: boolean;
  stemReady: boolean;
  streamStartDate: string;
  premiumStreamingOnly: boolean;
  trackNumber: number;
  volumeNumber: number;
  version: string | null;
  popularity: number;
  copyright: string;
  bpm: number;
  key: string;
  keyScale: string | null;
  url: string;
  isrc: string;
  editable: boolean;
  explicit: boolean;
  audioQuality: string;
  audioModes: string[];
  mediaMetadata: {
    tags: string[];
  };
  upload: boolean;
  accessType: string | null;
  spotlighted: boolean;
  artist: Artist;
  artists: Artist[];
  album: Album;
  mixes: {
    TRACK_MIX: string;
  };
}

export interface SearchResponse {
  version: string;
  data: {
    limit: number;
    offset: number;
    totalNumberOfItems: number;
    items: Track[];
  };
}

export interface AlbumResponse {
  version: string;
  data: {
    id: number;
    title: string;
    duration: number;
    streamReady: boolean;
    payToStream: boolean;
    adSupportedStreamReady: boolean;
    djReady: boolean;
    stemReady: boolean;
    streamStartDate: string;
    allowStreaming: boolean;
    premiumStreamingOnly: boolean;
    numberOfTracks: number;
    numberOfVideos: number;
    numberOfVolumes: number;
    releaseDate: string;
    copyright: string;
    type: string;
    version: string | null;
    url: string;
    cover: string;
    vibrantColor: string;
    videoCover: string | null;
    explicit: boolean;
    upc: string;
    popularity: number;
    audioQuality: string;
    audioModes: string[];
    mediaMetadata: {
      tags: string[];
    };
    upload: boolean;
    artist: Artist;
    artists: Artist[];
    items: Array<{
      item: Track;
      type: string;
    }>;
  };
}

export interface TrackManifestResponse {
  version: string;
  data: {
    trackId: number;
    assetPresentation: string;
    audioMode: string;
    audioQuality: string;
    manifestMimeType: string;
    manifestHash: string;
    manifest: string;
    albumReplayGain: number;
    albumPeakAmplitude: number;
    trackReplayGain: number;
    trackPeakAmplitude: number;
    bitDepth: number;
    sampleRate: number;
  };
}

export interface LosslessManifest {
  mimeType: string;
  codecs: string;
  encryptionType: string;
  urls: string[];
}

export interface ArtistRole {
  categoryId: number;
  category: string;
}

export interface ArtistMixes {
  ARTIST_MIX?: string;
}

export interface ArtistProfile {
  id: number;
  name: string;
  artistTypes: string[];
  url: string;
  picture: string;
  selectedAlbumCoverFallback: string | null;
  popularity: number;
  artistRoles: ArtistRole[];
  mixes: ArtistMixes;
  handle: string | null;
  userId: string | null;
  spotlighted: boolean;
}

export interface ArtistCover {
  id: number;
  name: string;
  "750": string;
}

export interface ArtistProfileResponse {
  version: string;
  artist: ArtistProfile;
  cover: ArtistCover;
}

export interface CsvRow {
  'Track URI': string;
  'Track Name': string;
  'Album Name': string;
  'Artist Name(s)': string;
  'Release Date': string;
  'Duration (ms)': string;
  'Popularity': string;
  'Explicit': string;
  'Added By': string;
  'Added At': string;
  'Genres': string;
  'Record Label': string;
  'Danceability': string;
  'Energy': string;
  'Key': string;
  'Loudness': string;
  'Mode': string;
  'Speechiness': string;
  'Acousticness': string;
  'Instrumentalness': string;
  'Liveness': string;
  'Valence': string;
  'Tempo': string;
  'Time Signature': string;
}
