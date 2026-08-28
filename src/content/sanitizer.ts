/**
 * AURA Context Sanitizer (Content Script Module)
 *
 * Privacy Firewall:
 * - Creates a clean minimized SanitizedPageContext for AI transmission.
 * - Extracts only metadata, headings, buttons, links, inputs, and forms.
 * - Excludes all user-entered values, passwords, cookies, and raw DOM nodes.
 */

import type { PageContext } from '../types/page';
import type { SanitizedPageContext } from '../ai/types';

export function sanitizePageContextForAI(pageContext: PageContext): SanitizedPageContext {
  const validElementIds: string[] = [];

  const headings = (pageContext.headings || []).map((h) => {
    validElementIds.push(h.id);
    return {
      id: h.id,
      level: h.level,
      text: h.text
    };
  });

  const buttons = (pageContext.buttons || []).map((b) => {
    validElementIds.push(b.id);
    return {
      id: b.id,
      type: b.type,
      text: b.text,
      disabled: b.disabled
    };
  });

  const links = (pageContext.links || []).map((l) => {
    validElementIds.push(l.id);
    return {
      id: l.id,
      text: l.text,
      href: l.href
    };
  });

  const inputs = (pageContext.inputs || []).map((i) => {
    validElementIds.push(i.id);
    return {
      id: i.id,
      element: i.element,
      type: i.type,
      label: i.label,
      placeholder: i.placeholder,
      required: i.required,
      disabled: i.disabled
      // CRITICAL PRIVACY: NO values!
    };
  });

  const forms = (pageContext.forms || []).map((f) => {
    validElementIds.push(f.id);
    return {
      id: f.id,
      nameOrLabel: f.nameOrLabel,
      fieldCount: f.fieldCount
      // CRITICAL PRIVACY: NO values!
    };
  });

  return {
    title: pageContext.metadata.title || 'Untitled Page',
    url: pageContext.metadata.url || '',
    lang: pageContext.metadata.lang || 'en',
    headings,
    buttons,
    links,
    inputs,
    forms,
    validElementIds
  };
}
