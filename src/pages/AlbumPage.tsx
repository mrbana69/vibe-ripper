import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Music, Clock, Calendar, User, Loader2, Play } from 'lucide-react';
import { getAlbum, downloadTrack, downloadAlbum } from '../services/api';
import { formatDuration, getArtworkUrl } from '../utils/format';
import ArtistLinks from '../components/ArtistLinks';
import type { AlbumResponse, Track } from '../types/api';

function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [albumData, setAlbumData] = useState<AlbumResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingTracks, setDownloadingTracks] = useState<Set<number>>(new Set());
  const [downloadingAlbum, setDownloadingAlbum] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchAlbum = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getAlbum(parseInt(id));
        setAlbumData(data);
        setImageError(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load album');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [id]);

  const handleDownloadTrack = async (track: Track) => {
    setDownloadingTracks(prev => new Set(prev).add(track.id));
    try {
      await downloadTrack(track.id, track.title, track.audioQuality);
    } catch (err) {
      console.error('Failed to download track:', err);
      alert(`Failed to download ${track.title}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDownloadingTracks(prev => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }
  };

  const handleDownloadAll = async () => {
    if (!albumData || downloadingAlbum) return;
    
    const tracks = albumData.data.items.map(item => item.item);
    setDownloadingAlbum(true);
    setDownloadProgress({ current: 0, total: tracks.length });
    
    try {
      await downloadAlbum(
        tracks,
        albumData.data.title,
        (current, total) => {
          setDownloadProgress({ current, total });
        }
      );
    } catch (err) {
      console.error('Failed to download album:', err);
      alert(`Failed to download album: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDownloadingAlbum(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1],
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-6"
          />
          <p className="text-xl text-gray-600 font-medium">Loading album...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !albumData) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-xl text-red-600 mb-6 font-medium">{error || 'Album not found'}</p>
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 rounded-2xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700"
          >
            Go Back
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const { data: album } = albumData;
  const tracks = album.items.map(item => item.item);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-gray-900 font-sans">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-50 sticky top-0 bg-white/70 backdrop-blur-xl border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5">
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            <span className="text-lg font-semibold">Back</span>
          </motion.button>
        </div>
      </motion.header>

      {/* Album Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row gap-12 lg:gap-16 mb-16"
        >
          {/* Album Cover */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, rotateY: -15 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-shrink-0"
          >
            {album.cover && !imageError ? (
              <motion.div
                whileHover={{ scale: 1.02, rotateY: 5 }}
                transition={{ duration: 0.3 }}
                className="relative group"
              >
                <img
                  src={getArtworkUrl(album.cover, 1280)}
                  alt={album.title}
                  className="w-full max-w-md lg:w-[500px] lg:h-[500px] rounded-2xl shadow-2xl object-cover"
                  style={{
                    backgroundColor: album.vibrantColor || '#e5e7eb',
                  }}
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 rounded-2xl bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <motion.div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                    <Play className="w-10 h-10 text-gray-900 ml-1" fill="currentColor" />
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <div
                className="w-full max-w-md lg:w-[500px] lg:h-[500px] rounded-2xl shadow-2xl bg-gray-200 flex items-center justify-center"
                style={{
                  backgroundColor: album.vibrantColor || '#e5e7eb',
                }}
              >
                <Music className="w-32 h-32 text-white/50" />
              </div>
            )}
          </motion.div>

          {/* Album Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex-1 flex flex-col justify-end space-y-8"
          >
            <div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gray-900 tracking-tight leading-tight">
                {album.title}
              </h1>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <ArtistLinks
                  artists={album.artists}
                  className="text-2xl text-gray-700 font-semibold"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-lg text-gray-600 mb-8">
              <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-200">
                <Calendar className="w-5 h-5" />
                {new Date(album.releaseDate).getFullYear()}
              </span>
              <span className="px-4 py-2 rounded-full bg-white shadow-sm border border-gray-200 font-semibold">
                {album.numberOfTracks} tracks
              </span>
              <span className="px-4 py-2 rounded-full bg-white shadow-sm border border-gray-200">
                {formatDuration(album.duration)}
              </span>
              {album.explicit && (
                <span className="px-4 py-2 bg-gray-200 rounded-full text-sm font-medium">
                  Explicit
                </span>
              )}
              <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-semibold">
                {album.audioQuality}
              </span>
            </div>

            <div className="space-y-4">
              <motion.button
                onClick={handleDownloadAll}
                disabled={downloadingAlbum}
                whileHover={{ scale: downloadingAlbum ? 1 : 1.05 }}
                whileTap={{ scale: downloadingAlbum ? 1 : 0.95 }}
                className="w-full lg:w-auto px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold text-lg flex items-center justify-center gap-3 shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {downloadingAlbum ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Downloading... ({downloadProgress.current}/{downloadProgress.total})
                  </>
                ) : (
                  <>
                    <Download className="w-6 h-6" />
                    Download All ({album.numberOfTracks} tracks)
                  </>
                )}
              </motion.button>
              {downloadingAlbum && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full lg:w-auto max-w-md bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner"
                >
                  <motion.div
                    className="bg-blue-600 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(downloadProgress.current / downloadProgress.total) * 100}%`
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Track List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-10 text-gray-900 tracking-tight">
            Tracklist
          </h2>
          <div className="space-y-3">
            {tracks.map((track, index) => (
              <motion.div
                key={track.id}
                variants={itemVariants}
                whileHover={{ x: 4, backgroundColor: '#F9FAFB' }}
                className="group px-6 py-4 rounded-xl transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-6">
                  <span className="text-gray-400 text-xl w-12 text-right font-bold">
                    {track.trackNumber || index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {track.title}
                      {track.explicit && (
                        <span className="ml-2 text-xs px-2 py-1 bg-gray-200 rounded-full text-gray-600 font-medium">
                          E
                        </span>
                      )}
                    </h3>
                    {track.artists.length > 0 && (
                      <ArtistLinks
                        artists={track.artists}
                        className="text-base text-gray-600 font-medium"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-base text-gray-500 flex items-center gap-2 font-medium">
                      <Clock className="w-5 h-5" />
                      {formatDuration(track.duration)}
                    </span>
                    <motion.button
                      onClick={() => handleDownloadTrack(track)}
                      disabled={downloadingTracks.has(track.id)}
                      whileHover={{ scale: downloadingTracks.has(track.id) ? 1 : 1.05 }}
                      whileTap={{ scale: downloadingTracks.has(track.id) ? 1 : 0.95 }}
                      className="px-6 py-2.5 rounded-full bg-gray-100 text-blue-600 font-semibold text-sm flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingTracks.has(track.id) ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AlbumPage;
