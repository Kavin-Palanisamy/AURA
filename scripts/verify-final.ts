/**
 * AURA Master Regression Verification Suite (Day 6: Final Release Readiness)
 *
 * Verifies core functionality and contracts from all modules:
 * - DAY 1: Manifest V3 message contracts and type guards
 * - DAY 2: PageContext schema and in-memory Element Registry
 * - DAY 3: Element highlighting target lookup safety
 * - DAY 4: AI prompt builder, response validator, anti-hallucination firewall
 * - DAY 5: Privacy Shield (Email, Phone, Luhn-checked Card, Aadhaar, API Keys, Tokens, Immutability)
 * - INTEGRATION: Full end-to-end sanitized & redacted AI transmission pipeline
 */

import { AURA_ACTIONS, isAuraMessage } from '../src/types/messages';
import { AuraElementRegistry } from '../src/content/elementRegistry';
import { buildSystemInstruction, buildUserPrompt } from '../src/ai/promptBuilder';
import { validateAIResponse } from '../src/ai/responseValidator';
import { sanitizePageContextForAI } from '../src/ai/sanitizer';
import { scanTextForSensitiveData, luhnCheck } from '../src/privacy/scanner';
import { redactString } from '../src/privacy/redactor';
import { PrivacyShield } from '../src/privacy/privacyShield';
import { DEFAULT_GEMINI_MODEL, GEMINI_FALLBACK_CHAIN } from '../src/ai/types';
import type { PageContext } from '../src/types/page';

console.log('====================================================');
console.log('🌟 AURA MASTER QUALITY ASSURANCE & REGRESSION SUITE');
console.log('====================================================\n');

// ----------------------------------------------------
// SECTION 1: DAY 1 MESSAGE PROTOCOL CONTRACTS
// ----------------------------------------------------
console.log('--- SECTION 1: DAY 1 MESSAGE PROTOCOLS ---');
const validTestMsg = {
  action: AURA_ACTIONS.TEST_CONNECTION,
  payload: { source: 'popup', triggerTime: Date.now() }
};
const invalidMsg = { action: 'UNKNOWN_ACTION', payload: {} };

if (
  isAuraMessage(validTestMsg) === true &&
  isAuraMessage(invalidMsg) === false &&
  AURA_ACTIONS.TEST_CONNECTION === 'AURA_TEST_CONNECTION' &&
  AURA_ACTIONS.ANALYZE_PAGE === 'AURA_ANALYZE_PAGE' &&
  AURA_ACTIONS.HIGHLIGHT_ELEMENT === 'AURA_HIGHLIGHT_ELEMENT' &&
  AURA_ACTIONS.ASK_AI === 'AURA_ASK_AI' &&
  AURA_ACTIONS.SCAN_PRIVACY === 'AURA_SCAN_PRIVACY'
) {
  console.log('✅ Section 1 Passed: MV3 Message actions and type guards verified.');
} else {
  console.error('❌ Section 1 Failed: Message protocol violation.');
  process.exit(1);
}

// ----------------------------------------------------
// SECTION 2: DAY 2 PAGE INTELLIGENCE & ELEMENT REGISTRY
// ----------------------------------------------------
console.log('\n--- SECTION 2: DAY 2 PAGE INTELLIGENCE & REGISTRY ---');
const registry = new AuraElementRegistry();

// Create mock DOM elements using plain object stubs for Node environment
const mockButton = { tagName: 'BUTTON', textContent: 'Submit Form' } as unknown as Element;
const mockHeading = { tagName: 'H1', textContent: 'Welcome' } as unknown as Element;

const btnId = registry.register(mockButton, 'button');
const headingId = registry.register(mockHeading, 'heading');

const retrievedBtn = registry.getElement(btnId);
const retrievedId = registry.getId(mockButton);

if (
  btnId === 'aura-button-001' &&
  headingId === 'aura-heading-001' &&
  retrievedBtn === mockButton &&
  retrievedId === 'aura-button-001' &&
  registry.size() === 2
) {
  registry.reset();
  if (registry.size() === 0) {
    console.log('✅ Section 2 Passed: Runtime Element Registry mappings & reset verified.');
  } else {
    console.error('❌ Section 2 Failed: Registry reset did not clear entries.');
    process.exit(1);
  }
} else {
  console.error('❌ Section 2 Failed: Registry mapping failed.');
  process.exit(1);
}

// ----------------------------------------------------
// SECTION 3: DAY 3 HIGHLIGHTING TARGET VALIDATION
// ----------------------------------------------------
console.log('\n--- SECTION 3: DAY 3 HIGHLIGHTING TARGET LOOKUP ---');
const reg2 = new AuraElementRegistry();
const targetEl = { tagName: 'BUTTON' } as unknown as Element;
const validId = reg2.register(targetEl, 'button');

const lookupFound = reg2.getElement(validId);
const lookupMissing = reg2.getElement('aura-button-999');

if (lookupFound === targetEl && lookupMissing === undefined) {
  console.log('✅ Section 3 Passed: Target element lookup and missing ID safety verified.');
} else {
  console.error('❌ Section 3 Failed: Highlighting lookup safety failed.');
  process.exit(1);
}

// ----------------------------------------------------
// SECTION 4: DAY 4 AI INTELLIGENCE & FIREWALL
// ----------------------------------------------------
console.log('\n--- SECTION 4: DAY 4 AI INTELLIGENCE & ANTI-HALLUCINATION ---');
const mockPageContext: PageContext = {
  metadata: {
    title: 'Acme Portal - Account Dashboard',
    url: 'https://example.com/account',
    lang: 'en',
    analyzedAt: Date.now()
  },
  headings: [{ id: 'aura-heading-001', level: 1, text: 'Account Settings' }],
  buttons: [{ id: 'aura-button-001', type: 'submit', text: 'Update Profile', disabled: false }],
  links: [{ id: 'aura-link-001', text: 'Privacy Terms', href: 'https://example.com/privacy' }],
  inputs: [{ id: 'aura-input-001', element: 'input', type: 'text', label: 'Display Name', required: true, disabled: false }],
  forms: [{ id: 'aura-form-001', nameOrLabel: 'Profile Form', fieldCount: 1 }],
  summary: { headingsCount: 1, buttonsCount: 1, linksCount: 1, inputsCount: 1, formsCount: 1 }
};

const sanitized = sanitizePageContextForAI(mockPageContext);

// A. Test Prompt Builder
const sysInstruction = buildSystemInstruction();
const userPrompt = buildUserPrompt('Where do I update profile?', sanitized);

if (sysInstruction.length > 50 && userPrompt.includes('Acme Portal') && userPrompt.includes('aura-button-001')) {
  console.log('  ✓ Prompt Builder constructed valid instructions and context.');
} else {
  console.error('❌ Section 4 Failed: Prompt builder output invalid.');
  process.exit(1);
}

// B. Test Valid AI Response with Existing ID
const validAiResponse = JSON.stringify({
  answer: 'Click the Update Profile button to save changes.',
  targetId: 'aura-button-001',
  action: 'highlight',
  confidence: 0.95
});
const validatedSuccess = validateAIResponse(validAiResponse, sanitized);

// C. Test Hallucinated AI Response with Non-Existent ID
const hallucinatedAiResponse = JSON.stringify({
  answer: 'Click the nonexistent button.',
  targetId: 'aura-button-999-hallucinated',
  action: 'highlight',
  confidence: 0.9
});
const validatedDemoted = validateAIResponse(hallucinatedAiResponse, sanitized);

// D. Test Gemini 2.5 Model Configuration
const isModelConfigValid =
  DEFAULT_GEMINI_MODEL === 'gemini-2.5-flash' &&
  GEMINI_FALLBACK_CHAIN.includes('gemini-2.5-flash') &&
  GEMINI_FALLBACK_CHAIN.includes('gemini-2.5-flash-lite') &&
  GEMINI_FALLBACK_CHAIN.includes('gemini-2.5-pro');

if (
  validatedSuccess.action === 'highlight' &&
  validatedSuccess.targetId === 'aura-button-001' &&
  validatedDemoted.action === 'answer' &&
  validatedDemoted.targetId === null &&
  isModelConfigValid
) {
  console.log('✅ Section 4 Passed: AI response validation, anti-hallucination firewall, and Gemini 2.5 chain verified.');
} else {
  console.error('❌ Section 4 Failed: AI validation or model configuration failed.');
  process.exit(1);
}

// ----------------------------------------------------
// SECTION 5: DAY 5 PRIVACY SHIELD & SENSITIVE DATA
// ----------------------------------------------------
console.log('\n--- SECTION 5: DAY 5 PRIVACY SHIELD ---');

// A. Email
const emailRes = redactString('Contact support@example.com for queries', 'test.email');
// B. Phone
const phoneRes = redactString('Call +91 98765 43210 or +1 555 123 4567', 'test.phone');
// C. Luhn Credit Card (Valid & Invalid Checksum)
const validCardNum = '4111 1111 1111 1111';
const invalidCardNum = '4111 1111 1111 1112';
const cardValid = luhnCheck(validCardNum);
const cardInvalid = luhnCheck(invalidCardNum);
const cardRes = redactString(`Payment: ${validCardNum}`, 'test.card');
// D. Aadhaar-like 12-digit number
const aadhaarRes = redactString('ID: 2345 6789 0123', 'test.aadhaar');
// E. API Key & Token
const apiRes = redactString('API: AIzaSyD-1234567890abcdefghijklmnopqrstuv and ghp_1234567890abcdefghijklmnopqrstuvwxyz12', 'test.api');

if (
  emailRes.redactedText.includes('[EMAIL_REDACTED]') &&
  phoneRes.redactedText.includes('[PHONE_REDACTED]') &&
  cardValid === true &&
  cardInvalid === false &&
  cardRes.redactedText.includes('[CARD_REDACTED]') &&
  aadhaarRes.redactedText.includes('[AADHAAR_REDACTED]') &&
  apiRes.redactedText.includes('[API_KEY_REDACTED]') &&
  apiRes.redactedText.includes('[TOKEN_REDACTED]')
) {
  console.log('  ✓ Local scanner & redactor correctly handles emails, phones, Luhn cards, Aadhaar, and API credentials.');
} else {
  console.error('❌ Section 5 Failed: Redaction rules check failed.');
  process.exit(1);
}

// ----------------------------------------------------
// SECTION 6: FULL END-TO-END INTEGRATION PIPELINE
// ----------------------------------------------------
console.log('\n--- SECTION 6: FULL END-TO-END AI PIPELINE ---');

// Mock context with sensitive data in structured fields
const sensitiveContext: PageContext = {
  metadata: {
    title: 'Welcome John Doe (john.doe@example.com)',
    url: 'https://example.com/checkout',
    lang: 'en',
    analyzedAt: Date.now()
  },
  headings: [
    { id: 'aura-heading-001', level: 1, text: 'Billing Support: +91 98765 43210' }
  ],
  buttons: [
    { id: 'aura-button-001', type: 'submit', text: 'Pay with Card 4111 1111 1111 1111', disabled: false }
  ],
  links: [
    { id: 'aura-link-001', text: 'Mail Billing: billing@example.com', href: 'mailto:billing@example.com' }
  ],
  inputs: [
    { id: 'aura-input-001', element: 'input', type: 'text', label: 'Aadhaar 2345 6789 0123', placeholder: 'Enter 2345 6789 0123', required: true, disabled: false }
  ],
  forms: [
    { id: 'aura-form-001', nameOrLabel: 'Payment Form', fieldCount: 1 }
  ],
  summary: { headingsCount: 1, buttonsCount: 1, linksCount: 1, inputsCount: 1, formsCount: 1 }
};

// 1. Sanitization
const sanitizedContext = sanitizePageContextForAI(sensitiveContext);

// 2. Privacy Shield Protection (Immutability check)
const originalJsonBefore = JSON.stringify(sanitizedContext);
const protectedResult = PrivacyShield.protect(sanitizedContext);
const originalJsonAfter = JSON.stringify(sanitizedContext);

if (originalJsonBefore !== originalJsonAfter) {
  console.error('❌ Section 6 Failed: Privacy Shield mutated the original context.');
  process.exit(1);
}

// 3. Verify Redacted AI Context Content
const protectedCtx = protectedResult.context;
const aiUserPrompt = buildUserPrompt('Help me complete payment', protectedCtx);

// Check that NO sensitive values leaked into AI prompt string
const leaks = [
  'john.doe@example.com',
  'billing@example.com',
  '98765 43210',
  '4111 1111 1111 1111',
  '2345 6789 0123'
].filter(secret => aiUserPrompt.includes(secret));

if (leaks.length === 0 && protectedResult.summary.totalRedactedCount === 7) {
  console.log('✅ Section 6 Passed: Complete AI pipeline verified. Zero sensitive data reached the AI prompt.');
} else {
  console.error('❌ Section 6 Failed: Sensitive data leaked into AI prompt.', leaks);
  process.exit(1);
}

console.log('\n====================================================');
console.log('🎉 ALL REGRESSION & INTEGRATION TESTS PASSED (100%)');
console.log('====================================================');
