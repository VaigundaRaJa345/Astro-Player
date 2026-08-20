# Astro Player

> **Your Sound. Your Universe.**

Astro Player is a premium, futuristic music discovery and streaming application inspired by Spotify, Apple Music, and modern mobile music players. Featuring a deep black and electric blue neon design theme, it works responsively across desktop, tablet, and mobile layouts.

---

## Key Features

1. **Music Discovery & Search:**
   - Interactive home dashboard with dynamic hourly greetings (Good Morning, Afternoon, Evening, Astro).
   - High-fidelity search using YouTube Data API with automatic server-side credentials gating.
   - 600ms debounce on keystrokes to optimize search requests and preserve API key quota.
   - Filter pills (All, Songs, Playlists) and search category indicators.
   - Mood cards (Chill, Energy, Focus, Sleep, Party) and Genre pages.

2. **Compliance-First Hybrid Playback Engine:**
   - Seamlessly streams from YouTube Data API using the official YouTube IFrame Player API.
   - Disables ads and extracts no binary streams, keeping it 100% compliant with YouTube's Terms of Service.
   - Integrates HTML5 Audio API for hosted audio tracks (Astro Originals) and local device caching.
   - Supports Play, Pause, Next, Previous, Volume, Scrub Seek, Shuffle, and Repeat mode loops.

3. **Offline Mode & Download System:**
   - Download eligible tracks (Astro Originals) directly to the browser's Cache Storage API.
   - Offline Mode allows complete searching, viewing, and playback of cached audio tracks when no network is available.
   - Disables offline downloading for YouTube streams due to copyright and licensing regulations, displaying friendly messages in the interface.

4. **Library & Custom Playlists:**
   - Create, edit, and delete custom playlists.
   - Quick "Like Song" operations (adding to Liked Songs playlist) with optimistic UI updates.
   - Stats dashboard: songs played, minutes listened, playlists size, and offline files storage count.
   - Purge history and storage clear controls.

5. **Premium Responsive UX:**
   - **Mobile-first:** Clean bottom navigation bar with a persistent floating mini-player that slides up into a full-screen Now Playing dashboard.
   - **Desktop:** Left-sidebar navigation with integrated playlist creating modals and persistent bottom playback control bar.
   - Custom CSS styling (no heavy frameworks) with glassmorphism panels, scrolling indicators, skeleton loaders, and interactive hover scales.

---

## Tech Stack

* **Frontend:**
  - React 18 & Vite (Fast SPA routing)
  - Lucide React (Line icon vectors)
  - Vanilla CSS modules & CSS variables
* **Backend:**
  - Node.js & Express (RESTful monorepo API)
  - SQLite3 (Zero-setup development SQL database fallback)
  - PG (PostgreSQL client pool for production scaling)
  - JSON Web Tokens (JWT token authorizations)
  - BcryptJS (Password hashing security)

---

## Directory Structure

```
Astro-Player/
├── client/                 # React Frontend Client (Vite)
│   ├── public/             # Branding favicons and PWA manifest
│   ├── src/
│   │   ├── components/     # Sidebar, MobileNav, MiniPlayer, FullPlayer overlays
│   │   ├── context/        # AuthContext and PlaybackContext engines
│   │   ├── services/       # http api calls and offline handlers
│   │   ├── views/          # Pages (Splash, Onboarding, Home, Search, Liked, etc.)
│   │   ├── index.css       # Color tokens, skeleton animations, custom scrollbars
│   │   └── main.jsx        # Boot wrapper
├── server/                 # Express Backend Server (Node.js)
│   ├── src/
│   │   ├── config/         # SQL connection pool (Postgres + SQLite fallback)
│   │   ├── controllers/    # Route controllers (Auth, Songs, Playlists)
│   │   ├── middleware/     # JWT check middlewares
│   │   └── index.js        # Main Express listener
```

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/VaigundaRaJa345/Astro-Player.git
cd Astro-Player
```

### 2. Configure Environment Variables
Create a local `.env` file in the root folder of the project.
```bash
cp .env.example .env
```
Open `.env` and configure:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_token_here
YOUTUBE_API_KEY=your_youtube_api_key_here
DATABASE_URL=
```
> Note: If `DATABASE_URL` is left blank, Astro Player will automatically construct and connect to a local SQLite database file (`server/astro_player.db`).

### 3. Install All Dependencies
Execute the monorepo installer command:
```bash
npm run install:all
```

---

## Running the Application

### Start Development Mode
To start both the client and server concurrently, run:
```bash
npm run dev
```
* **Frontend:** Runs locally on [http://localhost:3000](http://localhost:3000)
* **Backend:** Runs locally on [http://localhost:5000](http://localhost:5000)

### Production Build
To test the production build of the Vite application:
```bash
npm run build:client
```
The static files will bundle inside the `client/dist/` directory, ready to be served.

---

## License

Distributed under the MIT License. Copyright © 2026 VaigundaRaJa345 and Astro Player Contributors.
