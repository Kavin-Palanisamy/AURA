/**
 * AURA Local Sensitive Data Scanner (Day 5: Privacy Shield)
 *
 * Local Pattern Detection:
 * - Email detection
 * - Phone number detection (International, Indian, US)
 * - Credit card detection with Luhn algorithm validation
 * - Aadhaar-like 12-digit number detection
 * - API keys & credentials (AIza..., ghp_..., sk-..., Bearer tokens, JWTs)
 *
 * Privacy Guarantee:
 * - Runs 100% locally inside the Chrome extension.
 * - Does not store raw sensitive values in findings.
 */

import type { TextScanMatch } from './types';

/**
 * Validates a number string using the standard Luhn Algorithm (Mod 10)
 */
export function luhnCheck(numStr: string): boolean {
  const digitsOnly = numStr.replace(/\D/g, '');
  if (digitsOnly.length < 13 || digitsOnly.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Scans a text string for all sensitive data patterns locally
 */
export function scanTextForSensitiveData(text: string): TextScanMatch[] {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return [];
  }

  const matches: TextScanMatch[] = [];

  // 1. API Keys & Auth Tokens (Highest Priority to avoid sub-matching)
  // Google API Key pattern (AIza...)
  const googleKeyRegex = /\bAIza[0-9A-Za-z\-_]{30,40}\b/g;
  let match: RegExpExecArray | null;
  while ((match = googleKeyRegex.exec(text)) !== null) {
    matches.push({
      type: 'api_key',
      severity: 'high',
      start: match.index,
      end: match.index + match[0].length,
      replacement: '[API_KEY_REDACTED]'
    });
  }

  // GitHub Personal Access Token (ghp_...)
  const githubTokenRegex = /\bghp_[0-9a-zA-Z]{30,45}\b/g;
  while ((match = githubTokenRegex.exec(text)) !== null) {
    matches.push({
      type: 'token',
      severity: 'high',
      start: match.index,
      end: match.index + match[0].length,
      replacement: '[TOKEN_REDACTED]'
    });
  }

  // OpenAI / General Secret Key (sk-...)
  const genericSecretRegex = /\bsk-[a-zA-Z0-9_\-]{20,}\b/g;
  while ((match = genericSecretRegex.exec(text)) !== null) {
    matches.push({
      type: 'api_key',
      severity: 'high',
      start: match.index,
      end: match.index + match[0].length,
      replacement: '[API_KEY_REDACTED]'
    });
  }

  // Bearer Token & JWT patterns
  const bearerRegex = /\bBearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*/g;
  while ((match = bearerRegex.exec(text)) !== null) {
    matches.push({
      type: 'token',
      severity: 'high',
      start: match.index,
      end: match.index + match[0].length,
      replacement: '[TOKEN_REDACTED]'
    });
  }

  // 2. Email Address Detection
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  while ((match = emailRegex.exec(text)) !== null) {
    matches.push({
      type: 'email',
      severity: 'medium',
      start: match.index,
      end: match.index + match[0].length,
      replacement: '[EMAIL_REDACTED]'
    });
  }

  // 3. Credit Card Candidates (with Luhn algorithm validation)
  // Matches 13 to 19 digits with spaces or hyphens
  const cardCandidateRegex = /\b(?:\d[ -]?){13,19}\b/g;
  while ((match = cardCandidateRegex.exec(text)) !== null) {
    const rawMatch = match[0].trim();
    const digitsOnly = rawMatch.replace(/\D/g, '');

    // Require 13-19 digits and valid Luhn checksum
    if (digitsOnly.length >= 13 && digitsOnly.length <= 19 && luhnCheck(digitsOnly)) {
      matches.push({
        type: 'credit_card',
        severity: 'high',
        start: match.index,
        end: match.index + match[0].length,
        replacement: '[CARD_REDACTED]'
      });
    }
  }

  // 4. Aadhaar-like Number Detection (Exactly 12 digits, non-leading 0/1)
  // Format: 1234 5678 9012, 1234-5678-9012, or 123456789012
  const aadhaarRegex = /\b[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}\b/g;
  while ((match = aadhaarRegex.exec(text)) !== null) {
    const rawMatch = match[0].trim();
    const digitsOnly = rawMatch.replace(/\D/g, '');

    // Must be exactly 12 digits and not already matched by credit card Luhn check
    if (digitsOnly.length === 12) {
      matches.push({
        type: 'aadhaar',
        severity: 'high',
        start: match.index,
        end: match.index + match[0].length,
        replacement: '[AADHAAR_REDACTED]'
      });
    }
  }

  // 5. Phone Number Detection
  // Supports:
  // - Indian numbers: +91 98765 43210, 9876543210, +91-98765-43210
  // - US numbers: +1 (555) 123-4567, 555-123-4567, (555) 123 4567
  // - International formats: +xx xxx xxx xxxx (10 to 15 digits)
  const phoneRegexes = [
    // International with + prefix: +91 98765 43210, +1 555 123 4567
    /\+\d{1,4}[ -]?(?:\(?\d{2,5}\)?[ -]?)?\d{3,5}[ -]?\d{4,5}\b/g,
    // Indian 10-digit mobile (starts with 6-9, 5-5 or 10 digits): 98765 43210, 9876543210
    /\b[6-9]\d{4}[ -]\d{5}\b/g,
    /\b[6-9]\d{9}\b/g,
    // Standard 3-3-4 formatted phone: (555) 123-4567, 555-123-4567
    /(?:\+?1[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}\b/g
  ];

  for (const regex of phoneRegexes) {
    while ((match = regex.exec(text)) !== null) {
      const rawMatch = match[0].trim();
      const digitsOnly = rawMatch.replace(/\D/g, '');

      // Phone numbers generally have 10 to 15 digits
      if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
        // Avoid overlapping with Aadhaar (12 digits 4-4-4) or Credit Card
        const isCardOrAadhaar =
          (!rawMatch.startsWith('+') && digitsOnly.length === 12 && /^[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}$/.test(rawMatch)) ||
          (digitsOnly.length >= 13 && luhnCheck(digitsOnly));

        if (!isCardOrAadhaar) {
          matches.push({
            type: 'phone',
            severity: 'medium',
            start: match.index,
            end: match.index + match[0].length,
            replacement: '[PHONE_REDACTED]'
          });
        }
      }
    }
  }

  // Filter overlapping ranges (prefer higher severity or longer match)
  return filterOverlappingMatches(matches);
}

/**
 * Resolves overlapping match ranges by prioritizing higher severity and earlier position
 */
function filterOverlappingMatches(matches: TextScanMatch[]): TextScanMatch[] {
  if (matches.length <= 1) return matches;

  // Sort by start index ascending, then length descending
  matches.sort((a, b) => a.start - b.start || b.end - a.end);

  const nonOverlapping: TextScanMatch[] = [];
  let lastEnd = -1;

  for (const m of matches) {
    if (m.start >= lastEnd) {
      nonOverlapping.push(m);
      lastEnd = m.end;
    }
  }

  return nonOverlapping;
}
