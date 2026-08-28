/**
 * AURA In-Page Floating Assistant (Day 3)
 *
 * Isolated Shadow DOM Component providing:
 * - Floating circular trigger button with pulse glow
 * - In-page Assistant Panel with category tabs (Buttons, Links, Inputs, Headings)
 * - Direct element selection & highlight integration
 * - Keyboard accessibility (Escape to close, Tab navigation)
 */

import type { PageContext } from '../types/page';
import { analyzePage } from './pageAnalyzer';
import { highlightElementById } from './highlighter';

export class FloatingAssistant {
  private shadowRoot: ShadowRoot;
  private isOpen = false;
  private currentContext: PageContext | null = null;
  private activeCategory: 'buttons' | 'links' | 'inputs' | 'headings' = 'buttons';
  private selectedElementId: string | null = null;

  // DOM elements inside ShadowRoot
  private triggerBtn!: HTMLButtonElement;
  private panelContainer!: HTMLDivElement;
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
    this.triggerBtn.setAttribute('title', 'AURA Web Assistant (Press Escape to close)');
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
              <span class="aura-day-badge">Day 3</span>
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

      <!-- Main Body Container -->
      <div class="aura-panel-content"></div>

      <!-- Footer Action Area -->
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

    // References
    this.contentArea = (this.panelContainer.querySelector('.aura-panel-content') as HTMLDivElement) || document.createElement('div');
    this.highlightBtn = (this.panelContainer.querySelector('.aura-highlight-action-btn') as HTMLButtonElement) || document.createElement('button');
    const closeBtn = this.panelContainer.querySelector('.aura-close-btn') as HTMLButtonElement | null;

    closeBtn?.addEventListener('click', () => this.closePanel());
    this.highlightBtn?.addEventListener('click', () => {
      if (this.selectedElementId) {
        highlightElementById(this.selectedElementId);
      }
    });

    this.renderInitialState();
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

  private attachGlobalKeyListeners(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closePanel();
      }
    });
  }

  /**
   * Renders the un-analyzed state
   */
  private renderInitialState(): void {
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

  /**
   * Runs in-page page analysis
   */
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
        const retryBtn = this.contentArea.querySelector('.aura-analyze-inpage-btn') as HTMLButtonElement;
        retryBtn?.addEventListener('click', () => this.runAnalysis());
      }
    }, 120);
  }

  /**
   * Renders the analyzed elements view with Category Tabs & List
   */
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

    // Attach Tab Switch Handlers
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

  /**
   * Populates the active category items in the scroll list
   */
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

    // Attach Selection Handlers
    const itemCards = scrollContainer.querySelectorAll('.aura-item-card');
    itemCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (id) {
          this.selectElement(id);
          // Highlight immediately on selection for fast UX
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
