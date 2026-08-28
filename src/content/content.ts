/**
 * AURA Content Script Entry Point (Day 1 + Day 2 + Day 3)
 *
 * Integrated Architecture:
 * - Isolated Shadow DOM host for all in-page AURA elements
 * - Day 1: Shadow DOM Temporary Notification Banner
 * - Day 2: Privacy-First In-Memory Page Analyzer
 * - Day 3: Floating Trigger Button, In-Page Assistant Panel, and Element Highlighter
 */

import type {
  AuraResponse,
  ShowBannerPayload,
  HighlightElementPayload,
  ToggleAssistantPayload
} from '../types/messages';
import type { PageContext } from '../types/page';
import { analyzePage } from './pageAnalyzer';
import { setHighlighterShadowRoot, highlightElementById } from './highlighter';
import { FloatingAssistant } from './floatingAssistant';

const AURA_ACTION_SHOW_BANNER = 'AURA_SHOW_BANNER';
const AURA_ACTION_ANALYZE_PAGE = 'AURA_ANALYZE_PAGE';
const AURA_ACTION_HIGHLIGHT_ELEMENT = 'AURA_HIGHLIGHT_ELEMENT';
const AURA_ACTION_TOGGLE_ASSISTANT = 'AURA_TOGGLE_ASSISTANT';

console.log('[AURA Content] Script loaded on page:', window.location.href);

let shadowHost: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let floatingAssistant: FloatingAssistant | null = null;
let activeBannerContainer: HTMLDivElement | null = null;
let bannerDismissTimer: number | null = null;

/**
 * Initializes the unified Shadow DOM environment for AURA with duplicate host prevention
 */
function initAuraRoot(): { host: HTMLDivElement; shadow: ShadowRoot } {
  // Defensive duplicate prevention: remove any existing unlinked host
  const existingHost = document.getElementById('aura-inpage-host');
  if (existingHost && existingHost !== shadowHost) {
    existingHost.remove();
  }

  if (shadowHost && shadowRoot && shadowHost.isConnected) {
    return { host: shadowHost, shadow: shadowRoot };
  }

  shadowHost = document.createElement('div');
  shadowHost.id = 'aura-inpage-host';
  shadowHost.style.position = 'fixed';
  shadowHost.style.top = '0';
  shadowHost.style.left = '0';
  shadowHost.style.width = '0';
  shadowHost.style.height = '0';
  shadowHost.style.pointerEvents = 'none';
  shadowHost.style.zIndex = '2147483647'; // Highest z-index

  shadowRoot = shadowHost.attachShadow({ mode: 'open' });

  // Inject comprehensive scoped stylesheet
  const style = document.createElement('style');
  style.textContent = getAuraStyles();
  shadowRoot.appendChild(style);

  const container = document.body || document.documentElement;
  if (container) {
    container.appendChild(shadowHost);
  }

  // Bind highlighter shadow reference
  setHighlighterShadowRoot(shadowRoot);

  // Initialize Floating Assistant UI
  floatingAssistant = new FloatingAssistant(shadowRoot);

  return { host: shadowHost, shadow: shadowRoot };
}

// Auto-initialize when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initAuraRoot());
} else {
  initAuraRoot();
}

/**
 * Global message listener for Service Worker & Popup commands
 */
chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (typeof message !== 'object' || message === null) {
    return false;
  }

  const { shadow } = initAuraRoot();
  const msg = message as { action?: string; payload?: unknown };

  // 1. Day 1 Banner Action
  if (msg.action === AURA_ACTION_SHOW_BANNER) {
    const payload = msg.payload as ShowBannerPayload;
    displayAuraBanner(payload, shadow);

    const response: AuraResponse = {
      success: true,
      message: 'AURA banner rendered successfully',
      timestamp: Date.now()
    };
    sendResponse(response);
    return true;
  }

  // 2. Day 2 Page Analyzer Action
  if (msg.action === AURA_ACTION_ANALYZE_PAGE) {
    try {
      const pageContext: PageContext = analyzePage();
      const response: AuraResponse<PageContext> = {
        success: true,
        message: `Successfully analyzed page: "${pageContext.metadata.title}"`,
        data: pageContext,
        timestamp: Date.now()
      };
      sendResponse(response);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown analyzer error';
      console.error('[AURA Content] Page analysis failed:', errMsg);
      sendResponse({
        success: false,
        error: `Page analysis failed: ${errMsg}`,
        timestamp: Date.now()
      });
    }
    return true;
  }

  // 3. Day 3 Element Highlighting Action
  if (msg.action === AURA_ACTION_HIGHLIGHT_ELEMENT) {
    const payload = msg.payload as HighlightElementPayload;
    if (!payload?.targetId) {
      sendResponse({ success: false, error: 'targetId is required for highlighting' });
      return false;
    }

    const success = highlightElementById(payload.targetId, payload.message);
    sendResponse({
      success,
      message: success ? `Highlighted element ${payload.targetId}` : `Element not found: ${payload.targetId}`,
      timestamp: Date.now()
    });
    return true;
  }

  // 4. Day 3 Toggle Assistant Action
  if (msg.action === AURA_ACTION_TOGGLE_ASSISTANT) {
    const payload = msg.payload as ToggleAssistantPayload;
    if (floatingAssistant) {
      floatingAssistant.togglePanel(payload?.open);
      sendResponse({ success: true, message: 'Assistant toggled', timestamp: Date.now() });
    } else {
      sendResponse({ success: false, error: 'Floating assistant not initialized' });
    }
    return true;
  }

  return false;
});

/**
 * Day 1 Notification Banner (Preserved and Enhanced)
 */
function displayAuraBanner(payload: ShowBannerPayload, shadow: ShadowRoot): void {
  const messageText = payload?.message || '✨ AURA is connected and ready!';
  const duration = payload?.durationMs || 3000;
  const badgeText = payload?.badge || 'Day 1 Verified';

  // Clean up any existing banner
  if (bannerDismissTimer !== null) {
    clearTimeout(bannerDismissTimer);
    bannerDismissTimer = null;
  }
  if (activeBannerContainer && activeBannerContainer.parentNode) {
    activeBannerContainer.parentNode.removeChild(activeBannerContainer);
    activeBannerContainer = null;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'aura-overlay-wrapper';

  const card = document.createElement('div');
  card.className = 'aura-banner-card';
  card.innerHTML = `
    <div class="aura-icon-container">
      <div class="aura-icon-pulse"></div>
      <svg class="aura-icon-svg" viewBox="0 0 24 24">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
      </svg>
    </div>
    <div class="aura-content">
      <div class="aura-title-row">
        <span class="aura-title">${escapeHtml(messageText)}</span>
        <span class="aura-badge">${escapeHtml(badgeText)}</span>
      </div>
      <div class="aura-subtitle">
        <span class="aura-dot"></span>
        <span>AURA Assistant Active &bull; Temporary Verification Overlay</span>
      </div>
    </div>
    <div class="aura-progress-bar" style="animation-duration: ${duration}ms;"></div>
  `;

  wrapper.appendChild(card);
  shadow.appendChild(wrapper);
  activeBannerContainer = wrapper;

  requestAnimationFrame(() => {
    card.classList.add('aura-visible');
  });

  bannerDismissTimer = window.setTimeout(() => {
    card.classList.remove('aura-visible');
    card.classList.add('aura-hiding');
    setTimeout(() => {
      if (wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
      activeBannerContainer = null;
    }, 400);
  }, duration);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Returns complete scoped CSS styles for Day 1 + Day 3 Shadow DOM components
 */
function getAuraStyles(): string {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    /* ==========================================================================
       DAY 1: BANNER STYLES
       ========================================================================== */
    .aura-overlay-wrapper {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      display: flex;
      justify-content: center;
      padding-top: 24px;
      pointer-events: none;
      z-index: 2147483647;
    }

    .aura-banner-card {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 20px 12px 16px;
      background: rgba(15, 23, 42, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(139, 92, 246, 0.45);
      border-radius: 9999px;
      box-shadow: 
        0 10px 30px -5px rgba(0, 0, 0, 0.6),
        0 0 25px 2px rgba(99, 102, 241, 0.35),
        inset 0 1px 1px rgba(255, 255, 255, 0.15);
      color: #ffffff;
      transform: translateY(-40px) scale(0.95);
      opacity: 0;
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
      position: relative;
      overflow: hidden;
    }

    .aura-banner-card.aura-visible {
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    .aura-banner-card.aura-hiding {
      transform: translateY(-30px) scale(0.92);
      opacity: 0;
      transition: transform 0.35s cubic-bezier(0.4, 0, 1, 1), opacity 0.3s ease;
    }

    .aura-icon-container {
      position: relative;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 0 12px rgba(139, 92, 246, 0.6);
    }

    .aura-icon-pulse {
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      opacity: 0.6;
      animation: auraPulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
      z-index: -1;
    }

    @keyframes auraPulse {
      0%, 100% { transform: scale(1); opacity: 0.4; }
      50% { transform: scale(1.3); opacity: 0; }
    }

    .aura-icon-svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: #ffffff;
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .aura-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .aura-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .aura-title {
      font-size: 14px;
      font-weight: 600;
      color: #f8fafc;
    }

    .aura-badge {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 7px;
      background: rgba(6, 182, 212, 0.18);
      border: 1px solid rgba(6, 182, 212, 0.45);
      border-radius: 9999px;
      color: #67e8f9;
    }

    .aura-subtitle {
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .aura-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
      display: inline-block;
    }

    .aura-progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 2.5px;
      background: linear-gradient(90deg, #6366f1, #06b6d4, #10b981);
      width: 100%;
      transform-origin: left;
      animation: auraProgress linear forwards;
    }

    @keyframes auraProgress {
      0% { transform: scaleX(1); }
      100% { transform: scaleX(0); }
    }

    /* ==========================================================================
       DAY 3: FLOATING TRIGGER BUTTON
       ========================================================================== */
    .aura-float-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 54px;
      height: 54px;
      border-radius: 50%;
      border: 1.5px solid rgba(255, 255, 255, 0.25);
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%);
      box-shadow: 
        0 8px 25px -4px rgba(79, 70, 229, 0.5),
        0 0 20px 2px rgba(6, 182, 212, 0.35);
      cursor: pointer;
      pointer-events: auto;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
      outline: none;
    }

    .aura-float-btn:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 
        0 12px 30px -4px rgba(79, 70, 229, 0.65),
        0 0 30px 4px rgba(6, 182, 212, 0.5);
    }

    .aura-float-btn:focus-visible {
      ring: 3px solid #67e8f9;
      box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.6);
    }

    .aura-float-btn-active {
      transform: rotate(45deg);
      background: linear-gradient(135deg, #dc2626 0%, #9333ea 100%);
    }

    .aura-float-btn-inner {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .aura-sparkle-svg {
      width: 26px;
      height: 26px;
      fill: #ffffff;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }

    .aura-float-btn-pulse {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.5) 0%, transparent 70%);
      animation: auraRingPulse 2.8s infinite cubic-bezier(0.4, 0, 0.6, 1);
      z-index: -1;
    }

    @keyframes auraRingPulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 0; }
      100% { transform: scale(0.95); opacity: 0; }
    }

    /* ==========================================================================
       DAY 3: FLOATING ASSISTANT PANEL
       ========================================================================== */
    .aura-inpage-panel {
      position: fixed;
      bottom: 90px;
      right: 24px;
      width: 360px;
      max-height: 520px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      box-shadow: 
        0 20px 45px -10px rgba(0, 0, 0, 0.7),
        0 0 35px 2px rgba(99, 102, 241, 0.25);
      color: #f8fafc;
      pointer-events: auto;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      transform: translateY(20px) scale(0.94);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
      overflow: hidden;
    }

    .aura-inpage-panel.aura-panel-open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: auto;
    }

    .aura-panel-header {
      padding: 14px 16px;
      background: rgba(30, 41, 59, 0.7);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .aura-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .aura-header-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .aura-title-flex {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .aura-header-title {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.01em;
    }

    .aura-day-badge {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 1.5px 6px;
      background: rgba(99, 102, 241, 0.25);
      border: 1px solid rgba(99, 102, 241, 0.5);
      border-radius: 9999px;
      color: #a5b4fc;
    }

    .aura-header-sub {
      font-size: 10.5px;
      color: #94a3b8;
    }

    .aura-close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }

    .aura-close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    /* Content Area */
    .aura-panel-content {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 240px;
      max-height: 380px;
      overflow: hidden;
    }

    /* Empty State */
    .aura-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px 16px;
      gap: 8px;
    }

    .aura-empty-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }

    .aura-empty-title {
      font-size: 13.5px;
      font-weight: 600;
      color: #e2e8f0;
    }

    .aura-empty-sub {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.4;
      margin-bottom: 8px;
    }

    .aura-analyze-inpage-btn {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);
      border: none;
      border-radius: 10px;
      color: #ffffff;
      font-size: 12px;
      font-weight: 600;
      padding: 9px 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .aura-analyze-inpage-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.55);
    }

    /* Loading state */
    .aura-loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
      gap: 12px;
      font-size: 12px;
      color: #94a3b8;
    }

    .aura-spinner {
      width: 28px;
      height: 28px;
      border: 3px solid rgba(99, 102, 241, 0.2);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: auraSpin 0.8s linear infinite;
    }

    @keyframes auraSpin {
      to { transform: rotate(360deg); }
    }

    /* Category Tabs */
    .aura-tabs-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      background: rgba(15, 23, 42, 0.6);
      padding: 3px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .aura-tab {
      background: transparent;
      border: none;
      border-radius: 6px;
      color: #94a3b8;
      font-size: 10.5px;
      font-weight: 600;
      padding: 6px 2px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      transition: all 0.15s ease;
    }

    .aura-tab:hover {
      color: #f1f5f9;
      background: rgba(255, 255, 255, 0.05);
    }

    .aura-tab-active {
      background: #3b82f6 !important;
      color: #ffffff !important;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
    }

    .aura-tab-count {
      font-size: 9px;
      background: rgba(0, 0, 0, 0.3);
      padding: 1px 4px;
      border-radius: 9999px;
    }

    /* Scroll List */
    .aura-elements-scroll-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-right: 4px;
      max-height: 250px;
    }

    .aura-elements-scroll-list::-webkit-scrollbar {
      width: 4px;
    }
    .aura-elements-scroll-list::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 4px;
    }

    .aura-item-card {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .aura-item-card:hover {
      background: rgba(51, 65, 85, 0.7);
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateX(2px);
    }

    .aura-item-selected {
      background: rgba(79, 70, 229, 0.25) !important;
      border-color: #6366f1 !important;
      box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
    }

    .aura-item-tag {
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 0.04em;
      padding: 2px 5px;
      border-radius: 4px;
      text-transform: uppercase;
      shrink: 0;
      margin-top: 1px;
    }

    .aura-tag-button { background: rgba(6, 182, 212, 0.2); color: #67e8f9; border: 1px solid rgba(6, 182, 212, 0.4); }
    .aura-tag-link { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4); }
    .aura-tag-input { background: rgba(245, 158, 11, 0.2); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.4); }
    .aura-tag-heading { background: rgba(139, 92, 246, 0.2); color: #c4b5fd; border: 1px solid rgba(139, 92, 246, 0.4); }

    .aura-item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .aura-item-title {
      font-size: 11.5px;
      font-weight: 600;
      color: #f1f5f9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .aura-item-id {
      font-size: 9.5px;
      color: #94a3b8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .aura-no-items {
      text-align: center;
      padding: 24px;
      font-size: 11px;
      color: #64748b;
    }

    /* Panel Footer */
    .aura-panel-footer {
      padding: 10px 14px;
      background: rgba(15, 23, 42, 0.8);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .aura-highlight-action-btn {
      width: 100%;
      background: #334155;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #94a3b8;
      font-size: 11.5px;
      font-weight: 600;
      padding: 8px;
      cursor: not-allowed;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .aura-highlight-btn-active {
      background: linear-gradient(135deg, #6366f1, #06b6d4) !important;
      color: #ffffff !important;
      cursor: pointer !important;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    }

    .aura-highlight-btn-active:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
    }

    /* ==========================================================================
       DAY 3: HIGHLIGHT OVERLAY & TOOLTIP
       ========================================================================== */
    .aura-highlight-overlay {
      position: fixed;
      border: 2.5px solid #8b5cf6;
      border-radius: 8px;
      box-shadow: 
        0 0 25px 4px rgba(139, 92, 246, 0.6),
        inset 0 0 15px rgba(6, 182, 212, 0.35);
      background: rgba(99, 102, 241, 0.08);
      pointer-events: none;
      z-index: 2147483646;
      opacity: 0;
      transition: opacity 0.2s ease;
      animation: auraHighlightPulse 2s infinite ease-in-out;
    }

    @keyframes auraHighlightPulse {
      0%, 100% { box-shadow: 0 0 20px 3px rgba(139, 92, 246, 0.5), inset 0 0 12px rgba(6, 182, 212, 0.25); }
      50% { box-shadow: 0 0 35px 6px rgba(139, 92, 246, 0.8), inset 0 0 20px rgba(6, 182, 212, 0.45); }
    }

    .aura-highlight-tooltip {
      position: fixed;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(139, 92, 246, 0.6);
      border-radius: 10px;
      padding: 8px 14px;
      color: #ffffff;
      box-shadow: 
        0 10px 30px rgba(0, 0, 0, 0.6),
        0 0 20px rgba(99, 102, 241, 0.4);
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
      z-index: 2147483647;
      opacity: 0;
      transition: opacity 0.2s ease;
      max-width: 320px;
    }

    .aura-tooltip-sparkle {
      font-size: 14px;
    }

    .aura-tooltip-body {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .aura-tooltip-title {
      font-size: 11.5px;
      font-weight: 600;
      color: #f8fafc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .aura-tooltip-id {
      font-size: 9px;
      color: #38bdf8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    /* ==========================================================================
       DAY 4: AI ASSISTANT VIEW & CHAT STYLES
       ========================================================================== */
    .aura-mode-switcher {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      padding: 6px 12px 0 12px;
      background: rgba(15, 23, 42, 0.4);
    }

    .aura-mode-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      color: #94a3b8;
      font-size: 11px;
      font-weight: 600;
      padding: 6px 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      transition: all 0.2s ease;
    }

    .aura-mode-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #f1f5f9;
    }

    .aura-mode-active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(139, 92, 246, 0.35) 100%) !important;
      border-color: rgba(139, 92, 246, 0.6) !important;
      color: #ffffff !important;
      box-shadow: 0 0 12px rgba(99, 102, 241, 0.25);
    }

    .aura-ai-view {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 8px;
      justify-content: space-between;
    }

    .aura-ai-conversation-area {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 240px;
      padding-right: 2px;
    }

    .aura-ai-conversation-area::-webkit-scrollbar {
      width: 4px;
    }
    .aura-ai-conversation-area::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 4px;
    }

    .aura-ai-welcome-card {
      background: rgba(30, 41, 59, 0.4);
      border: 1px dashed rgba(139, 92, 246, 0.35);
      border-radius: 12px;
      padding: 16px 14px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      margin: auto 0;
    }

    .aura-ai-sparkle-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      border-radius: 9999px;
      color: #c4b5fd;
    }

    .aura-ai-welcome-title {
      font-size: 12.5px;
      font-weight: 600;
      color: #f1f5f9;
    }

    .aura-ai-welcome-sub {
      font-size: 10.5px;
      color: #94a3b8;
      line-height: 1.35;
    }

    .aura-ai-conversation-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .aura-user-query-bubble {
      align-self: flex-end;
      background: #3730a3;
      border: 1px solid rgba(165, 180, 252, 0.3);
      border-radius: 12px 12px 2px 12px;
      padding: 6px 10px;
      color: #ffffff;
      font-size: 11px;
      max-width: 85%;
      word-break: break-word;
    }

    .aura-ai-bubble {
      align-self: flex-start;
      background: rgba(30, 41, 59, 0.75);
      border: 1px solid rgba(139, 92, 246, 0.35);
      border-radius: 12px 12px 12px 2px;
      padding: 10px 12px;
      color: #f8fafc;
      font-size: 11.5px;
      line-height: 1.45;
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .aura-ai-bubble-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 4px;
    }

    .aura-ai-name {
      font-size: 10px;
      font-weight: 700;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .aura-ai-conf {
      font-size: 9.5px;
      color: #94a3b8;
      font-mono;
    }

    .aura-ai-text {
      color: #e2e8f0;
      white-space: pre-wrap;
    }

    .aura-privacy-transparency-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #6ee7b7;
      font-size: 9.5px;
      font-weight: 500;
      width: fit-content;
    }

    .aura-show-me-btn {
      align-self: flex-start;
      background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
      border: none;
      border-radius: 8px;
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 600;
      padding: 6px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 2px 10px rgba(99, 102, 241, 0.4);
      transition: all 0.2s ease;
      margin-top: 2px;
    }

    .aura-show-me-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.6);
    }

    .aura-ai-loading-bubble {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: #cbd5e1;
      padding: 10px 14px;
    }

    .aura-ai-pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #06b6d4;
      box-shadow: 0 0 8px #06b6d4;
      animation: auraRingPulse 1.4s infinite ease-in-out;
    }

    .aura-ai-error-bubble {
      background: rgba(159, 18, 57, 0.4);
      border: 1px solid rgba(244, 63, 94, 0.4);
      border-radius: 10px;
      padding: 8px 12px;
      color: #fecdd3;
      font-size: 11px;
      line-height: 1.35;
    }

    .aura-ai-chips-scroll {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .aura-ai-chips-scroll::-webkit-scrollbar {
      display: none;
    }

    .aura-ai-chip {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 9999px;
      color: #94a3b8;
      font-size: 9.5px;
      font-weight: 500;
      padding: 3px 8px;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .aura-ai-chip:hover {
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.4);
      color: #e2e8f0;
    }

    .aura-ai-input-form {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 4px 6px 4px 10px;
      transition: border-color 0.2s;
    }

    .aura-ai-input-form:focus-within {
      border-color: #6366f1;
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.25);
    }

    .aura-ai-textarea {
      flex: 1;
      background: transparent;
      border: none;
      color: #f8fafc;
      font-size: 11.5px;
      outline: none;
      resize: none;
      font-family: inherit;
      padding: 4px 0;
      max-height: 50px;
    }

    .aura-ai-textarea::placeholder {
      color: #64748b;
    }

    .aura-ai-send-btn {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
      border: none;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.2s;
      flex-shrink: 0;
    }

    .aura-ai-send-btn:hover:not(:disabled) {
      transform: scale(1.05);
    }

    .aura-ai-send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `;
}
