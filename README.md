
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![AI Powered](https://img.shields.io/badge/AI-Gemini-8E75B2?logo=googlegemini&logoColor=white)
![License](https://img.shields.io/badge/License-Not%20Specified-lightgrey)

# MindForge — AI Learning & Accountability Ecosystem

MindForge is a full-stack, track-isolated learning and accountability platform built for **JEE**, **NEET**, and **UPSC** aspirants. It combines a 3D interactive Field Library pre-opening showcase with a time-adaptive study workspace, verified YouTube educator classrooms, live Wikipedia & OpenAlex research ingestion, Socratic AI tutoring, interactive physics/biology/economics simulations, and a guardian-linked 70% refundable completion deposit ledger.

---

## Table of Contents

- [Key Capabilities](#key-capabilities)
- [Tech Stack](#tech-stack)
- [Project Structure & Required Files](#project-structure--required-files)
- [Environment Configuration](#environment-configuration)
- [Installation & Running Locally](#installation--running-locally)
- [Backend API Reference](#backend-api-reference)
- [Frontend Modules & Track Isolation](#frontend-modules--track-isolation)
- [Design System & Theme Tokens](#design-system--theme-tokens)
- [Build, Type-Check & Deployment](#build-type-check--deployment)
- [Architectural & Technical Notes](#architectural--technical-notes)

---
## 📸 MindForge Application Screenshots

![Screenshot 1](screenshots/Screenshot%202026-11-14%20062920.png)

![Screenshot 2](screenshots/Screenshot%202026-11-14%20063023.png)

![Screenshot 3](screenshots/Screenshot%202026-11-14%20063042.png)

![Screenshot 4](screenshots/Screenshot%202026-11-14%20063118.png)

![Screenshot 5](screenshots/Screenshot%202026-11-14%20063153.png)

![Screenshot 6](screenshots/Screenshot%202026-11-14%20063209.png)

![Screenshot 7](screenshots/Screenshot%202026-11-14%20063225.png)

![Screenshot 8](screenshots/Screenshot%202026-11-14%20063242.png)

![Screenshot 9](screenshots/Screenshot%202026-11-14%20063259.png)
## Key Capabilities

### Pre-Opening Interactive Field Library
- Powered by `<BestsellersBookShowcase />` (`@designcodeio/threeui`) and `/public/landing-pages/bestsellers-book-showcase.html`.
- Three interactive 3D books representing **JEE** (*Main & Advanced*), **NEET** (*Medical · NCERT Mastery*), and **UPSC** (*Civil Services · IAS / IPS*).
- Clicking **Enter MindForge →** (or opening a book and choosing **Enter MindForge →**, **20m Lectures**, or **Recall Lab**) transitions into the main React workspace with the chosen track and section pre-selected via `postMessage` and `enter-mindforge` custom events.

### Core Learning Workspace (`JEE` · `NEET` · `UPSC`)
All study data—schedules, subtopic checklists, flashcards, 5-minute quizzes, spaced repetition queues, blurting prompts, AI tutor greetings, handwritten answer prompts, and trap puzzles—is strictly isolated per exam track (`jee`, `neet`, `upsc`).

1. **Study Hub** (`StudyHub.tsx`)
   - **Time-Adaptive Study Scheduler**: Generates realistic study sequences strictly bounded within the user's available window (10–240 min) with every micro-lecture capped at `<= 20 min`.
   - **Track-Specific Subtopic Checklist**: Completing a subtopic automatically generates targeted flashcards, a 5-minute quiz pack, and a 1-day spaced repetition entry.
   - **YouTube & Link-to-Notes Extractor**: Paste any YouTube video URL (using YouTube oEmbed + page metadata + Gemini AI) or article/transcript text to extract short notes, definitions, formulas, exam takeaways, and flashcards—exportable as `mindforge-youtube-notes.txt`.
   - **High-Yield Track Syllabus & Acoustic Focus DSP**: Interactive syllabus tracker with XP rewards and a client-side Web Audio API synthesizer (**Brown Noise** + **40Hz Alpha Binaural Hum** + volume control).
2. **Lectures & Board** (`LectureStudio.tsx` & `EducatorClassroom.tsx`)
   - **Real Educator Classroom & Whiteboard**: Embedded verified educator sessions for JEE, NEET, and UPSC with clickable chapter timestamps, personal pinned notes (`localStorage`), and a live HTML5 `<canvas>` Study Whiteboard (Freehand Pen, Line, Arrow, Text, Eraser, Undo, Clear, and PNG export as `MindForge_<TRACK>_Whiteboard.png`).
   - **20-Min Micro-Lecture & WHY Engine**: Concept explanations across *Beginner*, *Intermediate*, and *Exam-Ready* tiers with timestamped highlights, ask-AI doubt solver, and downloadable study sheets.
3. **Knowledge Vault** (`KnowledgeVault.tsx`)
   - **Wikipedia REST & OpenSearch + OpenAlex (250M+ Works)**: Live queryable encyclopedic summaries and peer-reviewed papers with 1-click conversion into track-scoped flashcards.
   - **Omni-Platform Launcher & Curated Portals**: 25 curated learning and research platforms filterable by category.
4. **Recall & Lab** (`RecallAndLab.tsx` & `ExamSimAndPyq.tsx`)
   - **Active Recall Flashcards & 5-Min Concept Quiz**
   - **PYQ ELO & Rank Lab**:
     - *JEE*: Interactive p-n Junction / Zener Breakdown & Projectile simulator + NTA Percentile / AIR Predictor.
     - *NEET*: Live animated ECG P-QRS-T canvas + Cardiac Output / Oxygen-Haemoglobin Bohr shift lab + 720-mark MBBS AIR Predictor.
     - *UPSC*: RBI Monetary Policy (Repo/CRR/CPI) simulator + Prelims GS-I (+2.0 / -0.66) Cutoff Simulator.
     - Ranked Past-Year Question (PYQ) ELO Arena.
   - **Spaced Repetition Engine**: Adaptive `1-Day → 3-Day → 7-Day → 14-Day` interval progression.
   - **Sunday Blurting Method**: Zero-hint closed-book recall evaluation via Gemini AI.
   - **Socratic AI Tutor & Handwritten Answer Grader**: Guides students with questions rather than immediate spoilers, plus multimodal image upload grading (`image/*` + typed work).
   - **What-If & 3D Lab + Common Trap Simulator**: Interactive 3D Silicon crystal lattice canvas (Intrinsic / N-type / P-type) and step-by-step error-spotting puzzles.
5. **Arena & Squads** (`ArenaAndSquads.tsx`)
   - RPG Skill Trees, Study Squads, Blitz Duels, Boss Battles, Study With Me rooms, and peer community feeds.
6. **Deposit & Family Accountability** (`DepositAndAccountability.tsx`)
   - Role views for **Student**, **Parent**, and **Mentor**.
   - Transparent **70% Refundable Completion Deposit / 30% Platform Fee** breakdown, eligibility verification checklist, guardian-authorized bank/UPI payout workflow (`MFG-ESCROW-*`), real-time guardian study session notifications, and printable QR-verified Digital Completion Certificates (`MFG-CERT-2026-8492`).

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), `lucide-react`, `motion`, `@designcodeio/threeui`, HTML5 Canvas, Web Audio API |
| **Backend** | Node.js, Express 4 (`server.ts`), `@google/genai` (`gemini-4-hydrogen`), `dotenv`, `tsx` |
| **External Data APIs** | Gemini API (`/api/ai/*`), Wikipedia REST & OpenSearch API, OpenAlex Works API, YouTube oEmbed API |

---

## Project Structure & Required Files

```text
.
├── .env.example                          # Template for GEMINI_API_KEY and APP_URL
├── .gitignore                            # Git ignore rules (node_modules, dist, .env)
├── index.html                            # SPA HTML entry, fonts (Source Serif 4, JetBrains Mono) & OG meta
├── metadata.json                         # Applet manifest & capabilities metadata
├── package.json                          # Dependencies & npm scripts (dev, build, start, lint)
├── tsconfig.json                         # TypeScript compiler options (ES2022, bundler resolution)
├── vite.config.ts                        # Vite + React + Tailwind v4 configuration
├── server.ts                             # Express backend API + Vite dev middleware / static dist server
│
├── public/                               # Static assets served directly by Express/Vite
│   ├── assets/                           # Uploaded/static media assets
│   ├── buttons/
│   │   └── marcus-book-a-shoot.html      # Independent "Enter MindForge" button document
│   └── landing-pages/
│       ├── bestsellers-book-showcase.html # Pre-opening interactive 3D JEE/NEET/UPSC Field Manuals
│       └── week-2026-11-03/
│           └── c940764593d0fe5d596be327ca755885.woff2 # Required font binary for ThreeUI button
│
└── src/                                  # Frontend React + TypeScript application
    ├── main.tsx                          # React 19 root mount
    ├── App.tsx                           # App shell, pre-opening Scene, track/role/section routing & state
    ├── index.css                         # Global Tailwind v4 import & display/serif typography classes
    ├── assets/images/                    # Local mentor & lecture thumbnail assets
    ├── types/
    │   └── mindforge.ts                  # Shared TypeScript interfaces (ExamTrack, Flashcard, Deposit, etc.)
    ├── utils/
    │   └── focusAudio.ts                 # Web Audio API DSP synth (Brown Noise & 40Hz Alpha Binaural)
    ├── data/
    │   ├── curriculum.ts                 # Lecture catalog, arena data, initial notes, ledger & notifications
    │   ├── ecosystem.ts                  # Track metadata, educator lecture playlists, 25 learning platforms
    │   └── trackMaterials.ts             # Strictly isolated JEE, NEET, and UPSC materials & trap puzzles
    ├── shaders/
    │   ├── threeui.css                   # Shared ThreeUI stylesheet
    │   └── aura-weekly-november-2026/
    │       ├── AuraWeeklyDocument.tsx    # Responsive iframe wrapper for ThreeUI documents
    │       └── MarcusBookAShoot.tsx      # "Enter MindForge" ThreeUI component wrapper
    └── components/
        ├── StudyHub.tsx                  # Time-adaptive scheduler, YouTube Link-to-Notes, checklist & DSP
        ├── LectureStudio.tsx             # Sub-mode switcher: Educator Classroom vs 20m WHY Micro-Lectures
        ├── EducatorClassroom.tsx         # Verified YouTube player, timestamps, Canvas Whiteboard & AI doubt drawer
        ├── KnowledgeVault.tsx            # Wikipedia REST + OpenAlex search, 1-click flashcards & 25 portals
        ├── RecallAndLab.tsx              # Flashcards, Quiz, Spaced Rep, Blurting, Socratic AI, Grader & 3D Lab
        ├── ExamSimAndPyq.tsx             # JEE/NEET/UPSC interactive labs, Rank Predictors & PYQ ELO Arena
        ├── ArenaAndSquads.tsx            # Skill trees, Study Squads, Blitz Duels, Boss Battles & Study With Me
        └── DepositAndAccountability.tsx  # 70% Escrow ledger, Guardian notifications, Mentor grading & Certs
```

---

## Environment Configuration

Copy `.env.example` to `.env` for local development (never commit secrets):

```bash
cp .env.example .env
```

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key used server-side by `server.ts` (`@google/genai`). If omitted or set to `MY_GEMINI_API_KEY`, all `/api/ai/*` endpoints gracefully fall back to deterministic demo responses so the UI remains fully functional offline or in demos. |
| `APP_URL` | Optional | Public URL where the service is hosted. |
| `PORT` | Optional | HTTP port for Express/Vite (defaults to `3000`). |
| `NODE_ENV` | Optional | Set to `production` when running `npm start` to serve the compiled `dist/` bundle instead of Vite dev middleware. |

---

## Installation & Running Locally

**Prerequisites:** Node.js `>= 20` and `npm` (or `bun`).

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the full-stack development server** (Express API + Vite middleware on port `3000`)
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Run TypeScript validation**
   ```bash
   npm run lint
   ```

---

## Backend API Reference (`server.ts`)

All AI calls and accountability workflows are proxied through Express (`server.ts`) so API keys never reach client bundles.

| Method & Endpoint | Purpose | Request Body Highlights | Response Highlights |
| --- | --- | --- | --- |
| `POST /api/ai/schedule` | Generates a study schedule bounded `<= minutes` with lectures `<= 20 min` | `{ minutes, topic, weakAreas }` | `{ blocks: ScheduleBlock[], source }` |
| `POST /api/ai/subtopic-pack` | Generates 3 flashcards & 2 MCQs when a subtopic is completed | `{ subtopicTitle, topicTitle, level }` | `{ flashcards, quiz, source }` |
| `POST /api/ai/blurting-eval` | Evaluates closed-book Sunday Blurting writeups | `{ topicHeading, studentText, expectedConcepts }` | `{ evaluation: BlurtingEvaluation, source }` |
| `POST /api/ai/tutor` | Socratic AI Tutor, 24/7 Assistant, or Lecture Timestamp solver | `{ mode: 'socratic' \| 'direct' \| 'lecture', message, context }` | `{ reply, source }` |
| `POST /api/ai/link-to-notes` | Extracts notes & flashcards from YouTube URLs (via oEmbed + metadata) or article/pasted text | `{ url, pastedTranscript }` | `{ notes, videoMeta?, source }` |
| `POST /api/ai/grade-answer` | Grades typed responses or handwritten notebook images (`base64`) | `{ question, studentAnswer, imageBase64, mimeType }` | `{ result: { score, accuracy, missingSteps, mentorFeedback }, source }` |
| `POST /api/sessions/start` | Logs session start & creates a guardian notification | `{ plannedMinutes, topicTitle }` | `{ event, expectedEndLabel }` |
| `POST /api/sessions/end` | Logs normal completion or voluntary early exit to guardian feed | `{ plannedMinutes, actualMinutes, voluntaryEarlyExit, topicTitle }` | `{ event }` |
| `POST /api/deposits/payout` | Validates guardian authorization & initiates 70% escrow refund | `{ courseId, upiOrBankMasked, amountInr, guardianAuthorized }` | `{ status: 'transferred', transactionId, expectedProcessing, record }` |

---

## Frontend Modules & Track Isolation

- **Per-Track State (`src/App.tsx` + `src/data/trackMaterials.ts`)**:
  - `scheduleByTrack`, `subtopicsByTrack`, `flashcardsByTrack`, `quizByTrack`, and `revisionsByTrack` keep JEE, NEET, and UPSC progress strictly independent.
  - Switching tracks in the top workspace toolbar or selecting a book on the pre-opening screen automatically updates every downstream tool, simulator, and prompt.
- **Persistence**:
  - Track selection, XP, ELO, syllabus completion, and educator notes persist in `localStorage` under `mindforge_eic_*` keys.
  - Server-side session events and payout records are maintained in `serverState` inside `server.ts` during runtime.

---

## Design System & Theme Tokens

MindForge uses the **Field Manuals Editorial** palette across both Espresso Dark and Paper Light modes:

- **Espresso Dark**: Canvas `#29251d`, elevated card `#211e18`, inset `#1d1a15`, primary text `#eee2ca`, secondary text `#c5b79e`, warm gold accent `#c3a47b`.
- **Paper Light**: Canvas `#f4ecd8`, elevated card `#fbf6ea`, ink `#29251d`, secondary text `#5e5240`, bronze accent `#8b673c`, borders `#dccfb4`.
- **Semantic Accents**: Sage (`#5f684f` / `#89946f`) for verified mastery & completion; Terracotta (`#945a3e` / `#d98c6e`) for early-exit alerts, traps, and due items.
- **Typography**: `Source Serif 4` / `Iowan Old Style` for editorial display and body, `JetBrains Mono` with `tabular-nums` for timers, ELO, percentages, and financial ledgers.

---

## Build, Type-Check & Deployment

1. **Type-check & build the frontend bundle into `dist/`**
   ```bash
   npm run lint
   npm run build
   ```

2. **Run in production mode**
   ```bash
   NODE_ENV=production npm start
   ```
   In production mode (`NODE_ENV=production`), `server.ts` serves static assets from `dist/` and routes all `/api/*` requests through Express on `0.0.0.0:$PORT` (default `3000`).

---

## Architectural & Technical Notes

1. **Focus Mode & Device Monitoring**: Because web applications run inside browser sandboxes, MindForge uses the `visibilitychange` API (`tabInterruptions`) to log tab switches honestly during Focus Mode rather than claiming OS-level app blocking (which requires native mobile permissions).
2. **Escrow Deposit Workflow**: The 70% completion deposit ledger separates the refundable deposit (`₹700`) from the platform fee (`₹300`), enforces guardian authorization for under-18 compliance, and executes an explicit payout endpoint (`/api/deposits/payout`) returning a verifiable transaction reference (`MFG-ESCROW-*`).
3. **Healthy Gamification**: Streak counters, XP, ELO, and micro-lecture caps (`<= 20 min`) are structured around cognitive retrieval intervals and rest breaks to reward deep mastery rather than passive screen time.
