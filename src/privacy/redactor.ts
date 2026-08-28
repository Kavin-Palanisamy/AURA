/**
 * AURA Sensitive Data Redactor (Day 5: Privacy Shield)
 *
 * Replaces sensitive data matches with standard redaction tokens:
 * [EMAIL_REDACTED], [PHONE_REDACTED], [CARD_REDACTED], [AADHAAR_REDACTED], [API_KEY_REDACTED]
 *
 * Privacy Guarantees:
 * - Generates metadata-only findings (never stores the original secret).
 * - Leaves non-sensitive context intact.
 */

import type { SanitizedPageContext } from '../ai/types';
import type { PrivacyFinding } from './types';
import { scanTextForSensitiveData } from './scanner';

export interface StringRedactionResult {
  redactedText: string;
  findings: PrivacyFinding[];
}

/**
 * Redacts sensitive patterns in a single string and records findings
 */
export function redactString(text: string, location: string, friendlyLocation?: string): StringRedactionResult {
  if (!text || typeof text !== 'string') {
    return { redactedText: text || '', findings: [] };
  }

  const matches = scanTextForSensitiveData(text);
  if (matches.length === 0) {
    return { redactedText: text, findings: [] };
  }

  const findings: PrivacyFinding[] = [];

  // Replace from end to start to preserve earlier indices
  const sortedMatches = [...matches].sort((a, b) => b.start - a.start);
  let redacted = text;

  for (const m of sortedMatches) {
    redacted = redacted.substring(0, m.start) + m.replacement + redacted.substring(m.end);
    findings.push({
      type: m.type,
      severity: m.severity,
      location,
      friendlyLocation: friendlyLocation || location,
      redacted: true
    });
  }

  return {
    redactedText: redacted,
    findings: findings.reverse()
  };
}

/**
 * Traverses a sanitized page context and redacts sensitive information across all text fields
 */
export function redactSanitizedPageContext(
  context: SanitizedPageContext
): { context: SanitizedPageContext; findings: PrivacyFinding[] } {
  const allFindings: PrivacyFinding[] = [];

  // 1. Redact Title
  const titleRes = redactString(context.title, 'page.title', 'Page Title');
  const title = titleRes.redactedText;
  allFindings.push(...titleRes.findings);

  // 2. Redact Headings
  const headings = context.headings.map((h, idx) => {
    const res = redactString(h.text, `headings[${idx}].text (${h.id})`, `Page Heading (${h.level ? `H${h.level}` : 'Heading'})`);
    allFindings.push(...res.findings);
    return {
      ...h,
      text: res.redactedText
    };
  });

  // 3. Redact Buttons
  const buttons = context.buttons.map((b, idx) => {
    const res = redactString(b.text, `buttons[${idx}].text (${b.id})`, 'Button Text');
    allFindings.push(...res.findings);
    return {
      ...b,
      text: res.redactedText
    };
  });

  // 4. Redact Links
  const links = context.links.map((l, idx) => {
    const textRes = redactString(l.text, `links[${idx}].text (${l.id})`, 'Link Text');
    allFindings.push(...textRes.findings);

    // Also sanitize href if it contains sensitive inline query params or emails
    let href = l.href;
    if (href.startsWith('mailto:')) {
      const mailtoRes = redactString(href.replace('mailto:', ''), `links[${idx}].href (${l.id})`, 'Mailto Link');
      href = `mailto:${mailtoRes.redactedText}`;
      allFindings.push(...mailtoRes.findings);
    } else if (href.startsWith('tel:')) {
      const telRes = redactString(href.replace('tel:', ''), `links[${idx}].href (${l.id})`, 'Phone Link');
      href = `tel:${telRes.redactedText}`;
      allFindings.push(...telRes.findings);
    }

    return {
      ...l,
      text: textRes.redactedText,
      href
    };
  });

  // 5. Redact Inputs (labels and placeholders only - values are NEVER present!)
  const inputs = context.inputs.map((inp, idx) => {
    let label = inp.label;
    if (label) {
      const labelRes = redactString(label, `inputs[${idx}].label (${inp.id})`, `Input Label (${inp.type || 'field'})`);
      label = labelRes.redactedText;
      allFindings.push(...labelRes.findings);
    }

    let placeholder = inp.placeholder;
    if (placeholder) {
      const phRes = redactString(placeholder, `inputs[${idx}].placeholder (${inp.id})`, `Input Placeholder (${inp.type || 'field'})`);
      placeholder = phRes.redactedText;
      allFindings.push(...phRes.findings);
    }

    return {
      ...inp,
      label,
      placeholder
    };
  });

  // 6. Redact Forms (names or labels)
  const forms = context.forms.map((f, idx) => {
    let nameOrLabel = f.nameOrLabel;
    if (nameOrLabel) {
      const formRes = redactString(nameOrLabel, `forms[${idx}].nameOrLabel (${f.id})`, 'Form Name');
      nameOrLabel = formRes.redactedText;
      allFindings.push(...formRes.findings);
    }

    return {
      ...f,
      nameOrLabel
    };
  });

  const protectedContext: SanitizedPageContext = {
    title,
    url: context.url,
    lang: context.lang,
    headings,
    buttons,
    links,
    inputs,
    forms,
    validElementIds: [...context.validElementIds]
  };

  return {
    context: protectedContext,
    findings: allFindings
  };
}
