# Learning Tracker

A modern learning dashboard for tracking YouTube courses, playlists, study progress, revisions, and learning goals.

**Live Demo:** https://yt-learntrack.vercel.app

---

## Overview

Learning Tracker helps students organize and complete long YouTube courses without losing track of progress.

Instead of jumping between playlists, notes, and bookmarks, everything is managed from a single dashboard.

Perfect for:

* DSA Preparation
* Web Development Courses
* AI & Machine Learning Playlists
* Interview Preparation
* Self-Paced Learning

---

## Features

### Course Management

* Create and organize learning courses
* Track overall course progress
* Favorite and pin important courses

### Playlist Tracking

* Create playlists manually
* Import complete YouTube playlists automatically
* Track playlist completion percentage
* Playback speed planning (1x – 2x)

### Video Progress Tracking

* Mark videos as completed
* Track watched duration
* Store notes for each video
* Watch videos directly on YouTube
* Video thumbnails and metadata support

### Revision System

* Revision counter for every video
* Track concepts that need multiple revisions
* Useful for DSA and interview preparation

### Progress Analytics

* Course progress tracking
* Playlist progress tracking
* Estimated remaining learning time
* Effective completion time based on playback speed

### User Experience

* Dark mode support
* Multiple themes
* Recently viewed courses
* Responsive design

---

## Tech Stack

### Frontend

* Next.js 16
* TypeScript
* Tailwind CSS

### Backend

* Supabase
* PostgreSQL
* Supabase Authentication

### External Services

* YouTube Data API v3

### Deployment

* Vercel

---

## Screenshots

Add screenshots here after deployment.

### Dashboard

![Dashboard(<img width="1686" height="922" alt="image" src="https://github.com/user-attachments/assets/f6b96bf5-3033-4c58-a7e4-ecf8f70874f2" />
)

### Course View

![Course View]()

### Playlist View

![Playlist View](<img width="1656" height="927" alt="image" src="https://github.com/user-attachments/assets/efec4957-d485-48a3-8001-5026244e9e3d" />
)

---

## Local Development

Clone the repository:

```bash
git clone https://github.com/Pranavkrjha/learning-tracker.git
cd learning-tracker
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Database Setup

Run the provided Supabase migrations:

```text
001_initial_schema.sql
002_course_enhancements.sql
003_learning_enhancements.sql
```

---

## Version

Current Release:

```text
v1.0.0
```

---

## License

MIT License

---

Built to make long YouTube learning journeys structured, trackable, and easier to complete.
