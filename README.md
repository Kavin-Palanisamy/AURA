# 🌟 AURA — AI Universal Web Accessibility & Privacy Assistant

> **Day 1, Day 2, Day 3, Day 4 & Day 5 Complete**: Manifest V3 Chrome Extension architecture, React + TypeScript Popup UI, Service Worker, Content Script, Shadow DOM Banner Overlay, Privacy-First **Page Intelligence Analyzer**, Live **In-Page Floating Assistant**, **Element Highlighting with Guidance Tooltips**, **Google Gemini AI Navigation Intelligence**, and Local **Privacy Shield (Sensitive Data Detection & Redaction)**.

---

## 🛠️ Tech Stack
- **Extension Platform**: Chrome Extension Manifest V3
- **Frontend Framework**: React 18
- **Language**: TypeScript (Strict mode)
- **Bundler & Build Tool**: Vite
- **AI Engine**: Google Gemini REST API (`gemini-2.5-flash` default, `gemini-2.5-flash-lite`, `gemini-2.5-pro` with dynamic account model discovery)
- **Privacy Engine**: Local regex scanners + Luhn algorithm checksum validator (100% in-extension)
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
│   ├── verify-day4.ts                 # AI Intelligence verification suite
│   └── verify-day5.ts                 # Privacy Shield verification suite
├── src/
│   ├── ai/
│   │   ├── geminiProvider.ts          # Google Gemini REST API provider & dynamic model discovery
│   │   ├── promptBuilder.ts           # System prompt & structured user context builder
│   │   ├── provider.ts                # AI Provider registry & factory
│   │   ├── responseValidator.ts       # Untrusted JSON validator & anti-hallucination firewall
│   │   ├── sanitizer.ts               # Context sanitization module for AI
│   │   └── types.ts                   # SanitizedPageContext, GeminiModel, & AuraAIResponse types
│   ├── background/
│   │   └── serviceWorker.ts           # Background router (Test, Analyze, Highlight, Toggle, Ask AI, Scan Privacy)
│   ├── content/
│   │   ├── content.ts                 # Unified Shadow DOM host & message listeners
│   │   ├── elementRegistry.ts         # In-memory AURA Element Registry (WeakMap/Map)
│   │   ├── floatingAssistant.ts       # In-Page Assistant Panel (Ask AI + Page Elements views + Privacy Badge)
│   │   ├── highlighter.ts             # Smooth scroll, independent overlay & guidance tooltip
│   │   ├── pageAnalyzer.ts            # Privacy-first DOM structure extractors & visibility filter
│   │   └── sanitizer.ts               # Inlined sanitization layer for content scripts
│   ├── popup/
│   │   ├── index.css                  # Tailwind & glow utility styles
│   │   ├── index.html                 # Popup HTML source template
│   │   ├── main.tsx                   # React mount root
│   │   └── Popup.tsx                  # React Popup (Analyze + Privacy Shield + AI Settings + Test Connection)
│   ├── privacy/
│   │   ├── privacyShield.ts           # Privacy Shield orchestrator & immutable protection pipeline
│   │   ├── redactor.ts                # Pure text & context redaction engine
│   │   ├── scanner.ts                 # Local sensitive data pattern detection & Luhn validator
│   │   └── types.ts                   # Privacy finding, summary, and protected context contracts
│   └── types/
│       ├── messages.ts                # Discriminated union types for Chrome runtime messaging
│       └── page.ts                    # PageContext and element data models
├── manifest.json                      # Extension manifest (storage permission added)
├── vite.config.ts                     # Multi-entry Vite bundler configuration
└── package.json                       # Scripts and project dependencies
```

---

## 🛡️ Day 5: Privacy Shield Architecture

The **Privacy Shield** is a local security firewall that intercepts every interaction before data is sent to external AI providers.

```
PageContext (In-Memory)
       │
       ▼
sanitizePageContextForAI() (Strips all DOM nodes & private values)
       │
       ▼
PrivacyShield.protect() [100% Local inside Chrome Extension]
       │
       ├── scanner.ts: Local Pattern Matching & Luhn Checksum
       │   ├── Email Detection: [EMAIL_REDACTED]
       │   ├── Phone Numbers: [PHONE_REDACTED]
       │   ├── Credit Cards (Luhn validated): [CARD_REDACTED]
       │   ├── Aadhaar-like 12-digit numbers: [AADHAAR_REDACTED]
       │   └── API Keys / Tokens: [API_KEY_REDACTED] / [TOKEN_REDACTED]
       │
       ├── redactor.ts: In-place text redaction across headings, buttons, links, inputs, forms
       └── Deep Immutability: Original context is never mutated
       │
       ▼
Protected AI Context (Only redacted metadata sent)
       │
       ▼
Google Gemini REST API (gemini-2.5-flash / dynamic fallback)
       │
       ▼
responseValidator.ts (Anti-Hallucination & targetId validation)
       │
       ▼
In-Page Assistant UI (Transparency Badge: "🛡️ Privacy Shield active • X redacted")
```

---

## 🚀 How to Run & Test

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Verify Day 4 & Day 5 Test Suites**:
   ```bash
   npx tsx scripts/verify-day4.ts
   npx tsx scripts/verify-day5.ts
   ```

3. **Check Types & Build**:
   ```bash
   npm run type-check
   npm run build
   ```

4. **Load into Google Chrome**:
   - Open Chrome and navigate to `chrome://extensions`.
   - Enable **Developer mode** (top-right toggle).
   - Click **Load unpacked** and select the `AURA/dist` directory.
   - Click the **AURA** extension icon in your browser toolbar!
