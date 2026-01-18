import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Music, Download, Album as AlbumIcon, Clock, Sparkles, Play } from 'lucide-react';
import { searchTracks, downloadTrack } from '../services/api';
import { formatDuration, getArtworkUrl } from '../utils/format';
import ArtistLinks from '../components/ArtistLinks';
import type { Track } from '../types/api';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await searchTracks(query);
      setTracks(response.data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search tracks');
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (track: Track) => {
    try {
      await downloadTrack(track.id, track.title, track.audioQuality);
    } catch (err) {
      console.error('Failed to download track:', err);
      alert(`Failed to download ${track.title}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleAlbumClick = (albumId: number) => {
    navigate(`/album/${albumId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1],
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-50 sticky top-0 bg-white/70 backdrop-blur-xl border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3"
            >
              <motion.div
                whileHover={{ rotate: 10 }}
                className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-md"
              >
                <Music className="w-6 h-6 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Muzik
              </h1>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-16 md:mb-24"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 mb-8"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Lossless Audio</span>
          </motion.div>

          <h2 className="text-5xl md:text-7xl font-bold mb-6 text-gray-900 tracking-tight leading-tight">
            Discover & Download
            <br />
            <span className="text-gray-400">
              Your Music
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-12 font-normal">
            Search millions of tracks in pristine quality
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <motion.div
              whileFocus={{ scale: 1.02 }}
              className="relative group"
            >
              <div className="relative flex items-center">
                <Search className="absolute left-6 w-6 h-6 text-gray-400 z-10" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Artists, Songs, Lyrics, and more"
                  className="w-full pl-16 pr-36 py-5 md:py-6 text-lg md:text-xl rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md"
                />
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-3 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search'}
                </motion.button>
              </div>
            </motion.div>
          </form>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="max-w-3xl mx-auto mb-8 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results - Modern Grid */}
        {tracks.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="mb-10"
            >
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                Search Results
              </h3>
              <p className="text-lg text-gray-500">
                Found {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tracks.map((track) => (
                <motion.div
                  key={track.id}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative"
                >
                  <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col cursor-pointer border border-gray-100"
                    onClick={() => handleAlbumClick(track.album.id)}
                  >
                    {/* Album Artwork */}
                    {track.album?.cover && (
                      <motion.div
                        className="relative aspect-square overflow-hidden"
                        whileHover={{ scale: 1.1 }}
                        style={{ borderRadius: '12px' }}
                        transition={{ duration: 0.4 }}
                      >
                        <img
                          src={getArtworkUrl(track.album.cover, 640)}
                          alt={track.album.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          whileHover={{ scale: 1.1 }}
                        >
                          <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-xl flex items-center justify-center shadow-lg">
                            <Play className="w-6 h-6 text-black ml-1" fill="currentColor" />
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                    
                    {/* Track Info */}
                    <div className="pt-4 flex-1 flex flex-col">
                      <div className="flex-1 mb-4">
                        <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                          {track.title}
                          {track.explicit && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-600 font-medium">
                              E
                            </span>
                          )}
                        </h4>
                        <ArtistLinks
                          artists={track.artists}
                          className="text-base text-gray-600 font-medium mb-3 line-clamp-1"
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            {formatDuration(track.duration)}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                            {track.audioQuality === 'LOSSLESS' ? 'Hi-Res' : track.audioQuality}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <motion.div
                        className="flex gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <motion.button
                          onClick={() => handleDownload(track)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-blue-700 transition-all"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </motion.button>
                        {track.album && (
                          <motion.button
                            onClick={() => handleAlbumClick(track.album.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium transition-all"
                          >
                            <AlbumIcon className="w-4 h-4" />
                          </motion.button>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && tracks.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center py-32"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
              className="inline-block mb-8"
            >
              <div className="w-32 h-32 rounded-3xl bg-gray-100 flex items-center justify-center shadow-sm">
                <Music className="w-16 h-16 text-gray-400" />
              </div>
            </motion.div>
            <p className="text-2xl text-gray-500 font-medium mb-2">
              Ready to discover music?
            </p>
            <p className="text-lg text-gray-400">
              Start by searching for your favorite songs
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default SearchPage;
