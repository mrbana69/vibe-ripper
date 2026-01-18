import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Star, ExternalLink } from 'lucide-react';
import { getArtist } from '../services/api';
import type { ArtistProfileResponse } from '../types/api';

function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artistData, setArtistData] = useState<ArtistProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchArtist = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getArtist(parseInt(id));
        setArtistData(data);
        setImageError(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artist');
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [id]);

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
          <p className="text-xl text-gray-600 font-medium">Loading artist...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !artistData) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-xl text-red-600 mb-6 font-medium">{error || 'Artist not found'}</p>
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

  const { artist, cover } = artistData;

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

      {/* Artist Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row gap-12 lg:gap-16 mb-16"
        >
          {/* Artist Image */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, rotateY: -15 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-shrink-0"
          >
            {cover["750"] && !imageError ? (
              <motion.div
                whileHover={{ scale: 1.02, rotateY: 5 }}
                transition={{ duration: 0.3 }}
                className="relative group"
              >
                <img
                  src={cover["750"]}
                  alt={artist.name}
                  className="w-full max-w-md lg:w-[500px] lg:h-[500px] rounded-full shadow-2xl object-cover border-4 border-white"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 rounded-full bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.div>
            ) : (
              <div className="w-full max-w-md lg:w-[500px] lg:h-[500px] rounded-full shadow-2xl bg-gray-200 flex items-center justify-center border-4 border-white">
                <User className="w-32 h-32 text-white/50" />
              </div>
            )}
          </motion.div>

          {/* Artist Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex-1 flex flex-col justify-end space-y-8"
          >
            <div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gray-900 tracking-tight leading-tight">
                {artist.name}
              </h1>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-2xl text-gray-700 font-semibold">
                  {artist.artistTypes.join(', ')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-lg text-gray-600 mb-8">
              <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-200">
                <Star className="w-5 h-5 text-yellow-500" />
                Popularity: {artist.popularity}
              </span>
              {artist.spotlighted && (
                <span className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 font-semibold">
                  Spotlighted
                </span>
              )}
              {artist.handle && (
                <span className="px-4 py-2 rounded-full bg-white shadow-sm border border-gray-200">
                  @{artist.handle}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <motion.a
                href={artist.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold text-lg shadow-sm hover:bg-blue-700 transition-all"
              >
                <ExternalLink className="w-6 h-6" />
                View on Tidal
              </motion.a>
            </div>
          </motion.div>
        </motion.div>

        {/* Artist Details */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-10 text-gray-900 tracking-tight">
            Artist Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Artist Roles */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Roles</h3>
              <div className="space-y-3">
                {artist.artistRoles.map((role, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <span className="text-lg font-medium text-gray-900">{role.category}</span>
                    <span className="text-sm text-gray-500">ID: {role.categoryId}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mixes */}
            {artist.mixes.ARTIST_MIX && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Mix</h3>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="p-4 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <span className="text-lg font-medium text-gray-900">{artist.mixes.ARTIST_MIX}</span>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ArtistPage;
