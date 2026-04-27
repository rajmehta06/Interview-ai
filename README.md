# ⚡ InterviewAI — Speak Better. Interview Smarter.

An AI-powered interview coaching web app built with **React + Vite** on the front-end and a lightweight **Express proxy** on the back-end. It uses the **Anthropic Claude API** to analyse voice answers, evaluate resumes, and match CVs against job descriptions.

\---

## ✨ Features

|Feature|Description|
|-|-|
|🎙️ **Voice Answer Analyzer**|Record your answer live (Web Speech API) or type it in. Get a score out of 10, filler-word count, estimated WPM, strengths, weaknesses, and a rewritten model answer.|
|📄 **Resume Analyzer**|Upload a PDF resume and receive an overall score, ATS compatibility rating, missing skills, format feedback, and concrete improvement suggestions.|
|🎯 **Resume vs JD Matcher**|Paste any job description alongside your PDF resume to see a match score (%), matched keywords, missing keywords, and tailored edits.|
|📈 **Performance Dashboard**|Tracks every voice session — question, score, and date — persisted in `localStorage` so data survives page refresh.|
|👁️ **Watch Demo**|An interactive six-slide walkthrough modal that explains each feature before the user signs up.|

\---

## 🚀 Getting Started

### Prerequisites

* **Node.js ≥ 18**
* An **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com/)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/rajmehta06/interview-ai.git
cd interview-ai

# 2. Install dependencies
npm install

# 3. Set up your environment variables
cp .env.example .env
# Open .env and paste your Anthropic API key
```

### Running in Development

```bash
npm run dev
```

This starts two processes concurrently:

* **Vite dev server** → [http://localhost:5173](http://localhost:5173) (React front-end)
* **Express proxy** → [http://localhost:3001](http://localhost:3001) (API key lives here)

Vite automatically forwards all `/api/\*` requests to Express so your API key is **never** exposed in the browser.

### Building for Production

```bash
npm run build   # Compiles React into dist/
npm start       # Runs Express, which serves dist/ + the /api routes
```

Open [http://localhost:3001](http://localhost:3001).

\---

## 🗂️ Project Structure

```
interview-ai/
├── src/
│   ├── App.jsx          # All React components (single-file architecture)
│   └── main.jsx         # React entry point
├── server/
│   └── index.js         # Express proxy — holds the Anthropic API key
├── public/              # Static assets (if any)
├── index.html           # Vite HTML template
├── vite.config.js       # Vite config with /api proxy
├── package.json
├── .env.example         # ← Copy to .env and add your key
├── .gitignore           # .env and node\_modules excluded
└── README.md
```

\---

## 🔐 API Key Security

The Anthropic API key is stored **only in `.env`** on the server. The React front-end never sees it:

```
Browser  →  POST /api/claude  →  Express (adds x-api-key header)  →  api.anthropic.com
```

`.env` is listed in `.gitignore` and will never be committed. The `.env.example` file is committed as a safe template.

\---

## 🐛 Bug Fixes (vs. original single-file version)

|#|Bug|Fix|
|-|-|-|
|1|`VoiceEvalTool` didn't destructure `onResult` prop → sessions never saved to dashboard|Added `onResult` to props and called it after successful analysis|
|2|`useCallback` imported but unused → ESLint warning|Removed from import|
|3|2-column result grids broke on mobile|Changed `minmax(1fr, 1fr)` → `minmax(240px, 1fr)` so grids collapse on small screens|
|4|User profile + sessions reset on page refresh|Persisted both in `localStorage` with `useEffect` sync|
|5|"Watch Demo" button triggered the onboarding modal|Replaced with a dedicated `DemoModal` component (6-slide feature walkthrough)|
|6|API key sent directly from browser|Moved all Claude calls through the Express `/api/claude` and `/api/claude-doc` proxy endpoints|

\---

## ⚠️ Disclaimer

The landing page statistics ("10K+ Users Coached", "94% Interview Success Rate") are **illustrative placeholder numbers** included for visual design purposes. This is a portfolio / demo project.

\---

## 🛠️ Tech Stack

* **React 18** + **Vite 5**
* **Express 4** (proxy server)
* **Anthropic Claude** (`claude-sonnet-4-20250514`)
* **Web Speech API** (browser-native, no third-party STT)
* **localStorage** (session persistence)

\---

## 📄 License

MIT — feel free to fork, adapt, and build on this.

