# 🌟 AURA — AI Universal Web Accessibility & Privacy Assistant

> **Understand. Navigate. Protect.**
>
> A privacy-first, in-browser AI assistant engineered for Chrome Manifest V3. AURA empowers users to comprehend complex web interfaces, locate interactive elements with glowing directional highlights, and receive contextual AI guidance without ever exposing private form data, credentials, or raw HTML.

---

## 📖 Overview & Problem Statement

Modern web interfaces are increasingly complex, crowded, and dynamic. Navigating multifaceted portals (e.g., healthcare dashboards, enterprise consoles, e-commerce checkouts) presents significant hurdles:
- **Accessibility Barriers**: Users with cognitive, visual, or situational impairments struggle to locate specific actions among dozens of buttons and inputs.
- **Privacy Risks in Cloud AI**: Standard web assistants and browser extensions scrape entire DOM trees, capturing sensitive personal identifiers, passwords, and form entries before transmitting them to cloud AI APIs.

**AURA solves both problems** through a **Privacy-by-Design** architecture:
1. **Local Page Intelligence**: Analyzes webpage semantics in memory with **zero DOM mutations** (`no data-aura-id` attributes) and **zero extraction of form input values**.
2. **Local Privacy Shield**: Scans structured metadata entirely inside the browser using local regex pattern matchers and the **Luhn algorithm (Mod 10)** to redact emails, phone numbers, credit card numbers, Aadhaar-like IDs, and API keys before transmission.
3. **In-Page Spatial Guidance**: An isolated Shadow DOM floating assistant that answers questions and visually guides users to relevant page elements with glowing highlights and adaptive tooltips.

---

## 📸 Screenshots & Interface Tour

<!-- Screenshot 1: Main AURA Popup -->
### 1. Main AURA Popup & Theme System
![AURA Popup Main Interface](public/icons/icon-128.png)
*Figure 1: React + Tailwind popup featuring 4-tab navigation (Analyze, Privacy, Settings, Test), live webpage connection status, environment AI status badge, and instant Light/Dark mode switcher.*

<!-- Screenshot 2: Page Analysis -->
### 2. Privacy-Safe Page Intelligence
*Figure 2: 5-metric structure breakdown (Headings, Buttons, Links, Inputs, Forms) extracted purely in-memory via the AURA Element Registry.*

<!-- Screenshot 3: Privacy Shield Scan -->
### 3. Local Privacy Shield Dashboard
*Figure 3: On-demand privacy scanner displaying category metrics (Emails, Phones, Luhn Cards, Aadhaar-like, API Keys, Tokens) and human-friendly location badges.*

<!-- Screenshot 4: Floating AI Assistant -->
### 4. In-Page Floating Assistant
*Figure 4: Glassmorphic side panel with dual views ("Ask AI" conversational guidance and "Page Elements" category filter tabs).*

<!-- Screenshot 5: Element Highlighting -->
### 5. Glowing Element Highlighting & Guidance Tooltip
*Figure 5: Smooth scrolling bounding-box highlight with cyan/purple pulse animation and adaptive 5-second guidance tooltip.*

---

## 🏗️ Architecture & Data Pipeline

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CURRENT WEBPAGE                                  │
│  - User interacts with live webpage or opens AURA in-page panel             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ 1. In-memory DOM extraction
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AURA ELEMENT REGISTRY (Day 2)                         │
│  - WeakMap<Element, string> & Map<string, Element>                          │
│  - In-memory mapping: aura-button-001 <-> DOM Reference                     │
│  - ZERO DOM mutations (no data-aura-id attributes injected)                 │
│  - ZERO extraction of input.value, textarea.value, or passwords             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ 2. Sanitization
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     AI SANITIZER (sanitizePageContextForAI)                 │
│  - Strips DOM references and extracts clean validElementIds                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ 3. Local Privacy Firewall
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PRIVACY SHIELD ENGINE (Day 5)                           │
│  ├── scanner.ts: Local Regex + Luhn Checksum Algorithm (Cards)              │
│  ├── redactor.ts: In-place text redaction ([EMAIL_REDACTED], etc.)          │
│  └── Immutability: Deep structured clone ensures source context is untouched│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ 4. Protected Metadata Only
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ENVIRONMENT & BACKGROUND SERVICE WORKER                 │
│  - Loads API Key from local build environment (src/config/env.ts)           │
│  - Dispatches protected, redacted context to Google Gemini REST API         │
│  - Models: gemini-2.5-flash (default) -> gemini-2.5-flash-lite -> 2.5-pro   │
│  - Dynamic Account Model Auto-Discovery via /v1beta/models API             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ 5. Structured JSON Output
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     RESPONSE VALIDATOR & ANTI-HALLUCINATION                 │
│  - Validates schema and checks candidate targetId in validElementIds        │
│  - Demotes hallucinated element IDs to text-only answer mode                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ 6. User Guidance
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  SHADOW DOM FLOATING ASSISTANT & HIGHLIGHTER                │
│  - Privacy Transparency Pill: "🛡️ Privacy Shield active • X item(s) redacted"│
│  - "Show me" action button smoothly scrolls and illuminates element         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

- **Platform**: Chrome Extension Manifest V3
- **Frontend UI**: React 18, TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Popup) + Scoped Shadow DOM CSS (Floating Assistant & Highlighting)
- **Bundler & Build Tool**: Vite (Multi-entry single-bundle packaging with environment variable support)
- **AI Provider**: Google Gemini REST API (`gemini-2.5-flash` default, `gemini-2.5-flash-lite`, `gemini-2.5-pro` with dynamic account model discovery)
- **Privacy Engine**: Local regex pattern matchers + Luhn algorithm checksum validator (100% in-extension)
- **Icons**: Lucide React & Scoped SVG vector icons

---

## 🔑 Gemini AI Configuration

AURA loads the Google Gemini API key from a local environment variable during build time. Users do **not** need to paste or store API keys in the extension UI.

### Step 1: Create `.env.local`
In the root directory of the project, create a file named `.env.local` (this file is ignored by Git):

```env
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

> **IMPORTANT**:
> - Never commit `.env.local` to Git. `.gitignore` is pre-configured to ignore all `.env*` files except `.env.example`.
> - Changing or adding an API key requires rebuilding the extension (`npm run build`) and reloading the unpacked extension in Chrome.

---

## 🚀 Installation & Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- Google Chrome (or Chromium-based browser)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Kavin-Palanisamy/AURA.git
cd AURA
npm install
```

### 2. Configure Environment
```bash
# Copy template and add your Gemini API key
cp .env.example .env.local
```
Edit `.env.local` and set `VITE_GEMINI_API_KEY=your_key`.

### 3. Build the Extension
```bash
# Type check TypeScript codebase
npm run type-check

# Package production build to dist/
npm run build
```

### 4. Load into Google Chrome
1. Open Chrome and navigate to `chrome://extensions`.
2. Enable the **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the `AURA/dist` directory.
5. Click the **AURA** extension icon in your Chrome extensions bar!

---

## 🔒 Security & Privacy Considerations

| Principle | Technical Implementation & Notes |
| :--- | :--- |
| **Local Environment Variables** | `.env.local` prevents accidentally committing sensitive API keys to source control repositories. |
| **Client-Side Build Notice** | In client-side extensions, environment variables prefixed with `VITE_` are embedded into the compiled JavaScript bundle (`dist/`). Therefore, apply appropriate API key restrictions (e.g. IP, domain, or quota caps) in Google AI Studio or Google Cloud Console. |
| **Production Architecture Recommendation** | For enterprise or multi-tenant deployments, route requests through a secure backend proxy or use OAuth authentication rather than distributing build-embedded keys. |
| **Zero Form Value Inspection** | `pageAnalyzer.ts` strictly queries element metadata (tag name, `type`, `label`, `placeholder`, `aria-label`). `input.value` and `textarea.value` are **never read or stored**. |
| **Zero Permanent DOM Mutations** | Uses `WeakMap<Element, string>` and `Map<string, Element>` in memory. No `data-aura-id` attributes are written to host page elements. |
| **Local Privacy Scanning** | 100% of pattern detection, Luhn card validation, and redactions occur locally inside the browser before any network dispatch. |

---

## 🔑 Permissions Breakdown

AURA adheres strictly to the **Principle of Least Privilege**:

- `activeTab`: Grants temporary access to inspect the currently active tab when the user explicitly triggers AURA.
- `storage`: Persists non-sensitive UI preferences (Dark/Light theme, model preference) inside `chrome.storage.local`.
- `scripting`: Executes content script initialization across standard web domains.

---

## 🧪 Testing & Verification

AURA includes automated test suites covering all architectural layers:

```bash
# Run Master Regression & Integration Suite (Days 1 - 6 + Env Config + E2E)
npx tsx scripts/verify-final.ts

# Run AI Intelligence Verification Suite (Day 4)
npx tsx scripts/verify-day4.ts

# Run Privacy Shield Verification Suite (Day 5)
npx tsx scripts/verify-day5.ts
```

For manual testing, refer to the [Manual QA Testing Guide](docs/TESTING.md) containing an 18-point verification checklist.

---

## 📁 Repository Structure

```text
AURA/
├── dist/                              # Generated production build (load unpacked into Chrome)
│   ├── assets/                        # Bundled React JS & CSS assets
│   ├── background/
│   │   └── serviceWorker.js           # MV3 Service Worker & AI Message Router
│   ├── content/
│   │   └── content.js                 # Self-contained Shadow DOM Content Script (0 ESM imports)
│   ├── icons/                         # Extension icons (16, 32, 48, 128)
│   ├── src/popup/index.html           # Popup HTML entry
│   └── manifest.json                  # Extension manifest V3
├── docs/
│   └── TESTING.md                     # 18-point manual QA testing guide
├── public/
│   └── icons/                         # Source icon assets
├── scripts/
│   ├── generate-icons.js              # Icon generator script
│   ├── verify-day4.ts                 # AI Intelligence test suite
│   ├── verify-day5.ts                 # Privacy Shield test suite
│   └── verify-final.ts                # Master regression & integration test suite
├── src/
│   ├── ai/
│   │   ├── geminiProvider.ts          # Google Gemini REST API & dynamic model auto-discovery
│   │   ├── promptBuilder.ts           # System prompt & structured user context builder
│   │   ├── provider.ts                # AI Provider registry & dispatcher
│   │   ├── responseValidator.ts       # JSON schema validator & anti-hallucination firewall
│   │   ├── sanitizer.ts               # Context sanitization module for AI
│   │   └── types.ts                   # Sanitized context, Gemini model, and response types
│   ├── background/
│   │   └── serviceWorker.ts           # Service worker routing (Test, Analyze, Highlight, Ask AI, Scan Privacy)
│   ├── config/
│   │   └── env.ts                     # Environment variable abstraction (safe API key accessor)
│   ├── content/
│   │   ├── content.ts                 # Shadow DOM host initialization & message listeners
│   │   ├── elementRegistry.ts         # In-memory AURA Element Registry (WeakMap/Map)
│   │   ├── floatingAssistant.ts       # In-Page Floating Assistant (Ask AI + Page Elements views)
│   │   ├── highlighter.ts             # Temporary highlight overlay & adaptive guidance tooltip
│   │   ├── pageAnalyzer.ts            # Privacy-safe DOM structure extractor & visibility filter
│   │   └── sanitizer.ts               # Inlined sanitization layer for content scripts
│   ├── popup/
│   │   ├── index.css                  # Tailwind CSS tokens & utility styles
│   │   ├── index.html                 # Popup template
│   │   ├── main.tsx                   # React mount root
│   │   └── Popup.tsx                  # React Popup (Analyze + Privacy + Settings + Test tabs)
│   ├── privacy/
│   │   ├── privacyShield.ts           # Privacy Shield orchestrator & immutable protection pipeline
│   │   ├── redactor.ts                # In-place text & context redaction engine
│   │   ├── scanner.ts                 # Local sensitive data regex detection & Luhn card checker
│   │   └── types.ts                   # Privacy finding, summary, and protected context contracts
│   └── types/
│       ├── messages.ts                # Discriminated union types for runtime messaging
│       ├── page.ts                    # PageContext and element data models
│       └── theme.ts                   # Light/Dark/System theme types
├── .env.example                       # Environment variable template
├── manifest.json                      # Manifest V3 specification
├── vite.config.ts                     # Multi-entry Vite bundler configuration
└── package.json                       # Scripts and project dependencies
```

---

## ⚠️ Known Limitations

1. **Pattern-Based Sensitivity Detection**: Sensitive data detection for Aadhaar-like and phone numbers relies on structural format matching rather than live verification against government databases.
2. **Single Page Application (SPA) DOM Mutation**: For SPAs that modify DOM nodes dynamically without URL changes, AURA conducts an on-demand fresh analysis every time an action is invoked to guarantee current element references.
3. **Cross-Origin Iframes**: In compliance with standard browser security models, AURA analyzes the top-level document and does not inspect cross-origin iframe contents.

---

## 🔮 Future Roadmap

- [ ] **Voice Guidance & Screen Reader Audio Output**: Integration of local Web Speech API for auditory element guidance.
- [ ] **Custom Sensitivity Patterns**: User-defined regex rules in AURA Settings for enterprise-specific identifiers (e.g. employee IDs, internal project codes).
- [ ] **Multi-Model Provider Support**: Pluggable AI provider adapters for Anthropic Claude, OpenAI, and local WebGPU / Ollama models

---

## 📄 License

MIT License &copy; 2026 AURA Project. Built with privacy and accessibility as first principles.
