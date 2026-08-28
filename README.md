# 🌟 AURA — AI Universal Web Accessibility & Privacy Assistant

> **Day 1, Day 2 & Day 3 Complete**: Manifest V3 Chrome Extension architecture, React + TypeScript Popup UI, Service Worker, Content Script, Shadow DOM Banner Overlay, In-Memory Privacy-First **Page Intelligence Analyzer**, and Live **In-Page Floating Assistant & Element Highlighter**.

---

## 🛠️ Tech Stack
- **Extension Platform**: Chrome Extension Manifest V3
- **Frontend Framework**: React 18
- **Language**: TypeScript (Strict mode)
- **Bundler & Build Tool**: Vite
- **Styling**: Tailwind CSS (Popup) + Scoped Shadow DOM CSS (In-Page Floating Assistant & Highlighting)
- **Icons**: Lucide React / Scoped SVG icons

---

## 📁 Project Structure

```text
AURA/
├── dist/                              # Generated production build (load this into Chrome)
│   ├── assets/                        # Bundled React JS & CSS chunks
│   ├── background/
│   │   └── serviceWorker.js           # Bundled MV3 Background Service Worker
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
│   ├── background/
│   │   └── serviceWorker.ts           # Background router (Test, Analyze, Highlight, Toggle)
│   ├── content/
│   │   ├── content.ts                 # Unified Shadow DOM host & message listeners
│   │   ├── elementRegistry.ts         # In-memory AURA Element Registry (WeakMap/Map)
│   │   ├── floatingAssistant.ts       # In-Page Assistant Panel, Category Tabs & selection
│   │   ├── highlighter.ts             # Smooth scroll, independent overlay & guidance tooltip
│   │   └── pageAnalyzer.ts            # Privacy-first DOM structure extractors & visibility filter
│   ├── popup/
│   │   ├── index.css                  # Tailwind & glow utility styles
│   │   ├── index.html                 # Popup HTML source template
│   │   ├── main.tsx                   # React mount root
│   │   └── Popup.tsx                  # React Popup (Page Intelligence + Connection Test)
│   └── types/
│       ├── messages.ts                # Discriminated union types for Chrome runtime messaging
│       └── page.ts                    # PageContext and element data models
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

1. **Zero Host DOM/CSS Mutation**: The highlight overlay and tooltip are rendered inside the isolated Shadow DOM using fixed viewport coordinates derived from `getBoundingClientRect()`. Target elements never receive custom inline styles or permanent classes.
2. **Zero Form Value Extraction**: The analyzer never reads `input.value`, `textarea.value`, selected values, passwords, or user-entered text. Password fields only log `type: "password"` metadata.
3. **Session Element Registry**: DOM elements are indexed in-memory using `WeakMap<Element, string>` and `Map<string, Element>`. No `data-aura-id` attributes are ever injected into the host DOM.

---

## ⚡ Communication Pipelines

### Pipeline 1: Live In-Page Highlighting (Day 3)
```text
[ Floating Assistant Panel / Popup ]
       │
       │  highlightElementById(targetId) / AURA_HIGHLIGHT_ELEMENT
       ▼
[ Element Registry ]
       │  - Resolves targetId ➔ DOM Element Reference
       ▼
[ Highlighter & Tooltip (highlighter.ts) ]
       │  1. element.scrollIntoView({ behavior: "smooth", block: "center" })
       │  2. Calculates getBoundingClientRect()
       │  3. Renders fixed bounding overlay & adaptive guidance tooltip
       │  4. Repositions on scroll/resize
       │  5. Cleans up automatically after 5 seconds
```

### Pipeline 2: Page Intelligence Analysis (Day 2)
```text
[ Popup UI ("Analyze Page") / Floating Assistant ("Analyze Page") ]
       │
       │  analyzePage() / AURA_ANALYZE_PAGE
       ▼
[ Content Script / pageAnalyzer.ts ]
       │  - Extracts metadata, headings (H1-H6), buttons, links, inputs, forms
       │  - Assigns stable session IDs (aura-button-001, etc.)
       │  - Returns PageContext
```

### Pipeline 3: Temporary Banner Overlay (Day 1)
```text
[ Popup UI ("Test Connection") ]
       │
       │  chrome.runtime.sendMessage({ action: 'AURA_TEST_CONNECTION' })
       ▼
[ Content Script / Shadow DOM Banner ]
       │  - Renders temporary notification: "✨ AURA is connected and ready!" (auto-dismiss 3s)
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
4. Open any webpage (e.g. `https://example.com` or `https://google.com`).
5. Notice the circular **AURA floating button** in the bottom-right corner of the page:
   - Click it to toggle the in-page **AURA Assistant Panel**.
   - Click **"Analyze Page"** to inspect buttons, links, inputs, and headings.
   - Click any item to smoothly scroll to and highlight it with an aura glow and guidance tooltip!
