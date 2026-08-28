/**
 * AURA Page Analyzer (Day 2: Page Intelligence)
 *
 * Privacy-First Content Script Module
 * - Inspects webpage structure in memory.
 * - Assigns stable session IDs to the AURA Element Registry.
 * - Extracts structured PageContext with ZERO form value extraction.
 * - Strictly avoids mutating host DOM elements.
 */

import type {
  PageContext,
  PageMetadata,
  AuraHeading,
  AuraInteractiveElement,
  AuraLink,
  AuraInputField,
  AuraForm,
  PageSummaryStats
} from '../types/page';
import { elementRegistry } from './elementRegistry';

/**
 * Checks if a DOM element is reasonably visible to the user
 */
export function isElementVisible(element: Element): boolean {
  if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
    return false;
  }

  // Fast check for hidden attribute
  if (element.hasAttribute('hidden') || element.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  try {
    const style = window.getComputedStyle(element);

    if (style.display === 'none') return false;
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
    if (parseFloat(style.opacity) === 0) return false;

    // Check client rects (handles zero-size elements)
    const rects = element.getClientRects();
    if (rects.length === 0) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return false;
    }

    return true;
  } catch {
    // If computedStyle fails (e.g. detached node), consider not visible
    return false;
  }
}

/**
 * Cleans and normalizes text content
 */
function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Resolves accessible text for interactive elements with standard priority:
 * 1. aria-label
 * 2. aria-labelledby target text
 * 3. visible textContent / innerText
 * 4. value attribute (for input buttons)
 * 5. title attribute
 */
function getAccessibleText(el: Element, fallbackValue?: string): string {
  // 1. aria-label
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && cleanText(ariaLabel)) {
    return cleanText(ariaLabel);
  }

  // 2. aria-labelledby
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const ids = labelledBy.split(/\s+/);
    const labelTexts = ids
      .map(id => document.getElementById(id)?.textContent || '')
      .filter(Boolean)
      .join(' ');
    if (cleanText(labelTexts)) {
      return cleanText(labelTexts);
    }
  }

  // 3. innerText / textContent
  const visibleText = cleanText((el as HTMLElement).innerText || el.textContent);
  if (visibleText) {
    return visibleText;
  }

  // 4. value attribute (for input buttons)
  if (fallbackValue && cleanText(fallbackValue)) {
    return cleanText(fallbackValue);
  }

  // 5. title attribute
  const title = el.getAttribute('title');
  if (title && cleanText(title)) {
    return cleanText(title);
  }

  return '';
}

/**
 * Finds associated label for an input field without inspecting input values
 */
function getFieldLabel(input: HTMLElement): string | undefined {
  // 1. aria-label
  const ariaLabel = input.getAttribute('aria-label');
  if (ariaLabel && cleanText(ariaLabel)) {
    return cleanText(ariaLabel);
  }

  // 2. Associated <label for="id">
  const id = input.getAttribute('id');
  if (id) {
    const labelFor = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (labelFor && cleanText(labelFor.textContent)) {
      return cleanText(labelFor.textContent);
    }
  }

  // 3. Enclosing <label>
  const parentLabel = input.closest('label');
  if (parentLabel && cleanText(parentLabel.textContent)) {
    return cleanText(parentLabel.textContent);
  }

  // 4. aria-labelledby
  const labelledBy = input.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl && cleanText(labelEl.textContent)) {
      return cleanText(labelEl.textContent);
    }
  }

  // 5. title
  const title = input.getAttribute('title');
  if (title && cleanText(title)) {
    return cleanText(title);
  }

  return undefined;
}

/**
 * 1. Extract Page Metadata
 */
function extractMetadata(): PageMetadata {
  return {
    title: document.title ? cleanText(document.title) : 'Untitled Document',
    url: window.location.href,
    lang: document.documentElement.lang || 'en',
    analyzedAt: Date.now()
  };
}

/**
 * 2. Extract Headings (h1 - h6)
 */
function extractHeadings(): AuraHeading[] {
  const headings: AuraHeading[] = [];
  const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

  headingElements.forEach(el => {
    if (!isElementVisible(el)) return;

    const text = cleanText((el as HTMLElement).innerText || el.textContent);
    if (!text) return; // Ignore empty headings

    const tagLevel = parseInt(el.tagName.substring(1), 10);
    const level = (tagLevel >= 1 && tagLevel <= 6 ? tagLevel : 1) as 1 | 2 | 3 | 4 | 5 | 6;
    const id = elementRegistry.register(el, 'heading');

    headings.push({
      id,
      level,
      text
    });
  });

  return headings;
}

/**
 * 3. Extract Interactive Buttons
 */
function extractButtons(): AuraInteractiveElement[] {
  const buttons: AuraInteractiveElement[] = [];
  const seenElements = new Set<Element>();

  const buttonQuery = 'button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]';
  const candidateElements = document.querySelectorAll(buttonQuery);

  candidateElements.forEach(el => {
    if (seenElements.has(el)) return;
    seenElements.add(el);

    if (!isElementVisible(el)) return;

    let buttonType: AuraInteractiveElement['type'] = 'button';
    let fallbackVal: string | undefined;

    if (el.tagName === 'INPUT') {
      const inputType = el.getAttribute('type')?.toLowerCase();
      if (inputType === 'submit') buttonType = 'submit';
      else if (inputType === 'reset') buttonType = 'reset';
      else buttonType = 'button';
      fallbackVal = el.getAttribute('value') || undefined;
    } else if (el.getAttribute('role') === 'button' && el.tagName !== 'BUTTON') {
      buttonType = 'role-button';
    }

    const text = getAccessibleText(el, fallbackVal) || 'Unlabeled Button';
    const isDisabled =
      (el as HTMLButtonElement).disabled === true ||
      el.getAttribute('aria-disabled') === 'true' ||
      el.classList.contains('disabled');

    const id = elementRegistry.register(el, 'button');

    buttons.push({
      id,
      type: buttonType,
      text,
      disabled: isDisabled
    });
  });

  return buttons;
}

/**
 * 4. Extract Links (a[href])
 */
function extractLinks(): AuraLink[] {
  const links: AuraLink[] = [];
  const linkElements = document.querySelectorAll('a[href]');

  linkElements.forEach(el => {
    if (!isElementVisible(el)) return;

    const hrefAttr = el.getAttribute('href')?.trim() || '';
    if (!hrefAttr || hrefAttr === '#' || hrefAttr.toLowerCase().startsWith('javascript:')) {
      return; // Ignore empty or javascript: links
    }

    const text = getAccessibleText(el) || cleanText(el.getAttribute('aria-label')) || hrefAttr;
    const fullHref = (el as HTMLAnchorElement).href || hrefAttr;
    const id = elementRegistry.register(el, 'link');

    links.push({
      id,
      text,
      href: fullHref
    });
  });

  return links;
}

/**
 * 5. Extract Input Fields (Metadata ONLY - Zero Values)
 */
function extractInputs(): AuraInputField[] {
  const inputs: AuraInputField[] = [];
  const fieldQuery = 'input, textarea, select';
  const candidateElements = document.querySelectorAll(fieldQuery);

  candidateElements.forEach(el => {
    if (!(el instanceof HTMLElement)) return;

    // Filter out buttons/submits/resets (handled in buttons) and hidden inputs
    if (el.tagName === 'INPUT') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      if (['button', 'submit', 'reset', 'hidden', 'image'].includes(type)) {
        return;
      }
    }

    if (!isElementVisible(el)) return;

    const rawTag = el.tagName.toLowerCase();
    const elementKind: 'input' | 'textarea' | 'select' =
      rawTag === 'textarea' ? 'textarea' : rawTag === 'select' ? 'select' : 'input';
    let inputType = rawTag;
    if (rawTag === 'input') {
      inputType = (el.getAttribute('type') || 'text').toLowerCase();
    }

    const label = getFieldLabel(el);
    const placeholder = el.getAttribute('placeholder') ? cleanText(el.getAttribute('placeholder')) : undefined;
    const isRequired = (el as HTMLInputElement).required === true || el.getAttribute('aria-required') === 'true';
    const isDisabled = (el as HTMLInputElement).disabled === true || el.getAttribute('aria-disabled') === 'true';

    const id = elementRegistry.register(el, 'input');

    // PRIVACY ENFORCEMENT: Never read el.value or select options
    inputs.push({
      id,
      element: elementKind,
      type: inputType,
      label,
      placeholder,
      required: isRequired,
      disabled: isDisabled
    });
  });

  return inputs;
}

/**
 * 6. Extract Forms (Metadata & Field Counts ONLY - Zero Values)
 */
function extractForms(): AuraForm[] {
  const forms: AuraForm[] = [];
  const formElements = document.querySelectorAll('form');

  formElements.forEach(el => {
    if (!isElementVisible(el)) return;

    const nameOrLabel =
      el.getAttribute('aria-label') ||
      el.getAttribute('name') ||
      el.getAttribute('id') ||
      undefined;

    // Count interactive fields inside form
    const formFields = el.querySelectorAll(
      'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select'
    );
    const fieldCount = formFields.length;

    const id = elementRegistry.register(el, 'form');

    forms.push({
      id,
      nameOrLabel: nameOrLabel ? cleanText(nameOrLabel) : undefined,
      fieldCount
    });
  });

  return forms;
}

/**
 * Analyzes the active webpage and returns a privacy-safe, structured PageContext
 */
export function analyzePage(): PageContext {
  // 1. Reset in-memory registry for fresh analysis session
  elementRegistry.reset();

  // 2. Perform element extractions
  const metadata = extractMetadata();
  const headings = extractHeadings();
  const buttons = extractButtons();
  const links = extractLinks();
  const inputs = extractInputs();
  const forms = extractForms();

  // 3. Compute summary metrics
  const summary: PageSummaryStats = {
    headingsCount: headings.length,
    buttonsCount: buttons.length,
    linksCount: links.length,
    inputsCount: inputs.length,
    formsCount: forms.length
  };

  console.log(`[AURA Page Analyzer] Analyzed "${metadata.title}":`, summary);

  return {
    metadata,
    headings,
    buttons,
    links,
    inputs,
    forms,
    summary
  };
}
