# Muzik Downloader

A beautiful, Apple-inspired music downloader app that searches and downloads songs from Tidal using the wolf.qqdl.site API.

## Features

- 🔍 **Search Functionality**: Search for songs using the Tidal API
- 🎵 **Track Download**: Download individual tracks in LOSSLESS quality
- 💿 **Album Support**: View album details and download entire albums
- 🎨 **Apple-Inspired Design**: Clean, modern UI with smooth animations
- 📱 **Responsive**: Works beautifully on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Search for Songs**: Enter a song name in the search bar and click "Search"
2. **Download Individual Tracks**: Click the "Download" button next to any track
3. **View Albums**: Click the album name next to a track to view all tracks in that album
4. **Download Entire Album**: On the album page, click "Download All" to download all tracks

## API Endpoints Used

- `GET /search/q={query}` - Search for tracks
- `GET /album/?id={albumId}` - Get album details
- `GET /track/?id={trackId}&q=LOSSLESS` - Download track

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Lucide React** - Icons

## License

MIT
