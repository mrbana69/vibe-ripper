import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music, Download, LogIn, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { 
  handleSpotifyCallback, 
  getSpotifyUserProfile, 
  getSpotifyLikedSongs, 
  getSpotifyPlaylists, 
  initiateSpotifyLogin,
  findSpotifyTrack,
  downloadAlbum,
  getSpotifyPlaylistTracks
} from '../services/api';
import type { SpotifyUserProfile, SpotifyTrack, SpotifyPlaylist, Track } from '../types/api';

const SpotifyPage = () => {
  const [user, setUser] = useState<SpotifyUserProfile | null>(null);
  const [likedSongs, setLikedSongs] = useState<SpotifyTrack[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0, status: '' });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');

      if (code) {
        try {
          await handleSpotifyCallback(code);
          navigate('/spotify', { replace: true });
          // After auth, fetch data immediately
          fetchData();
        } catch (error) {
          console.error('Error handling Spotify callback:', error);
          setLoading(false);
        }
      }
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        const userProfile = await getSpotifyUserProfile();
        setUser(userProfile);
        const liked = await getSpotifyLikedSongs();
        setLikedSongs(liked);
        const userPlaylists = await getSpotifyPlaylists();
        setPlaylists(userPlaylists);
      } catch (error) {
        console.error('Error fetching Spotify data:', error);
        // If error is due to auth, user will stay null and see login button
      } finally {
        setLoading(false);
      }
    };
    
    if (location.pathname === '/spotify-callback') {
      handleAuth();
    } else {
      fetchData();
    }
  }, [location, navigate]);

  const handleLogin = () => {
    initiateSpotifyLogin();
  };

  const handleDownloadList = async (listName: string, spotifyTracks: SpotifyTrack[]) => {
    if (downloading || spotifyTracks.length === 0) return;
    
    setDownloading(true);
    setDownloadProgress({ current: 0, total: spotifyTracks.length, status: 'Matching tracks...' });

    try {
      const matchedTracks: Track[] = [];
      
      for (let i = 0; i < spotifyTracks.length; i++) {
        setDownloadProgress({ 
          current: i + 1, 
          total: spotifyTracks.length, 
          status: `Matching: ${spotifyTracks[i].name}` 
        });
        
        const track = await findSpotifyTrack(spotifyTracks[i]);
        if (track) {
          matchedTracks.push(track);
        }
      }

      if (matchedTracks.length === 0) {
        alert('No matching tracks found on Tidal.');
        return;
      }

      setDownloadProgress({ 
        current: 0, 
        total: matchedTracks.length, 
        status: 'Downloading tracks...' 
      });

      await downloadAlbum(
        matchedTracks,
        `Spotify - ${listName}`,
        (current, total) => {
          setDownloadProgress({ 
            current, 
            total, 
            status: `Downloading ${current}/${total}` 
          });
        }
      );

    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download tracks');
    } finally {
      setDownloading(false);
      setDownloadProgress({ current: 0, total: 0, status: '' });
    }
  };

  const handleDownloadPlaylist = async (playlist: SpotifyPlaylist) => {
    try {
      setDownloading(true);
      setDownloadProgress({ current: 0, total: 0, status: 'Fetching playlist tracks...' });
      const tracks = await getSpotifyPlaylistTracks(playlist.id);
      await handleDownloadList(playlist.name, tracks);
    } catch (error) {
      console.error('Failed to fetch playlist:', error);
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Music className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect Spotify</h1>
          <p className="text-gray-600 mb-8">
            Connect your Spotify account to import and download your liked songs and playlists in high quality.
          </p>
          <button
            onClick={handleLogin}
            className="px-8 py-4 bg-green-500 text-white rounded-full font-bold text-lg shadow-lg hover:bg-green-600 transition-all flex items-center gap-3 mx-auto"
          >
            <LogIn className="w-5 h-5" />
            Login with Spotify
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-gray-900 font-sans p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            {user.images?.[0]?.url ? (
              <img src={user.images[0].url} alt={user.display_name} className="w-16 h-16 rounded-full shadow-md" />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-gray-500">{user.display_name[0]}</span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.display_name}</h1>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {downloading && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 right-8 bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 z-50 max-w-sm w-full"
          >
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              Processing
            </h3>
            <p className="text-gray-600 mb-2">{downloadProgress.status}</p>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
              />
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Liked Songs Section */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                  <Music className="w-6 h-6" />
                </div>
                Liked Songs
              </h2>
              <button
                onClick={() => handleDownloadList('Liked Songs', likedSongs)}
                disabled={downloading || likedSongs.length === 0}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Download All ({likedSongs.length})
              </button>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {likedSongs.map(track => (
                <div key={track.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                  <div>
                    <p className="font-semibold text-gray-900 line-clamp-1">{track.name}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{track.artists.map(a => a.name).join(', ')}</p>
                  </div>
                </div>
              ))}
              {likedSongs.length === 0 && (
                <p className="text-gray-500 text-center py-8">No liked songs found.</p>
              )}
            </div>
          </div>

          {/* Playlists Section */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <Music className="w-6 h-6" />
                </div>
                Your Playlists
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {playlists.map(playlist => (
                <div key={playlist.id} className="p-4 border border-gray-100 rounded-2xl hover:shadow-md transition-all group bg-gray-50">
                  <div className="aspect-square mb-4 rounded-xl overflow-hidden bg-gray-200">
                    {playlist.images?.[0]?.url ? (
                      <img src={playlist.images[0].url} alt={playlist.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Music className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{playlist.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{playlist.tracks.total} tracks</p>
                  <button
                    onClick={() => handleDownloadPlaylist(playlist)}
                    disabled={downloading}
                    className="w-full py-2 bg-white border border-gray-200 text-gray-900 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              ))}
              {playlists.length === 0 && (
                <p className="text-gray-500 text-center py-8 col-span-full">No playlists found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotifyPage;
