/**
 * AURA Element Highlighter (Day 3: Element Highlighting & Guidance Tooltip)
 *
 * Architecture & Safety:
 * - Independent fixed overlay rendered in the isolated Shadow DOM.
 * - Zero permanent DOM or CSS mutations on the target element.
 * - Adaptive viewport tooltip positioning.
 * - Auto-dismisses after 5 seconds with active repositioning on scroll/resize.
 */

import { elementRegistry } from './elementRegistry';

interface ActiveHighlightSession {
  targetElement: Element;
  targetId: string;
  overlayEl: HTMLDivElement;
  tooltipEl: HTMLDivElement;
  cleanupTimer: number;
  scrollListener: () => void;
  resizeListener: () => void;
}

let activeSession: ActiveHighlightSession | null = null;
let shadowRootRef: ShadowRoot | null = null;

/**
 * Sets the ShadowRoot container where highlight overlays will be rendered
 */
export function setHighlighterShadowRoot(shadowRoot: ShadowRoot): void {
  shadowRootRef = shadowRoot;
}

/**
 * Highlights a registered element by its AURA ID
 */
export function highlightElementById(targetId: string, customMessage?: string): boolean {
  const element = elementRegistry.getElement(targetId);

  if (!element || !(element instanceof HTMLElement || element instanceof SVGElement)) {
    console.warn(`[AURA Highlighter] Target ID not found in registry: ${targetId}`);
    return false;
  }

  // 1. Immediately clear any existing highlight session
  clearHighlight();

  // 2. Smoothly scroll target into view
  try {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  } catch (err) {
    console.warn('[AURA Highlighter] scrollIntoView failed:', err);
  }

  // 3. Allow scroll to settle (~250ms), then render overlay & tooltip
  setTimeout(() => {
    renderHighlight(element, targetId, customMessage);
  }, 250);

  return true;
}

/**
 * Clears current highlight overlay, tooltip, timers, and listeners
 */
export function clearHighlight(): void {
  if (!activeSession) return;

  const { overlayEl, tooltipEl, cleanupTimer, scrollListener, resizeListener } = activeSession;

  window.clearTimeout(cleanupTimer);
  window.removeEventListener('scroll', scrollListener, { capture: true });
  window.removeEventListener('resize', resizeListener);

  // Smooth fade-out before DOM removal
  overlayEl.style.opacity = '0';
  tooltipEl.style.opacity = '0';

  setTimeout(() => {
    if (overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
    if (tooltipEl.parentNode) tooltipEl.parentNode.removeChild(tooltipEl);
  }, 200);

  activeSession = null;
}

/**
 * Renders the overlay frame and tooltip inside Shadow DOM
 */
function renderHighlight(element: Element, targetId: string, customMessage?: string): void {
  if (!shadowRootRef) {
    console.error('[AURA Highlighter] ShadowRoot reference not set.');
    return;
  }

  // Re-check visibility
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0 && rect.top === 0 && rect.left === 0) {
    console.warn('[AURA Highlighter] Target element has zero bounding rect.');
    return;
  }

  // 1. Build Overlay Box
  const overlayEl = document.createElement('div');
  overlayEl.className = 'aura-highlight-overlay';
  overlayEl.setAttribute('data-aura-highlight-for', targetId);

  // 2. Build Guidance Tooltip
  const tooltipEl = document.createElement('div');
  tooltipEl.className = 'aura-highlight-tooltip';

  const defaultMsg = deriveContextualMessage(element, targetId);
  const messageText = customMessage || defaultMsg;

  tooltipEl.innerHTML = `
    <div class="aura-tooltip-sparkle">✨</div>
    <div class="aura-tooltip-body">
      <span class="aura-tooltip-title">${escapeHtml(messageText)}</span>
      <span class="aura-tooltip-id">${escapeHtml(targetId)}</span>
    </div>
  `;

  // 3. Append to Shadow DOM
  shadowRootRef.appendChild(overlayEl);
  shadowRootRef.appendChild(tooltipEl);

  // 4. Update initial positions
  updatePositions(element, overlayEl, tooltipEl);

  // Trigger enter animation on next frame
  requestAnimationFrame(() => {
    overlayEl.style.opacity = '1';
    tooltipEl.style.opacity = '1';
  });

  // 5. Setup dynamic repositioning on scroll & resize
  let rafId: number | null = null;
  const reposition = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      if (!element.isConnected) {
        clearHighlight();
        return;
      }
      updatePositions(element, overlayEl, tooltipEl);
    });
  };

  window.addEventListener('scroll', reposition, { capture: true, passive: true });
  window.addEventListener('resize', reposition, { passive: true });

  // 6. Setup 5-second automatic cleanup
  const cleanupTimer = window.setTimeout(() => {
    clearHighlight();
  }, 5000);

  activeSession = {
    targetElement: element,
    targetId,
    overlayEl,
    tooltipEl,
    cleanupTimer,
    scrollListener: reposition,
    resizeListener: reposition
  };
}

/**
 * Calculates and applies fixed viewport coordinates for overlay and tooltip
 */
function updatePositions(element: Element, overlayEl: HTMLElement, tooltipEl: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  const padding = 4;

  // Apply overlay dimensions (with padding)
  const top = rect.top - padding;
  const left = rect.left - padding;
  const width = Math.max(20, rect.width + padding * 2);
  const height = Math.max(20, rect.height + padding * 2);

  overlayEl.style.top = `${top}px`;
  overlayEl.style.left = `${left}px`;
  overlayEl.style.width = `${width}px`;
  overlayEl.style.height = `${height}px`;

  // Tooltip dimensions
  const tooltipWidth = tooltipEl.offsetWidth || 240;
  const tooltipHeight = tooltipEl.offsetHeight || 44;

  // Horizontal alignment: Center aligned with target
  let tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
  // Clamp inside viewport
  const minLeft = 12;
  const maxLeft = Math.max(12, window.innerWidth - tooltipWidth - 12);
  tooltipLeft = Math.max(minLeft, Math.min(maxLeft, tooltipLeft));

  // Vertical placement: Prefer above target, fallback below if near top
  let tooltipTop = rect.top - tooltipHeight - 12;
  let isBelow = false;

  if (tooltipTop < 12) {
    tooltipTop = rect.bottom + 12;
    isBelow = true;
  }

  tooltipEl.style.top = `${tooltipTop}px`;
  tooltipEl.style.left = `${tooltipLeft}px`;

  if (isBelow) {
    tooltipEl.classList.add('aura-tooltip-below');
  } else {
    tooltipEl.classList.remove('aura-tooltip-below');
  }
}

/**
 * Safely derives a helpful contextual message from the element's accessible identity
 */
function deriveContextualMessage(element: Element, targetId: string): string {
  const tag = element.tagName.toLowerCase();
  const ariaLabel = element.getAttribute('aria-label');
  const visibleText = (element as HTMLElement).innerText || element.textContent || '';
  const cleanLabel = (ariaLabel || visibleText || '').replace(/\s+/g, ' ').trim();
  const truncated = cleanLabel.length > 32 ? `${cleanLabel.slice(0, 32)}...` : cleanLabel;

  if (targetId.startsWith('aura-button')) {
    return truncated ? `This is the "${truncated}" button` : 'This is the selected button';
  }
  if (targetId.startsWith('aura-link')) {
    return truncated ? `This is the "${truncated}" link` : 'This is the selected link';
  }
  if (targetId.startsWith('aura-input')) {
    const inputType = element.getAttribute('type') || tag;
    return truncated ? `This is the ${inputType} input ("${truncated}")` : `This is the selected ${inputType} field`;
  }
  if (targetId.startsWith('aura-heading')) {
    return truncated ? `This is the heading "${truncated}"` : 'This is the selected heading';
  }
  if (targetId.startsWith('aura-form')) {
    return truncated ? `This is the form "${truncated}"` : 'This is the selected form';
  }

  return 'This is the selected element';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
