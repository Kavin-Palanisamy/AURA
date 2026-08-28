/**
 * AURA Page Intelligence Data Models (Day 2)
 * Privacy-First Structured Page Context
 */

export interface PageMetadata {
  title: string;
  url: string;
  lang: string;
  analyzedAt: number;
}

export interface AuraHeading {
  id: string; // e.g., "aura-heading-001"
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface AuraInteractiveElement {
  id: string; // e.g., "aura-button-001"
  type: 'button' | 'submit' | 'reset' | 'role-button';
  text: string;
  disabled: boolean;
}

export interface AuraLink {
  id: string; // e.g., "aura-link-001"
  text: string;
  href: string;
}

export interface AuraInputField {
  id: string; // e.g., "aura-input-001"
  element: 'input' | 'textarea' | 'select';
  type: string; // text, email, password, checkbox, etc.
  label?: string;
  placeholder?: string;
  required: boolean;
  disabled: boolean;
  // CRITICAL PRIVACY RULE: NEVER include input.value, textarea.value, or passwords!
}

export interface AuraForm {
  id: string; // e.g., "aura-form-001"
  nameOrLabel?: string;
  fieldCount: number;
  // CRITICAL PRIVACY RULE: NEVER include form field values!
}

export interface PageSummaryStats {
  headingsCount: number;
  buttonsCount: number;
  linksCount: number;
  inputsCount: number;
  formsCount: number;
}

export interface PageContext {
  metadata: PageMetadata;
  headings: AuraHeading[];
  buttons: AuraInteractiveElement[];
  links: AuraLink[];
  inputs: AuraInputField[];
  forms: AuraForm[];
  summary: PageSummaryStats;
}
