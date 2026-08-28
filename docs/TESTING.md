# 🧪 AURA Quality Assurance & Manual Testing Guide

This guide provides an 18-point manual testing checklist to verify all aspects of the **AURA Chrome Extension** across Day 1 through Day 6.

---

## 📋 Comprehensive 18-Point Verification Checklist

| # | Feature Area | Test Scenario | Expected Outcome | Status |
| :-: | :--- | :--- | :--- | :-: |
| **1** | **Extension Installation** | Load `dist/` into `chrome://extensions` in Developer Mode. | Extension icon appears in Chrome toolbar with name *"AURA - AI Accessibility & Privacy Assistant"*. | 🟩 PASS |
| **2** | **Popup UI Open** | Click the AURA extension icon. | React popup opens smoothly showing AURA logo, title, tab navigation, and active webpage info. | 🟩 PASS |
| **3** | **Test Connection (Day 1)** | Navigate to the **Test** tab and click **"Test Connection"**. | Pipeline steps animate; 3-second temporary Shadow DOM notification banner appears on webpage; latency in ms is displayed. | 🟩 PASS |
| **4** | **Page Analysis (Day 2)** | In the **Analyze** tab, click **"Analyze Page"**. | Analyzes webpage structure in memory without modifying DOM or extracting form values. | 🟩 PASS |
| **5** | **Metric Counts** | Inspect the 5-metric summary grid (Headings, Buttons, Links, Inputs, Forms). | Metrics match the visible interactive elements on the page. | 🟩 PASS |
| **6** | **Privacy Shield Scan (Day 5)** | Switch to the **Privacy** tab and click **"Scan Current Page"**. | Runs local sensitive data detection without sending anything to AI; displays 6-metric category summary and friendly location badges. | 🟩 PASS |
| **7** | **In-Page Floating Assistant (Day 3)** | Click **"In-Page Panel"** in popup or click floating 54px circular button on page. | Floating glassmorphic assistant panel expands on the right side of the screen. | 🟩 PASS |
| **8** | **AI Configuration & Status (Day 4/6)** | Go to **Settings** tab and inspect configuration status card. | Displays "Gemini AI Ready" when `.env.local` is present; "Auto-Detect" lists active models enabled on your Google account. | 🟩 PASS |
| **9** | **AI Navigation Guidance (Day 4)** | In the In-Page Assistant **"Ask AI"** tab, ask: *"Where can I log in?"*. | Gemini generates structured guidance with high match confidence and a **"Show me"** button. | 🟩 PASS |
| **10** | **Privacy Shield Transparency** | Inspect the bottom of the AI response bubble. | Compact green badge displays: `🛡️ Privacy Shield active • X sensitive item(s) redacted locally`. | 🟩 PASS |
| **11** | **Sensitive Data Redaction** | Open a page with emails, phone numbers, or test cards and ask AI. | Sensitive strings are replaced with `[EMAIL_REDACTED]`, `[PHONE_REDACTED]`, `[CARD_REDACTED]` before reaching the Gemini prompt. | 🟩 PASS |
| **12** | **Element Highlighting (Day 3)** | Click the **"Show me"** button or click an element from the **"Page Elements"** category tabs. | Webpage smoothly scrolls to target, glowing purple/cyan pulse box highlights bounding box, and adaptive guidance tooltip appears for 5s. | 🟩 PASS |
| **13** | **Anti-Hallucination Firewall** | Ask AI to locate an element that doesn't exist on the page. | AI response validator demotes hallucinated IDs to text answer mode; highlighter is not triggered. | 🟩 PASS |
| **14** | **SPA Navigation Reliability** | Navigate between views in a Single Page Application (e.g. React/Vue/Angular router) and re-analyze. | On-demand analysis extracts fresh DOM structure corresponding to current view; zero stale references. | 🟩 PASS |
| **15** | **Duplicate Host Prevention** | Reload the extension via `chrome://extensions` while on a live webpage. | Defensive duplicate check removes stale host; exactly one `#aura-inpage-host` remains in DOM. | 🟩 PASS |
| **16** | **Light Mode Theme** | Click the theme toggle icon (Sun/Moon) in popup header. | Popup instantly switches to crisp Light Mode with high-contrast accessible typography. | 🟩 PASS |
| **17** | **Dark Mode Theme** | Click the theme toggle icon again to switch back to Dark Mode. | Popup switches back to sleek glassmorphic Dark Mode; preference persists across sessions. | 🟩 PASS |
| **18** | **Keyboard Accessibility (WCAG)** | Navigate through Popup and In-Page Assistant using <kbd>Tab</kbd>, <kbd>Enter</kbd>, and <kbd>Escape</kbd>. | All controls have visible focus rings (`ring-2`); <kbd>Escape</kbd> dismisses assistant dialog. | 🟩 PASS |

---

## ⚡ Automated Verification Commands

Run the full automated test suite anytime from terminal:

```bash
# 1. Master Quality Assurance & Regression Suite
npx tsx scripts/verify-final.ts

# 2. Individual Verification Suites
npx tsx scripts/verify-day4.ts
npx tsx scripts/verify-day5.ts

# 3. TypeScript Strict Type Check
npm run type-check

# 4. Production Build Bundle
npm run build
```
