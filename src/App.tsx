import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import AlbumPage from './pages/AlbumPage';
import ArtistPage from './pages/ArtistPage';
import CsvDownloadPage from './pages/CsvDownloadPage';
import SpotifyPage from './pages/SpotifyPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/album/:id" element={<AlbumPage />} />
          <Route path="/artist/:id" element={<ArtistPage />} />
          <Route path="/csv-download" element={<CsvDownloadPage />} />
          <Route path="/spotify" element={<SpotifyPage />} />
          <Route path="/spotify-callback" element={<SpotifyPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
