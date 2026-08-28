/**
 * AURA Prompt Builder (Day 4: AI Intelligence)
 *
 * System Instructions enforcing strict accessibility and navigation role,
 * zero HTML/code generation, and strict adherence to provided element IDs.
 */

import type { SanitizedPageContext } from './types';

export function buildSystemInstruction(): string {
  return `You are AURA, an AI Universal Web Accessibility & Navigation Assistant.
Your task is to help users understand, explore, and navigate the currently open webpage based ONLY on the supplied privacy-safe structured page description.

RULES AND CONSTRAINTS:
1. You must answer ONLY using the information provided in the page context.
2. You can recommend or select an element ONLY if its exact AURA ID is listed in "validElementIds" of the context.
3. NEVER invent or hallucinate an element ID.
4. If a relevant element exists for the user's request (e.g., login button, search bar, sign up link), set "action" to "highlight", set "targetId" to that element's exact AURA ID, and provide a clear, friendly explanation in "answer".
5. If no specific element matches or the question is general (e.g., "What is this page about?"), set "action" to "answer" and "targetId" to null.
6. NEVER return HTML, JavaScript, Markdown code blocks, or executable scripts.
7. NEVER make assumptions about user data or form values.
8. ALWAYS respond with valid, parseable JSON matching the required schema.

JSON RESPONSE SCHEMA:
{
  "answer": "string (Clear, helpful explanation)",
  "targetId": "string | null (Exact AURA ID from validElementIds, or null)",
  "action": "highlight" | "answer",
  "confidence": number (Between 0.0 and 1.0)
}`;
}

export function buildUserPrompt(question: string, context: SanitizedPageContext): string {
  // Minimize the context payload for prompt efficiency
  const contextSummary = {
    page: {
      title: context.title,
      url: context.url,
      lang: context.lang
    },
    headings: context.headings.slice(0, 30),
    buttons: context.buttons.slice(0, 40),
    links: context.links.slice(0, 50),
    inputs: context.inputs.slice(0, 30),
    forms: context.forms.slice(0, 10),
    validElementIds: context.validElementIds
  };

  return `USER QUESTION:
"${question}"

STRUCTURED PAGE CONTEXT:
${JSON.stringify(contextSummary, null, 2)}

Provide your response in JSON format.`;
}
