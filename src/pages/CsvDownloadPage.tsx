import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Download, Music, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { findExactTrack, downloadAlbum } from '../services/api';
import { formatDuration } from '../utils/format';
import type { CsvRow, Track } from '../types/api';

interface CsvTrackResult {
  csvRow: CsvRow;
  track: Track | null;
  status: 'pending' | 'found' | 'not_found' | 'error';
  error?: string;
}

function CsvDownloadPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [results, setResults] = useState<CsvTrackResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setCsvFile(file);
    setError(null);
    setCsvData([]);
    setResults([]);
  };

  const parseCsv = () => {
    if (!csvFile) return;

    setLoading(true);
    setError(null);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Failed to parse CSV file: ' + results.errors[0].message);
          setLoading(false);
          return;
        }

        const data = results.data as CsvRow[];
        setCsvData(data);
        setResults(data.map(row => ({ csvRow: row, track: null, status: 'pending' })));
        setLoading(false);
      },
      error: (error) => {
        setError('Failed to parse CSV file: ' + error.message);
        setLoading(false);
      }
    });
  };

  const searchTracks = async () => {
    if (results.length === 0) return;

    setSearching(true);
    setError(null);

    const updatedResults = [...results];

    for (let i = 0; i < updatedResults.length; i++) {
      try {
        const track = await findExactTrack(updatedResults[i].csvRow);
        updatedResults[i] = {
          ...updatedResults[i],
          track,
          status: track ? 'found' : 'not_found'
        };
      } catch (err) {
        updatedResults[i] = {
          ...updatedResults[i],
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }

      setResults([...updatedResults]);
    }

    setSearching(false);
  };

  const downloadAllTracks = async () => {
    const foundTracks = results.filter(r => r.status === 'found' && r.track).map(r => r.track!);
    if (foundTracks.length === 0) return;

    setDownloading(true);
    setError(null);

    try {
      await downloadAlbum(
        foundTracks,
        'Spotify Export Download',
        (current, total) => setDownloadProgress({ current, total })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download tracks');
    } finally {
      setDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
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
                <FileText className="w-6 h-6 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                CSV Download
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
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Spotify Export</span>
          </motion.div>

          <h2 className="text-5xl md:text-7xl font-bold mb-6 text-gray-900 tracking-tight leading-tight">
            Download from
            <br />
            <span className="text-gray-400">
              CSV Export
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-12 font-normal">
            Upload your Spotify CSV export and download all tracks in lossless quality
          </p>

          {/* File Upload */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-2xl bg-white hover:border-blue-500 transition-all duration-300">
                <Upload className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-xl font-medium text-gray-900 mb-2">
                  {csvFile ? csvFile.name : 'Drop your CSV file here'}
                </p>
                <p className="text-gray-500">
                  {csvFile ? `${(csvFile.size / 1024 / 1024).toFixed(2)} MB` : 'Supports Spotify Exportify CSV files'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Parse Button */}
          {csvFile && csvData.length === 0 && (
            <motion.button
              onClick={parseCsv}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-8 px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold text-lg shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Parsing CSV...
                </>
              ) : (
                'Parse CSV'
              )}
            </motion.button>
          )}
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

        {/* CSV Data */}
        {csvData.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-12"
          >
            <motion.div
              variants={itemVariants}
              className="text-center mb-8"
            >
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                CSV Data Loaded
              </h3>
              <p className="text-lg text-gray-500">
                Found {csvData.length} {csvData.length === 1 ? 'track' : 'tracks'}
              </p>
            </motion.div>

            {/* Search Button */}
            <motion.div
              variants={itemVariants}
              className="text-center mb-8"
            >
              <motion.button
                onClick={searchTracks}
                disabled={searching}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold text-lg shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Searching for tracks...
                  </>
                ) : (
                  'Search for Tracks'
                )}
              </motion.button>
            </motion.div>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                        {result.csvRow['Track Name']}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {result.csvRow['Artist Name(s)']}
                      </p>
                      <p className="text-sm text-gray-500">
                        {result.csvRow['Album Name']}
                      </p>
                    </div>
                    <div className="ml-4">
                      {result.status === 'pending' && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        </div>
                      )}
                      {result.status === 'found' && (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      )}
                      {result.status === 'not_found' && (
                        <XCircle className="w-8 h-8 text-red-500" />
                      )}
                      {result.status === 'error' && (
                        <AlertCircle className="w-8 h-8 text-orange-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Music className="w-4 h-4" />
                    {formatDuration(parseInt(result.csvRow['Duration (ms)'], 10))}
                  </div>

                  {result.status === 'found' && result.track && (
                    <div className="text-sm text-green-600 font-medium">
                      Found: {result.track.title}
                    </div>
                  )}
                  {result.status === 'not_found' && (
                    <div className="text-sm text-red-600 font-medium">
                      Track not found
                    </div>
                  )}
                  {result.status === 'error' && (
                    <div className="text-sm text-orange-600 font-medium">
                      Error: {result.error}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Download Button */}
            {results.some(r => r.status === 'found') && (
              <motion.div
                variants={itemVariants}
                className="text-center mt-12"
              >
                <motion.button
                  onClick={downloadAllTracks}
                  disabled={downloading}
                  whileHover={{ scale: downloading ? 1 : 1.05 }}
                  whileTap={{ scale: downloading ? 1 : 0.95 }}
                  className="px-12 py-6 rounded-xl bg-blue-600 text-white font-semibold text-xl flex items-center justify-center gap-3 shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50 mx-auto"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin" />
                      Downloading... ({downloadProgress.current}/{downloadProgress.total})
                    </>
                  ) : (
                    <>
                      <Download className="w-8 h-8" />
                      Download All Tracks ({results.filter(r => r.status === 'found').length})
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default CsvDownloadPage;
