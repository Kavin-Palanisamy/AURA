/**
 * AURA AI Response Validator (Day 4: AI Intelligence)
 *
 * Security & Integrity Firewall:
 * - Treats raw AI response as untrusted input.
 * - Enforces schema validation.
 * - Prevents hallucinated element IDs from triggering highlights.
 */

import type { AuraAIResponse, SanitizedPageContext } from './types';

/**
 * Validates and cleans raw AI output against the AuraAIResponse schema and page context
 */
export function validateAIResponse(
  rawText: string,
  context: SanitizedPageContext
): AuraAIResponse {
  let parsed: Record<string, unknown>;

  try {
    // 1. Clean markdown fences if present
    const cleaned = cleanJsonString(rawText);
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.warn('[AURA AI Validator] Failed to parse JSON from AI response:', err, rawText);
    return {
      answer: rawText.replace(/```[a-z]*\n?/g, '').trim() || 'AURA could not process the response. Please try asking again.',
      targetId: null,
      action: 'answer',
      confidence: 0.5
    };
  }

  // 2. Validate "answer"
  let answer = 'Here is the information about the page.';
  if (typeof parsed.answer === 'string' && parsed.answer.trim().length > 0) {
    answer = parsed.answer.trim();
  }

  // 3. Validate "confidence"
  let confidence = 0.8;
  if (typeof parsed.confidence === 'number' && !isNaN(parsed.confidence)) {
    confidence = Math.max(0, Math.min(1, parsed.confidence));
  }

  // 4. Validate "action" and "targetId"
  let action: 'highlight' | 'answer' = 'answer';
  let targetId: string | null = null;

  if (parsed.action === 'highlight' && typeof parsed.targetId === 'string' && parsed.targetId.trim()) {
    const candidateId = parsed.targetId.trim();

    // Verify candidateId actually exists in the provided context
    const validSet = new Set(context.validElementIds);

    if (validSet.has(candidateId)) {
      action = 'highlight';
      targetId = candidateId;
    } else {
      console.warn(`[AURA AI Validator] AI hallucinated targetId: "${candidateId}". Valid IDs:`, context.validElementIds);
      // Fallback safely to answer-only mode to prevent highlighting non-existent or malicious elements
      action = 'answer';
      targetId = null;
    }
  }

  return {
    answer,
    targetId,
    action,
    confidence
  };
}

/**
 * Extracts and trims JSON text from potential markdown code fences
 */
function cleanJsonString(raw: string): string {
  let text = raw.trim();

  // Strip ```json ... ``` or ``` ... ```
  if (text.startsWith('```')) {
    text = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/g, '').trim();
  }

  // Find first '{' and last '}'
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    text = text.substring(start, end + 1);
  }

  return text;
}
