import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Artist {
  id: number;
  name: string;
}

interface ArtistLinksProps {
  artists: Artist[];
  className?: string;
}

function ArtistLinks({ artists, className = '' }: ArtistLinksProps) {
  const navigate = useNavigate();

  const handleArtistClick = (artistId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    navigate(`/artist/${artistId}`);
  };

  if (artists.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {artists.map((artist, index) => (
        <span key={artist.id} className="flex items-center">
          <motion.button
            onClick={(e) => handleArtistClick(artist.id, e)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors underline decoration-transparent hover:decoration-current underline-offset-2"
          >
            {artist.name}
          </motion.button>
          {index < artists.length - 1 && (
            <span className="text-gray-400 mx-1">,</span>
          )}
        </span>
      ))}
    </div>
  );
}

export default ArtistLinks;
