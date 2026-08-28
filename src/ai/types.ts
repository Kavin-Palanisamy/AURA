/**
 * AURA AI Types & Contracts (Day 4: AI Intelligence)
 *
 * Strict Privacy Guarantee:
 * - SanitizedPageContext contains zero raw HTML, DOM nodes, or form values.
 * - Structured JSON output format for all AI responses.
 */

export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'gemini-2.5-pro';

export const DEFAULT_GEMINI_MODEL: GeminiModel = 'gemini-2.5-flash';

export const GEMINI_FALLBACK_CHAIN: GeminiModel[] = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro'
];

export interface SanitizedHeading {
  id: string;
  level: number;
  text: string;
}

export interface SanitizedButton {
  id: string;
  type: string;
  text: string;
  disabled: boolean;
}

export interface SanitizedLink {
  id: string;
  text: string;
  href: string;
}

export interface SanitizedInput {
  id: string;
  element: string;
  type: string;
  label?: string;
  placeholder?: string;
  required: boolean;
  disabled: boolean;
}

export interface SanitizedForm {
  id: string;
  nameOrLabel?: string;
  fieldCount: number;
}

export interface SanitizedPageContext {
  title: string;
  url: string;
  lang: string;
  headings: SanitizedHeading[];
  buttons: SanitizedButton[];
  links: SanitizedLink[];
  inputs: SanitizedInput[];
  forms: SanitizedForm[];
  validElementIds: string[];
}

export interface AuraAIRequest {
  question: string;
  context: SanitizedPageContext;
}

export interface AuraAIResponse {
  answer: string;
  targetId: string | null;
  action: 'highlight' | 'answer';
  confidence: number;
}

export interface RawAIResponse {
  answer?: unknown;
  targetId?: unknown;
  action?: unknown;
  confidence?: unknown;
}

export interface AIProvider {
  name: string;
  ask(request: AuraAIRequest, apiKey?: string): Promise<AuraAIResponse>;
}
