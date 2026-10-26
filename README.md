# 🎵 AthleteBeats

> **Where Sports Meets Sound** — a social platform connecting athletes, fans, coaches, and media through music and sports culture.

**Live demo:** https://athlete-beats.web.app

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-orange?logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./docs/TERMS_OF_SERVICE.md)

---

## 🌟 What is AthleteBeats?

AthleteBeats is a MySpace-style social platform for the sports world. Athletes, coaches, fans, and media get a profile with a unique @username, a music box, playlists, and a Top 8. Around that sits a live multi-sport scoreboard, sports and music news, and a trust-and-safety system with email verification, reporting, and admin-approved verified badges.

I'm building it to learn full-stack development and application security by shipping something real, so this README also documents the security decisions behind it.

---

## ✨ Features

### 👤 Accounts & profiles
- Email/password, Google, and phone (SMS code) sign-in
- Password strength rules, password change with re-authentication, and forgot-password email
- Unique **@usernames** claimed atomically with a Firestore transaction, plus a live availability check
- Profiles with first/middle/last name, bio, multiple roles (Fan, Athlete, Coach, Media), color themes, and a music box
- Public profile pages at `/u/<username>`, a people search by name or @username, follower and following counts, and a **Top 8**

### 🛡 Trust & safety
- Email verification required before following or reporting
- **Report** button with reasons, one report per person per reporter, and an admin review queue
- **Verified badges**: users post a proof code on a public page, an admin checks it and approves it, and the approval date is stored and shown
- Firestore rules enforce all of the above server-side (see Security)

### 🎵 Music
- YouTube search, SoundCloud links and SoundCloud playlist import, and Spotify embeds
- Persistent mini player and bottom player bar with next/previous, seek, shuffle, and repeat (off / all / one)
- Playlists with custom colors
- **Trending → Music news**: genre-based news (Hip-Hop, R&B, Pop, Rock, Country, Electronic, Latin) and Apple's top-100 song charts per genre

### 🏀 Sports
- Tabbed scoreboard for NBA, NFL, MLB, NHL, and Soccer with upcoming games and automatic refresh while games are live
- Dedicated NBA and NFL pages with headlines and standings
- Trending sports news across leagues (ESPN's public feeds, no API key needed)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router |
| Auth | Firebase Authentication |
| Database | Cloud Firestore with security rules |
| Hosting | Firebase Hosting |
| Edge proxy | Cloudflare Worker (music news RSS feeds) |
| Data | ESPN public API, YouTube Data API, Apple Music charts, SoundCloud and Spotify embeds |

---

## 📁 Project Structure

```
athlete-beats/
├── public/
├── src/
│   ├── components/   # AppLayout, UserSearch, FollowBar, Top8, VerifiedBadge, ...
│   ├── context/      # AuthContext, PlayerContext
│   ├── hooks/        # useFollow, usePlaylists, useProfile
│   ├── pages/        # Home, Trending, SportHub, Music, Profile, PublicProfile, Admin*
│   └── services/     # scores, news, hub, youtube, soundcloud, verifyEmail
├── docs/             # Terms, Privacy, Community Guidelines, Roadmap
├── cloudflare-music-worker.js   # reference copy of the deployed Worker
├── .env              # never committed
└── package.json
```

---

## 🚀 Getting Started

```bash
git clone https://github.com/bradnificent7/athlete-beats.git
cd athlete-beats
npm install
# create a .env file (below)
npm start
```

### Environment variables

Create `.env` at the project root:

```env
REACT_APP_FIREBASE_API_KEY=
REACT_APP_AUTH_DOMAIN=
REACT_APP_PROJECT_ID=
REACT_APP_STORAGE_BUCKET=
REACT_APP_MESSAGING_SENDER_ID=
REACT_APP_APP_ID=
REACT_APP_YOUTUBE_API_KEY=
```

> Variables starting with `REACT_APP_` are bundled into the browser build, so they are **not secret**. Real protection comes from API restrictions and Firestore rules (below).

---

## 🔒 Security

- **Firestore rules do the enforcing**, not the UI:
  - Only the owner can edit their profile, and fields like `followers`, `following`, `createdAt`, `verified`, `verifiedRole`, and `verifiedAt` can't be changed by users.
  - Following and reporting require a verified email or phone.
  - Reports use the ID `reporter_target`, so duplicates are impossible. Only admins can read or change them.
  - Usernames can be looked up one at a time but never listed or scraped.
  - Admins are an allowlist created by hand in the console. The client can't write to it.
- **API keys:** the YouTube key is restricted to the YouTube Data API and to my site's referrers. Unused third-party keys were removed.
- **Cloudflare Worker:** it only fetches a fixed list of feeds (never an arbitrary URL, so it can't be used as an open proxy), only answers my site's origins, and caches responses.
- **Lesson learned:** an early commit included a `.env` file. I removed it from tracking, fixed `.gitignore`, rotated the exposed keys, and deleted the old ones.

---

## 🗺 Roadmap

| Status | Item |
|--------|------|
| ✅ Done | Auth, profiles, usernames, search, following, Top 8 |
| ✅ Done | Email verification, reports, verified badges, admin tools |
| ✅ Done | Music player, playlists, SoundCloud import, genre music news and charts |
| ✅ Done | Multi-sport scoreboard, sport pages, news and standings |
| 📋 Next | Notifications, direct messages, Live and Chat pages |
| 📋 Planned | Firebase App Check, AI-assisted report triage, automated tests |
| 🔭 Future | Spotify account connection (limited by Spotify's developer-mode rules), mobile app / PWA |

---

## 📄 Legal

- [Terms of Service](./docs/TERMS_OF_SERVICE.md)
- [Privacy Policy](./docs/PRIVACY_POLICY.md)
- [Community Guidelines](./docs/COMMUNITY_GUIDELINES.md)

---

## 👤 Author

**Bradley Nguyen**
- GitHub: [@bradnificent7](https://github.com/bradnificent7)
- LinkedIn: linkedin.com/in/bradley-nguyen-27b51a1b6
- Portfolio: [bradley-portfolio.web.app](https://bradley-portfolio.web.app)

---

## ⚖️ License & Ownership

© 2026 Bradley Nguyen — All Rights Reserved. AthleteBeats is a proprietary project. See the Terms of Service for full legal terms.

Verification: AB-QZLPH3