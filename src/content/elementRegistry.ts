/**
 * AURA Runtime Element Registry (Day 2)
 *
 * Privacy & Safety Architecture Rule:
 * In-memory bidirectional registry between DOM Element References and stable AURA IDs.
 * Strictly avoids modifying host webpage DOM with data-aura-id or other attributes.
 */

export class AuraElementRegistry {
  private elementToId = new WeakMap<Element, string>();
  private idToElement = new Map<string, Element>();
  private counters: Record<string, number> = {};

  /**
   * Resets registry state for a new analysis session
   */
  public reset(): void {
    this.elementToId = new WeakMap<Element, string>();
    this.idToElement.clear();
    this.counters = {};
  }

  /**
   * Generates a stable ID and registers the DOM element
   * @param element DOM Element
   * @param prefix Category prefix (e.g. 'heading', 'button', 'link', 'input', 'form')
   */
  public register(element: Element, prefix: string): string {
    const existingId = this.elementToId.get(element);
    if (existingId) {
      return existingId;
    }

    const currentCount = (this.counters[prefix] || 0) + 1;
    this.counters[prefix] = currentCount;

    // Pad counter to 3 digits (e.g., aura-heading-001)
    const padded = String(currentCount).padStart(3, '0');
    const id = `aura-${prefix}-${padded}`;

    this.elementToId.set(element, id);
    this.idToElement.set(id, element);

    return id;
  }

  /**
   * Retrieves registered DOM element by AURA ID
   */
  public getElement(id: string): Element | undefined {
    return this.idToElement.get(id);
  }

  /**
   * Retrieves AURA ID for a DOM element if already registered
   */
  public getId(element: Element): string | undefined {
    return this.elementToId.get(element);
  }

  /**
   * Returns total number of registered elements in this session
   */
  public size(): number {
    return this.idToElement.size;
  }
}

// Singleton instance for the content script context
export const elementRegistry = new AuraElementRegistry();
