# 🗺 AthleteBeats Roadmap

A running record of what's built, what each phase taught me, and what's next.

---

## ✅ Phase 1 — Foundation
**Built:** Email/password, Google, and phone (SMS) sign-in; protected routes; app layout with sidebar and top bar; deployment to Firebase Hosting.

**What I learned:** How Firebase Auth providers differ, how to gate routes behind a login, and how a build gets deployed.

## ✅ Phase 2 — Identity & discovery
**Built:** Unique @usernames, first/middle/last name profiles, people search by name or @username, public profile pages (`/u/<username>`).

**What I learned:** Firestore has no "unique" constraint, so usernames are claimed in a **transaction** that checks and writes in one step. Search uses prefix queries on lowercase fields, and the username lookup allows one exact name at a time so nobody can list all users.

## ✅ Phase 3 — Music
**Built:** YouTube search, a persistent mini player and bottom player bar, playlists with colors, SoundCloud links and playlist import, Spotify embeds, shuffle, and repeat (off / all / one).

**What I learned:** Running two playback engines (YouTube and SoundCloud) behind one queue, why refs are needed for "what plays next" logic, and how API quotas shape a feature (YouTube search is limited per day).

## ✅ Phase 4 — Trust & safety
**Built:** Email verification, a Report button with an admin review queue, verification requests with a proof code, admin-approved verified badges with an approval date, and password change plus forgot-password.

**What I learned:** The UI can't be trusted, so **Firestore rules do the enforcing**: users can't edit protected fields (`verified`, follower counts, and so on), reports use a `reporter_target` document ID so duplicates are impossible, and admins are an allowlist set by hand in the console.

## ✅ Phase 5 — Sports & news
**Built:** Multi-sport scoreboard (NBA, NFL, MLB, NHL, Soccer) with auto-refresh, NBA and NFL pages with headlines and standings, a Trending page with sports updates, and music news by genre with Apple top-100 charts.

**What I learned:** Browsers block cross-site requests (**CORS**), which broke several free news sources. The fix was a small **Cloudflare Worker** proxy that only fetches an allowlist of feeds and only answers my own site, so it can't be used as an open proxy.

## ✅ Phase 6 — Social graph
**Built:** Follow and unfollow with live counts, and a Top 8 on profiles.

**What I learned:** Counting subcollection documents instead of storing counters avoids numbers drifting out of sync, and it lets the rules stay strict.

## ✅ Security hygiene milestones
- Found a `.env` that had been committed early, removed it from tracking, fixed `.gitignore`, rotated the exposed keys, and deleted the old ones.
- Restricted the YouTube key to one API and to my site's referrers.
- Removed unused third-party keys instead of leaving them lying around.

---

## 📋 Next
- **Notifications** (the 🔔 icon): new followers, verification approved.
- **Direct messages** (the ✉️ icon) and the Chat page.
- **Live** page.
- **Firebase App Check** to stop other apps from calling my backend.
- **Automated tests**, including tests for the Firestore rules.

## 🔭 Later
- **AI-assisted report triage**, which needs a paid plan and API, so it waits.
- **Spotify account connection.** Spotify's 2026 developer-mode limits (Premium required, 5 users) make it a poor fit for a public app, so the current embeds stay for now.
- **Mobile app / PWA.**

## ⚠️ Known limitations
- YouTube search is limited to roughly 100 searches per day across all users.
- Music news depends on third-party publisher feeds, and a feed can break without notice.
- Genre charts come from an older Apple address and fall back to the overall chart when a genre chart isn't available.