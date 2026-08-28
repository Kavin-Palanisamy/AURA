# 🌟 AURA — AI Universal Web Accessibility & Privacy Assistant

> **Day 1, Day 2, Day 3 & Day 4 Complete**: Manifest V3 Chrome Extension architecture, React + TypeScript Popup UI, Service Worker, Content Script, Shadow DOM Banner Overlay, Privacy-First **Page Intelligence Analyzer**, Live **In-Page Floating Assistant**, **Element Highlighting with Guidance Tooltips**, and **Google Gemini AI Navigation Intelligence**.

---

## 🛠️ Tech Stack
- **Extension Platform**: Chrome Extension Manifest V3
- **Frontend Framework**: React 18
- **Language**: TypeScript (Strict mode)
- **Bundler & Build Tool**: Vite
- **AI Engine**: Google Gemini REST API (`gemini-2.5-flash` default, `gemini-2.5-flash-lite`, `gemini-2.5-pro`)
- **Styling**: Tailwind CSS (Popup) + Scoped Shadow DOM CSS (In-Page Floating Assistant, AI Chat & Highlighting)
- **Icons**: Lucide React / Scoped SVG icons

---

## 📁 Project Structure

```text
AURA/
├── dist/                              # Generated production build (load this into Chrome)
│   ├── assets/                        # Bundled React JS & CSS chunks
│   ├── background/
│   │   └── serviceWorker.js           # Bundled MV3 Background Service Worker & AI Router
│   ├── content/
│   │   └── content.js                 # Bundled Self-Contained Content Script
│   ├── icons/                         # Extension icons (16, 32, 48, 128)
│   ├── src/
│   │   └── popup/
│   │       └── index.html             # React Popup entry HTML
│   └── manifest.json                  # Manifest V3 configuration
├── public/
│   └── icons/                         # High-res extension icons
├── scripts/
│   ├── generate-icons.js              # Icon generator script
│   └── test-analyzer.js               # Analyzer validation script
├── src/
│   ├── ai/
│   │   ├── geminiProvider.ts          # Google Gemini REST API provider
│   │   ├── promptBuilder.ts           # System prompt & structured user context builder
│   │   ├── provider.ts                # AI Provider registry & sanitizePageContextForAI()
│   │   ├── responseValidator.ts       # Untrusted JSON validator & targetId verification
│   │   └── types.ts                   # SanitizedPageContext & AuraAIResponse types
│   ├── background/
│   │   └── serviceWorker.ts           # Background router (Test, Analyze, Highlight, Toggle, Ask AI)
│   ├── content/
│   │   ├── content.ts                 # Unified Shadow DOM host & message listeners
│   │   ├── elementRegistry.ts         # In-memory AURA Element Registry (WeakMap/Map)
│   │   ├── floatingAssistant.ts       # In-Page Assistant Panel (Ask AI + Page Elements views)
│   │   ├── highlighter.ts             # Smooth scroll, independent overlay & guidance tooltip
│   │   └── pageAnalyzer.ts            # Privacy-first DOM structure extractors & visibility filter
│   ├── popup/
│   │   ├── index.css                  # Tailwind & glow utility styles
│   │   ├── index.html                 # Popup HTML source template
│   │   ├── main.tsx                   # React mount root
│   │   └── Popup.tsx                  # React Popup (Analysis + Connection Test + AI Settings)
│   └── types/
│       ├── messages.ts                # Discriminated union types for Chrome runtime messaging
│       └── page.ts                    # PageContext and element data models
├── .env.example                       # Environment variables template
├── manifest.json                      # Manifest V3 specification
├── package.json                       # Dependencies and npm scripts
├── postcss.config.js                  # PostCSS configuration
├── tailwind.config.js                 # Tailwind theme configuration
├── tsconfig.json                      # TypeScript compiler settings
├── vite.config.ts                     # Multi-entry Vite bundler configuration
└── README.md                          # Documentation & setup guide
```

---

## 🛡️ Privacy & Safety Guarantees

1. **Zero User Form Value Extraction**: Strictly ignores `input.value`, `textarea.value`, selected values, passwords, and user-entered content. Password fields only log `type: "password"` metadata.
2. **Explicit AI Sanitization Layer (`sanitizePageContextForAI`)**: Converts in-memory `PageContext` into a clean, minimized `SanitizedPageContext`. Under no circumstances are raw HTML, DOM nodes, cookies, or auth tokens transmitted to the AI.
3. **Untrusted AI Response Validation**: All AI responses are strictly validated against a structured JSON schema. Any hallucinated or non-existent element IDs are immediately rejected, preventing invalid highlights or arbitrary execution.
4. **Secure Local API Key Storage**: The Gemini API key is stored strictly within browser `chrome.storage.local`. It is never logged, never exposed to webpage scripts, and never sent to external servers other than the official Google Gemini API endpoint.
5. **Zero Host DOM/CSS Mutation**: The highlight overlay and guidance tooltip are rendered inside the isolated Shadow DOM at fixed viewport coordinates derived from `getBoundingClientRect()`. Target elements never receive custom inline styles or permanent classes.

---

## ⚡ Communication Pipelines

### Pipeline 1: AI Q&A & Navigation (Day 4)
```text
[ Floating Assistant ("Ask AI") ]
       │
       │  1. In-memory page analysis: analyzePage()
       │  2. Privacy sanitization: sanitizePageContextForAI(context)
       ▼
[ Background Service Worker ]
       │  3. Retrieves Gemini API Key from chrome.storage.local
       │  4. GeminiProvider.ask() via Google Gemini REST API
       ▼
[ Response Validator (responseValidator.ts) ]
       │  5. Validates JSON schema & verifies targetId in validElementIds
       ▼
[ Floating Assistant ]
       │  6. Renders AI response & "Show me" action button
       ▼
[ User clicks "Show me" ]
       │  7. Invokes existing highlightElementById(targetId)
       ▼
[ Webpage Overlay (Smooth scroll, glowing aura box, guidance tooltip) ]
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Extension
```bash
npm run build
```

### 3. Load into Google Chrome
1. Open Google Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select the **`dist`** folder (`c:\Users\kavin\Documents\AURA\dist`).
4. Click the **AURA** extension icon in the toolbar, switch to the **AI Settings** tab, and enter your Google Gemini API Key.
5. Open any normal webpage (e.g. `https://example.com` or `https://google.com`).
6. Click the circular **AURA floating button** in the bottom-right corner:
   - Type any question in the **Ask AI** tab (e.g. *"Where can I log in?"*, *"Find the search button"*, *"What is this page about?"*).
   - AURA analyzes the page in memory, consults Gemini safely, and provides a clear answer with a **"Show me"** button.
   - Click **"Show me"** to smoothly scroll to and highlight the element!
