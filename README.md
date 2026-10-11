# 🎵 AthleteBeats

> **Where Sports Meets Sound** — A social platform connecting athletes, fans, coaches, and media through music and sports culture.

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-orange?logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./docs/TERMS_OF_SERVICE.md)

---

## 🌟 What is AthleteBeats?

AthleteBeats is a social music and sports platform where athletes share the music they train to, fans discover athlete playlists, coaches build team culture through sound, and media covers it all — in real time. Think Spotify meets ESPN meets MySpace.

---

## ✨ Features

### 🔐 Auth & Security
- Email/password login with strength validation (8+ chars, uppercase, number, special symbol)
- Username creation with real-time availability check
- Google OAuth sign-in
- SMS phone number verification (OTP)
- Multi-role user profiles: Fan 🏆 · Athlete 🏃 · Coach 📋 · Media 📺
- Verified athlete badge system (anti-impersonation)
- Permanent ban system (phone + email flagged in Firestore)

### 👥 Social Platform
- User profiles with followers, following, bio, and role badges
- Posts with shared songs, quotes, and athlete moments
- Like, comment, and emoji reactions
- 24-hour Stories (disappearing content)
- Live presence: see who's online and what they're listening to
- Real-time feed and notifications

### 🏀 Sports & Music
- NBA live scores and lifetime stats via BallDontLie API
- NFL game data via API-Sports
- Sports news articles via NewsAPI
- Spotify music integration (search, share, embedded player)
- SoundCloud integration (independent artist support)
- Bottom persistent music player bar

### 🤖 AI & Safety
- AI content moderation for toxic posts/comments
- Auto-flagging system for rule violations
- Discord bot integration for community updates
- Moderation dashboard for admins

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router DOM |
| Auth | Firebase Authentication |
| Database | Firebase Firestore (NoSQL) |
| Realtime | Firebase Realtime Database |
| Hosting | Firebase Hosting |
| Music | Spotify API, SoundCloud API |
| Sports | BallDontLie (NBA), API-Sports (NFL) |
| News | NewsAPI |
| Community | Discord API |
| AI | OpenAI API (moderation) |

---

## 📁 Project Structure

```
athlete-beats/
├── public/
├── src/
│   ├── assets/          # Images, icons, static files
│   ├── components/      # Reusable UI (AppLayout, Player, etc.)
│   ├── context/         # React Context (AuthContext)
│   ├── pages/           # Route-level components (Login, Home, Profile...)
│   └── services/        # API helper functions (spotify.js, nba.js...)
├── docs/
│   ├── TERMS_OF_SERVICE.md
│   ├── PRIVACY_POLICY.md
│   ├── COMMUNITY_GUIDELINES.md
│   └── ROADMAP.md
├── .env                 # 🔒 Never committed — API keys live here
├── .gitignore
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
- API keys (see Environment Variables below)

### Installation

```bash
# Clone the repo
git clone https://github.com/bradnificent7/athlete-beats.git
cd athlete-beats

# Install dependencies
npm install

# Create a .env file at the root (see Environment Variables below)

# Start the dev server
npm start
```

---

## 🔑 Environment Variables

Create a `.env` file at the **root** of the project (never inside `src/`):

```env
# Firebase
REACT_APP_FIREBASE_API_KEY=your_key_here
REACT_APP_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_PROJECT_ID=your_project_id
REACT_APP_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_APP_ID=your_app_id

# Sports
REACT_APP_BALLDONTLIE_API_KEY=your_key_here
REACT_APP_NEWS_API_KEY=your_key_here

# Music (coming soon)
REACT_APP_SPOTIFY_CLIENT_ID=your_key_here
REACT_APP_SOUNDCLOUD_CLIENT_ID=your_key_here
```

> ⚠️ `.env` is listed in `.gitignore` and will **never** be pushed to GitHub.

---

## 🔒 Security

- All API keys stored in environment variables only
- Firebase Security Rules restrict read/write to authenticated users
- Banned users are flagged by phone number and email — cannot re-register
- Verified athlete badges require manual admin approval
- AI moderation filters toxic content before it goes live

---

## 📄 Legal & Documentation

- [Terms of Service](./docs/TERMS_OF_SERVICE.md)
- [Privacy Policy](./docs/PRIVACY_POLICY.md)
- [Community Guidelines](./docs/COMMUNITY_GUIDELINES.md)
- [Roadmap](./docs/ROADMAP.md)

---

## 🗺 Roadmap Overview

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Auth system, login, user profiles | ✅ Complete |
| Phase 2 | NBA/NFL stats, news feed, AppLayout | 🔨 In Progress |
| Phase 3 | Spotify + SoundCloud music player | 📋 Planned |
| Phase 4 | Social: posts, likes, stories, reactions | 📋 Planned |
| Phase 5 | AI moderation, Discord bot, live presence | 📋 Planned |
| Phase 6 | Mobile app (React Native / PWA) | 📋 Future |

See [ROADMAP.md](./docs/ROADMAP.md) for full details.

---

## 👤 Author

**Bradley Nguyen**
- GitHub: [@bradnificent7](https://github.com/bradnificent7)
- LinkedIn: _add your LinkedIn URL here_
- Portfolio: [bradley-portfolio.web.app](https://bradley-portfolio.web.app)

---

## ⚖️ License & Ownership

© 2026 Bradley Nguyen — All Rights Reserved.

AthleteBeats is a proprietary project. The source code, design, branding, and concept are the intellectual property of Bradley Nguyen. No part of this project may be copied, distributed, or used without explicit written permission.

See [Terms of Service](./docs/TERMS_OF_SERVICE.md) for full legal terms.