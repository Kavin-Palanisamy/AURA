/**
 * AURA Privacy Shield Orchestrator (Day 5: Privacy Shield)
 *
 * Immutable Local Privacy Firewall:
 * - Scans structured PageContext locally for sensitive personal information.
 * - Redacts detected patterns before AI transmission.
 * - Guarantees immutability of the original context.
 * - Never stores or sends raw sensitive values.
 */

import type { SanitizedPageContext } from '../ai/types';
import type { PrivacyFinding, PrivacyScanSummary, ProtectedContextResult } from './types';
import { redactSanitizedPageContext } from './redactor';

export class PrivacyShield {
  /**
   * Scans and redacts sensitive data from SanitizedPageContext, returning an immutable protected context.
   */
  public static protect(context: SanitizedPageContext): ProtectedContextResult {
    // 1. Deep clone context to guarantee immutability of original
    const clonedContext: SanitizedPageContext = JSON.parse(JSON.stringify(context));

    // 2. Perform local redaction pipeline
    const { context: protectedContext, findings } = redactSanitizedPageContext(clonedContext);

    // 3. Compute category summary metrics
    const summary = this.buildSummary(findings);

    return {
      context: protectedContext,
      findings,
      summary,
      redactedCount: findings.length,
      scannedAt: Date.now()
    };
  }

  /**
   * Scans a SanitizedPageContext for metadata findings without making AI requests (Dashboard inspection mode)
   */
  public static scanOnly(context: SanitizedPageContext): {
    findings: PrivacyFinding[];
    summary: PrivacyScanSummary;
    scannedAt: number;
  } {
    const result = this.protect(context);
    return {
      findings: result.findings,
      summary: result.summary,
      scannedAt: result.scannedAt
    };
  }

  /**
   * Aggregates findings into categorized summary counts
   */
  private static buildSummary(findings: PrivacyFinding[]): PrivacyScanSummary {
    let emailCount = 0;
    let phoneCount = 0;
    let creditCardCount = 0;
    let aadhaarCount = 0;
    let apiKeyCount = 0;
    let tokenCount = 0;
    let passwordCount = 0;

    for (const f of findings) {
      switch (f.type) {
        case 'email':
          emailCount++;
          break;
        case 'phone':
          phoneCount++;
          break;
        case 'credit_card':
          creditCardCount++;
          break;
        case 'aadhaar':
          aadhaarCount++;
          break;
        case 'api_key':
          apiKeyCount++;
          break;
        case 'token':
          tokenCount++;
          break;
        case 'password':
          passwordCount++;
          break;
      }
    }

    return {
      emailCount,
      phoneCount,
      creditCardCount,
      aadhaarCount,
      apiKeyCount,
      tokenCount,
      passwordCount,
      totalRedactedCount: findings.length
    };
  }
}
