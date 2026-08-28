/**
 * AURA In-Page Floating Assistant (Day 3 + Day 4 AI Intelligence)
 *
 * Isolated Shadow DOM Component providing:
 * - Floating circular trigger button with pulse glow
 * - In-page Assistant Panel with dual modes: "Ask AI" and "Page Elements"
 * - Privacy-safe AI Q&A via sanitizePageContextForAI()
 * - "Show me" action button invoking the Day 3 highlighter
 * - Direct element selection & highlight integration
 * - Keyboard accessibility (Escape to close, Tab navigation)
 */

import type { PageContext } from '../types/page';
import type { AuraResponse, AskAIMessage, AskAIResponseData } from '../types/messages';
import { analyzePage } from './pageAnalyzer';
import { highlightElementById } from './highlighter';
import { sanitizePageContextForAI } from './sanitizer';

const AURA_ACTION_ASK_AI = 'AURA_ASK_AI';

type PanelViewMode = 'ai' | 'elements';

export class FloatingAssistant {
  private shadowRoot: ShadowRoot;
  private isOpen = false;
  private viewMode: PanelViewMode = 'ai';
  private currentContext: PageContext | null = null;
  private activeCategory: 'buttons' | 'links' | 'inputs' | 'headings' = 'buttons';
  private selectedElementId: string | null = null;

  // AI state
  private isAiLoading = false;
  private lastAiResponse: AskAIResponseData | null = null;
  private lastAiQuestion = '';
  private aiError: string | null = null;

  // DOM element references
  private triggerBtn!: HTMLButtonElement;
  private panelContainer!: HTMLDivElement;
  private modeNavArea!: HTMLDivElement;
  private contentArea!: HTMLDivElement;
  private highlightBtn!: HTMLButtonElement;

  constructor(shadowRoot: ShadowRoot) {
    this.shadowRoot = shadowRoot;
    this.init();
  }

  private init(): void {
    this.createTriggerButton();
    this.createPanel();
    this.attachGlobalKeyListeners();
  }

  private createTriggerButton(): void {
    this.triggerBtn = document.createElement('button');
    this.triggerBtn.className = 'aura-float-btn';
    this.triggerBtn.setAttribute('aria-label', 'Open AURA Assistant');
    this.triggerBtn.setAttribute('title', 'AURA Assistant (Press Escape to close)');
    this.triggerBtn.innerHTML = `
      <div class="aura-float-btn-pulse"></div>
      <div class="aura-float-btn-inner">
        <svg class="aura-sparkle-svg" viewBox="0 0 24 24">
          <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"></path>
        </svg>
      </div>
    `;

    this.triggerBtn.addEventListener('click', () => this.togglePanel());
    this.shadowRoot.appendChild(this.triggerBtn);
  }

  private createPanel(): void {
    this.panelContainer = document.createElement('div');
    this.panelContainer.className = 'aura-inpage-panel';
    this.panelContainer.setAttribute('role', 'dialog');
    this.panelContainer.setAttribute('aria-label', 'AURA Assistant Panel');

    this.panelContainer.innerHTML = `
      <!-- Header -->
      <div class="aura-panel-header">
        <div class="aura-header-left">
          <div class="aura-header-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
            </svg>
          </div>
          <div>
            <div class="aura-title-flex">
              <span class="aura-header-title">AURA</span>
              <span class="aura-day-badge">AI Active</span>
            </div>
            <p class="aura-header-sub">Understand. Navigate. Protect.</p>
          </div>
        </div>
        <button class="aura-close-btn" aria-label="Close Assistant Panel">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Mode Switcher (Ask AI vs Page Elements) -->
      <div class="aura-mode-switcher">
        <button class="aura-mode-btn aura-mode-active" data-mode="ai">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"></path>
          </svg>
          <span>Ask AI</span>
        </button>
        <button class="aura-mode-btn" data-mode="elements">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
          <span>Page Elements</span>
        </button>
      </div>

      <!-- Main Body Container -->
      <div class="aura-panel-content"></div>

      <!-- Footer Action Area (shown in elements mode) -->
      <div class="aura-panel-footer">
        <button class="aura-highlight-action-btn" disabled>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="4"></circle>
            <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
            <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
          </svg>
          <span>Highlight Element</span>
        </button>
      </div>
    `;

    // Element references
    this.modeNavArea = (this.panelContainer.querySelector('.aura-mode-switcher') as HTMLDivElement) || document.createElement('div');
    this.contentArea = (this.panelContainer.querySelector('.aura-panel-content') as HTMLDivElement) || document.createElement('div');
    this.highlightBtn = (this.panelContainer.querySelector('.aura-highlight-action-btn') as HTMLButtonElement) || document.createElement('button');
    const closeBtn = this.panelContainer.querySelector('.aura-close-btn') as HTMLButtonElement | null;

    closeBtn?.addEventListener('click', () => this.closePanel());
    this.highlightBtn?.addEventListener('click', () => {
      if (this.selectedElementId) {
        highlightElementById(this.selectedElementId);
      }
    });

    // Mode Switcher handlers
    const modeButtons = this.modeNavArea?.querySelectorAll('.aura-mode-btn') || [];
    modeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = (e.currentTarget as HTMLElement).getAttribute('data-mode') as PanelViewMode;
        if (mode) {
          this.switchMode(mode);
        }
      });
    });

    this.renderCurrentView();
    this.shadowRoot.appendChild(this.panelContainer);
  }

  public togglePanel(forceOpen?: boolean): void {
    const shouldOpen = forceOpen !== undefined ? forceOpen : !this.isOpen;
    if (shouldOpen) {
      this.openPanel();
    } else {
      this.closePanel();
    }
  }

  public openPanel(): void {
    this.isOpen = true;
    this.panelContainer.classList.add('aura-panel-open');
    this.triggerBtn.classList.add('aura-float-btn-active');
  }

  public closePanel(): void {
    this.isOpen = false;
    this.panelContainer.classList.remove('aura-panel-open');
    this.triggerBtn.classList.remove('aura-float-btn-active');
  }

  private switchMode(mode: PanelViewMode): void {
    this.viewMode = mode;
    const modeButtons = this.modeNavArea?.querySelectorAll('.aura-mode-btn') || [];
    modeButtons.forEach(btn => {
      if (btn.getAttribute('data-mode') === mode) {
        btn.classList.add('aura-mode-active');
      } else {
        btn.classList.remove('aura-mode-active');
      }
    });

    const footer = this.panelContainer.querySelector('.aura-panel-footer') as HTMLElement;
    if (footer) {
      footer.style.display = mode === 'elements' ? 'block' : 'none';
    }

    this.renderCurrentView();
  }

  private renderCurrentView(): void {
    if (this.viewMode === 'ai') {
      this.renderAiView();
    } else {
      if (!this.currentContext) {
        this.renderInitialElementsState();
      } else {
        this.renderAnalyzedState();
      }
    }
  }

  private attachGlobalKeyListeners(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closePanel();
      }
    });
  }

  /* ==========================================================================
     DAY 4: AI VIEW IMPLEMENTATION
     ========================================================================== */
  private renderAiView(): void {
    this.contentArea.innerHTML = `
      <div class="aura-ai-view">
        <!-- Response Area -->
        <div class="aura-ai-conversation-area">
          ${
            this.isAiLoading
              ? `
              <div class="aura-ai-bubble aura-ai-loading-bubble">
                <div class="aura-ai-pulse-dot"></div>
                <span>✨ AURA is understanding this page...</span>
              </div>
            `
              : this.lastAiResponse
              ? `
              <div class="aura-ai-conversation-item">
                <div class="aura-user-query-bubble">
                  ${escapeHtml(this.lastAiQuestion)}
                </div>
                <div class="aura-ai-bubble">
                  <div class="aura-ai-bubble-header">
                    <span class="aura-ai-name">AURA Guidance</span>
                    <span class="aura-ai-conf">${Math.round(this.lastAiResponse.confidence * 100)}% match</span>
                  </div>
                  <p class="aura-ai-text">${escapeHtml(this.lastAiResponse.answer)}</p>

                  <!-- Day 5 Privacy Shield Transparency -->
                  <div class="aura-privacy-transparency-pill">
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#34d399" stroke-width="2.2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <span>Privacy Shield active ${
                      this.lastAiResponse.redactedCount !== undefined && this.lastAiResponse.redactedCount > 0
                        ? `• ${this.lastAiResponse.redactedCount} item(s) redacted`
                        : '• 0 sensitive items detected'
                    }</span>
                  </div>

                  ${
                    this.lastAiResponse.action === 'highlight' && this.lastAiResponse.targetId
                      ? `
                    <button class="aura-show-me-btn" data-target="${escapeHtml(this.lastAiResponse.targetId)}">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="4"></circle>
                        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
                        <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
                      </svg>
                      <span>Show me (${escapeHtml(this.lastAiResponse.targetId)})</span>
                    </button>
                  `
                      : ''
                  }
                </div>
              </div>
            `
              : this.aiError
              ? `
              <div class="aura-ai-error-bubble">
                <p>${escapeHtml(this.aiError)}</p>
              </div>
            `
              : `
              <div class="aura-ai-welcome-card">
                <div class="aura-ai-sparkle-badge">✨ AI Assistant</div>
                <p class="aura-ai-welcome-title">Ask AURA about this page</p>
                <p class="aura-ai-welcome-sub">Ask where to find buttons, navigate forms, or understand what this page does.</p>
              </div>
            `
          }
        </div>

        <!-- Suggestion Chips -->
        <div class="aura-ai-chips-scroll">
          <button class="aura-ai-chip" data-query="Where can I log in?">Where can I log in?</button>
          <button class="aura-ai-chip" data-query="Find the search button">Find search</button>
          <button class="aura-ai-chip" data-query="Where do I submit this form?">Submit form</button>
          <button class="aura-ai-chip" data-query="What is this page about?">What is this page about?</button>
        </div>

        <!-- Input Box Area -->
        <form class="aura-ai-input-form">
          <textarea
            class="aura-ai-textarea"
            placeholder="Ask AURA about this page..."
            rows="1"
            ${this.isAiLoading ? 'disabled' : ''}
          ></textarea>
          <button
            type="submit"
            class="aura-ai-send-btn"
            aria-label="Send query"
            ${this.isAiLoading ? 'disabled' : ''}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    `;

    // Attach Suggestion Chip Handlers
    const chips = this.contentArea.querySelectorAll('.aura-ai-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        const query = (e.currentTarget as HTMLElement).getAttribute('data-query');
        if (query && !this.isAiLoading) {
          this.submitAiQuery(query);
        }
      });
    });

    // Attach "Show me" action handler
    const showMeBtn = this.contentArea.querySelector('.aura-show-me-btn') as HTMLButtonElement | null;
    showMeBtn?.addEventListener('click', () => {
      const targetId = showMeBtn.getAttribute('data-target');
      if (targetId) {
        highlightElementById(targetId, this.lastAiResponse?.answer);
      }
    });

    // Attach Input Form Handlers
    const form = this.contentArea.querySelector('.aura-ai-input-form') as HTMLFormElement | null;
    const textarea = this.contentArea.querySelector('.aura-ai-textarea') as HTMLTextAreaElement | null;

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (textarea && textarea.value.trim() && !this.isAiLoading) {
        const q = textarea.value.trim();
        textarea.value = '';
        this.submitAiQuery(q);
      }
    });

    textarea?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form?.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });
  }

  /**
   * Submits natural language query to Gemini via Background Service Worker
   */
  private async submitAiQuery(question: string): Promise<void> {
    this.isAiLoading = true;
    this.aiError = null;
    this.lastAiQuestion = question;
    this.renderAiView();

    try {
      // 1. Analyze page in memory if not already analyzed
      if (!this.currentContext) {
        this.currentContext = analyzePage();
      }

      // 2. Sanitize context for privacy
      const sanitized = sanitizePageContextForAI(this.currentContext);

      // 3. Dispatch to Background Service Worker
      const message: AskAIMessage = {
        action: AURA_ACTION_ASK_AI,
        payload: {
          question,
          context: sanitized
        }
      };

      const response: AuraResponse<AskAIResponseData> = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (res) => {
          const lastError = chrome.runtime.lastError;
          if (lastError) reject(new Error(lastError.message));
          else resolve(res);
        });
      });

      if (response && response.success && response.data) {
        this.lastAiResponse = response.data;
        this.aiError = null;
      } else {
        this.aiError = response?.error || 'AURA was unable to process this request.';
        this.lastAiResponse = null;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Communication error';
      this.aiError = errMsg;
      this.lastAiResponse = null;
    } finally {
      this.isAiLoading = false;
      this.renderAiView();
    }
  }

  /* ==========================================================================
     DAY 3: PAGE ELEMENTS VIEW IMPLEMENTATION
     ========================================================================== */
  private renderInitialElementsState(): void {
    this.contentArea.innerHTML = `
      <div class="aura-empty-state">
        <div class="aura-empty-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#60a5fa" stroke-width="1.8">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <p class="aura-empty-title">Explore Webpage Structure</p>
        <p class="aura-empty-sub">Analyze this page to explore and highlight interactive buttons, links, inputs, and headings.</p>
        <button class="aura-analyze-inpage-btn">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
          </svg>
          <span>Analyze Page</span>
        </button>
      </div>
    `;

    const analyzeBtn = this.contentArea.querySelector('.aura-analyze-inpage-btn') as HTMLButtonElement | null;
    analyzeBtn?.addEventListener('click', () => this.runAnalysis());
  }

  public runAnalysis(): void {
    this.contentArea.innerHTML = `
      <div class="aura-loading-state">
        <div class="aura-spinner"></div>
        <p>Analyzing webpage elements in memory...</p>
      </div>
    `;

    setTimeout(() => {
      try {
        this.currentContext = analyzePage();
        this.selectedElementId = null;
        this.renderAnalyzedState();
      } catch (err) {
        console.error('[AURA Floating Assistant] Analysis failed:', err);
        this.contentArea.innerHTML = `
          <div class="aura-error-state">
            <p>Analysis failed. Please try again.</p>
            <button class="aura-analyze-inpage-btn">Retry Analysis</button>
          </div>
        `;
        const retryBtn = this.contentArea.querySelector('.aura-analyze-inpage-btn') as HTMLButtonElement | null;
        retryBtn?.addEventListener('click', () => this.runAnalysis());
      }
    }, 120);
  }

  private renderAnalyzedState(): void {
    if (!this.currentContext) return;

    const ctx = this.currentContext;

    this.contentArea.innerHTML = `
      <!-- Category Tabs -->
      <div class="aura-tabs-bar">
        <button class="aura-tab ${this.activeCategory === 'buttons' ? 'aura-tab-active' : ''}" data-cat="buttons">
          Buttons <span class="aura-tab-count">${ctx.buttons.length}</span>
        </button>
        <button class="aura-tab ${this.activeCategory === 'links' ? 'aura-tab-active' : ''}" data-cat="links">
          Links <span class="aura-tab-count">${ctx.links.length}</span>
        </button>
        <button class="aura-tab ${this.activeCategory === 'inputs' ? 'aura-tab-active' : ''}" data-cat="inputs">
          Inputs <span class="aura-tab-count">${ctx.inputs.length}</span>
        </button>
        <button class="aura-tab ${this.activeCategory === 'headings' ? 'aura-tab-active' : ''}" data-cat="headings">
          Headings <span class="aura-tab-count">${ctx.headings.length}</span>
        </button>
      </div>

      <!-- Item List Container -->
      <div class="aura-elements-scroll-list"></div>
    `;

    const tabButtons = this.contentArea.querySelectorAll('.aura-tab');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = (e.currentTarget as HTMLElement).getAttribute('data-cat') as typeof this.activeCategory;
        if (cat) {
          this.activeCategory = cat;
          this.renderAnalyzedState();
        }
      });
    });

    this.renderCategoryItems();
  }

  private renderCategoryItems(): void {
    if (!this.currentContext) return;

    const scrollContainer = this.contentArea.querySelector('.aura-elements-scroll-list') as HTMLDivElement;
    if (!scrollContainer) return;

    let itemsHtml = '';
    const category = this.activeCategory;

    if (category === 'buttons') {
      const list = this.currentContext.buttons.slice(0, 40);
      if (list.length === 0) {
        itemsHtml = `<div class="aura-no-items">No interactive buttons detected.</div>`;
      } else {
        itemsHtml = list.map(item => `
          <div class="aura-item-card ${this.selectedElementId === item.id ? 'aura-item-selected' : ''}" data-id="${item.id}">
            <div class="aura-item-tag aura-tag-button">${escapeHtml(item.type.toUpperCase())}</div>
            <div class="aura-item-info">
              <span class="aura-item-title">${escapeHtml(item.text)}</span>
              <span class="aura-item-id">${escapeHtml(item.id)} ${item.disabled ? '• (disabled)' : ''}</span>
            </div>
          </div>
        `).join('');
      }
    } else if (category === 'links') {
      const list = this.currentContext.links.slice(0, 40);
      if (list.length === 0) {
        itemsHtml = `<div class="aura-no-items">No accessible links detected.</div>`;
      } else {
        itemsHtml = list.map(item => `
          <div class="aura-item-card ${this.selectedElementId === item.id ? 'aura-item-selected' : ''}" data-id="${item.id}">
            <div class="aura-item-tag aura-tag-link">LINK</div>
            <div class="aura-item-info">
              <span class="aura-item-title">${escapeHtml(item.text)}</span>
              <span class="aura-item-id">${escapeHtml(item.id)}</span>
            </div>
          </div>
        `).join('');
      }
    } else if (category === 'inputs') {
      const list = this.currentContext.inputs.slice(0, 40);
      if (list.length === 0) {
        itemsHtml = `<div class="aura-no-items">No form input fields detected.</div>`;
      } else {
        itemsHtml = list.map(item => `
          <div class="aura-item-card ${this.selectedElementId === item.id ? 'aura-item-selected' : ''}" data-id="${item.id}">
            <div class="aura-item-tag aura-tag-input">${escapeHtml(item.type.toUpperCase())}</div>
            <div class="aura-item-info">
              <span class="aura-item-title">${escapeHtml(item.label || item.placeholder || item.type + ' field')}</span>
              <span class="aura-item-id">${escapeHtml(item.id)} ${item.required ? '• (required)' : ''}</span>
            </div>
          </div>
        `).join('');
      }
    } else if (category === 'headings') {
      const list = this.currentContext.headings.slice(0, 40);
      if (list.length === 0) {
        itemsHtml = `<div class="aura-no-items">No headings (H1-H6) detected.</div>`;
      } else {
        itemsHtml = list.map(item => `
          <div class="aura-item-card ${this.selectedElementId === item.id ? 'aura-item-selected' : ''}" data-id="${item.id}">
            <div class="aura-item-tag aura-tag-heading">H${item.level}</div>
            <div class="aura-item-info">
              <span class="aura-item-title">${escapeHtml(item.text)}</span>
              <span class="aura-item-id">${escapeHtml(item.id)}</span>
            </div>
          </div>
        `).join('');
      }
    }

    scrollContainer.innerHTML = itemsHtml;

    const itemCards = scrollContainer.querySelectorAll('.aura-item-card');
    itemCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (id) {
          this.selectElement(id);
          highlightElementById(id);
        }
      });
    });

    this.updateHighlightButtonState();
  }

  private selectElement(id: string): void {
    this.selectedElementId = id;
    const cards = this.contentArea.querySelectorAll('.aura-item-card');
    cards.forEach(card => {
      if (card.getAttribute('data-id') === id) {
        card.classList.add('aura-item-selected');
      } else {
        card.classList.remove('aura-item-selected');
      }
    });
    this.updateHighlightButtonState();
  }

  private updateHighlightButtonState(): void {
    if (this.selectedElementId) {
      this.highlightBtn.disabled = false;
      this.highlightBtn.classList.add('aura-highlight-btn-active');
    } else {
      this.highlightBtn.disabled = true;
      this.highlightBtn.classList.remove('aura-highlight-btn-active');
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
