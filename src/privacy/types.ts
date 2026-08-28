/**
 * AURA Privacy Shield Types & Contracts (Day 5: Privacy Shield)
 *
 * Strict Privacy Guarantees:
 * - Local-only processing inside Chrome extension
 * - Zero raw sensitive values stored in findings or logs
 * - Metadata-only findings for privacy reporting
 */

import type { SanitizedPageContext } from '../ai/types';

export type SensitiveDataType =
  | 'email'
  | 'phone'
  | 'credit_card'
  | 'aadhaar'
  | 'api_key'
  | 'token'
  | 'password'
  | 'personal_identifier';

export interface PrivacyFinding {
  type: SensitiveDataType;
  severity: 'low' | 'medium' | 'high';
  location: string;
  redacted: boolean;
}

export interface PrivacyScanSummary {
  emailCount: number;
  phoneCount: number;
  creditCardCount: number;
  aadhaarCount: number;
  apiKeyCount: number;
  tokenCount: number;
  passwordCount: number;
  totalRedactedCount: number;
}

export interface ProtectedContextResult {
  context: SanitizedPageContext;
  findings: PrivacyFinding[];
  summary: PrivacyScanSummary;
  redactedCount: number;
  scannedAt: number;
}

export interface TextScanMatch {
  type: SensitiveDataType;
  severity: 'low' | 'medium' | 'high';
  start: number;
  end: number;
  replacement: string;
}
