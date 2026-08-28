/**
 * Automated Verification Script for Day 5: Privacy Shield
 * Tests:
 * 1. Email Redaction
 * 2. Phone Number Redaction
 * 3. Credit Card Detection with Luhn Check (Valid & Invalid)
 * 4. Aadhaar-like 12-digit Number Redaction
 * 5. API Key & Token Redaction
 * 6. Immutability of Original Context
 * 7. Privacy Shield End-to-End Protection Pipeline
 */

import { scanTextForSensitiveData, luhnCheck } from '../src/privacy/scanner';
import { redactString } from '../src/privacy/redactor';
import { PrivacyShield } from '../src/privacy/privacyShield';
import type { SanitizedPageContext } from '../src/ai/types';

console.log('--- AURA DAY 5 PRIVACY SHIELD VERIFICATION SUITE ---\n');

// TEST 1: Email Redaction
console.log('TEST 1: Email Detection & Redaction');
const emailInput = 'Please contact our support team at support.desk@example.com for help.';
const emailRes = redactString(emailInput, 'test.email');

if (
  emailRes.redactedText.includes('[EMAIL_REDACTED]') &&
  !emailRes.redactedText.includes('support.desk@example.com') &&
  emailRes.findings.length === 1 &&
  emailRes.findings[0].type === 'email'
) {
  console.log('✅ TEST 1 PASSED: Email successfully detected and redacted as [EMAIL_REDACTED].');
} else {
  console.error('❌ TEST 1 FAILED: Email redaction failed.', emailRes);
  process.exit(1);
}

// TEST 2: Phone Number Redaction
console.log('\nTEST 2: Phone Number Detection & Redaction');
const phoneInput = 'Call our helpdesk at +91 98765 43210 or +1 (555) 123-4567.';
const phoneRes = redactString(phoneInput, 'test.phone');

if (
  phoneRes.redactedText.includes('[PHONE_REDACTED]') &&
  !phoneRes.redactedText.includes('98765 43210') &&
  phoneRes.findings.filter(f => f.type === 'phone').length >= 1
) {
  console.log('✅ TEST 2 PASSED: Phone numbers detected and redacted as [PHONE_REDACTED].');
} else {
  console.error('❌ TEST 2 FAILED: Phone redaction failed.', phoneRes);
  process.exit(1);
}

// TEST 3: Credit Card & Luhn Check
console.log('\nTEST 3: Credit Card Detection with Luhn Check');
const validCard = '4111 1111 1111 1111'; // Valid Visa test card (passes Luhn)
const invalidCard = '4111 1111 1111 1112'; // Invalid checksum (fails Luhn)

const isLuhnValid = luhnCheck(validCard);
const isLuhnInvalid = luhnCheck(invalidCard);

const validCardRes = redactString(`Payment with card ${validCard}`, 'test.card');
const invalidCardRes = redactString(`Random serial ${invalidCard}`, 'test.serial');

if (
  isLuhnValid === true &&
  isLuhnInvalid === false &&
  validCardRes.redactedText.includes('[CARD_REDACTED]') &&
  !validCardRes.redactedText.includes('4111 1111 1111 1111') &&
  !invalidCardRes.redactedText.includes('[CARD_REDACTED]')
) {
  console.log('✅ TEST 3 PASSED: Valid card passed Luhn and was redacted as [CARD_REDACTED]. Invalid card correctly skipped.');
} else {
  console.error('❌ TEST 3 FAILED: Luhn algorithm check failed.', { isLuhnValid, isLuhnInvalid, validCardRes });
  process.exit(1);
}

// TEST 4: Aadhaar-like 12-digit Number Detection
console.log('\nTEST 4: Aadhaar-like 12-digit Number Detection');
const aadhaarInput = 'Verify user with ID 2345 6789 0123 on registration.';
const aadhaarRes = redactString(aadhaarInput, 'test.aadhaar');

if (
  aadhaarRes.redactedText.includes('[AADHAAR_REDACTED]') &&
  !aadhaarRes.redactedText.includes('2345 6789 0123') &&
  aadhaarRes.findings[0].type === 'aadhaar'
) {
  console.log('✅ TEST 4 PASSED: 12-digit pattern redacted as [AADHAAR_REDACTED].');
} else {
  console.error('❌ TEST 4 FAILED: Aadhaar detection failed.', aadhaarRes);
  process.exit(1);
}

// TEST 5: API Key & Token Detection
console.log('\nTEST 5: API Key & Credential Token Detection');
const apiKeyInput = 'Using key AIzaSyD-1234567890abcdefghijklmnopqrstuv and token ghp_1234567890abcdefghijklmnopqrstuvwxyz12';
const apiRes = redactString(apiKeyInput, 'test.keys');

if (
  apiRes.redactedText.includes('[API_KEY_REDACTED]') &&
  apiRes.redactedText.includes('[TOKEN_REDACTED]') &&
  !apiRes.redactedText.includes('AIzaSyD') &&
  !apiRes.redactedText.includes('ghp_')
) {
  console.log('✅ TEST 5 PASSED: Credentials detected and redacted as [API_KEY_REDACTED] and [TOKEN_REDACTED].');
} else {
  console.error('❌ TEST 5 FAILED: API key detection failed.', apiRes);
  process.exit(1);
}

// TEST 6: Immutability Guarantee of PageContext
console.log('\nTEST 6: Immutability of Original Context');
const originalContext: SanitizedPageContext = {
  title: 'Contact John at john.doe@example.com',
  url: 'https://example.com/contact',
  lang: 'en',
  headings: [
    { id: 'aura-heading-001', level: 1, text: 'Call Us at +91 98765 43210' }
  ],
  buttons: [
    { id: 'aura-button-001', type: 'submit', text: 'Pay with 4111 1111 1111 1111', disabled: false }
  ],
  links: [
    { id: 'aura-link-001', text: 'Email support@example.com', href: 'mailto:support@example.com' }
  ],
  inputs: [
    { id: 'aura-input-001', element: 'input', type: 'text', label: 'Aadhaar: 2345 6789 0123', placeholder: 'e.g. 2345 6789 0123', required: true, disabled: false }
  ],
  forms: [
    { id: 'aura-form-001', nameOrLabel: 'Payment Form', fieldCount: 1 }
  ],
  validElementIds: ['aura-heading-001', 'aura-button-001', 'aura-link-001', 'aura-input-001', 'aura-form-001']
};

const originalSnapshot = JSON.stringify(originalContext);
const protectedResult = PrivacyShield.protect(originalContext);
const afterSnapshot = JSON.stringify(originalContext);

if (originalSnapshot === afterSnapshot) {
  console.log('✅ TEST 6 PASSED: Original context is strictly immutable and was not modified.');
} else {
  console.error('❌ TEST 6 FAILED: Original context was mutated by PrivacyShield.');
  process.exit(1);
}

// TEST 7: Protected Context Summary & Redaction Integrity
console.log('\nTEST 7: Privacy Shield Aggregated Summary & AI Firewall');
const protectedContext = protectedResult.context;
const summary = protectedResult.summary;

if (
  summary.emailCount === 3 &&
  summary.phoneCount === 1 &&
  summary.creditCardCount === 1 &&
  summary.aadhaarCount === 2 &&
  summary.totalRedactedCount === 7 &&
  protectedContext.title.includes('[EMAIL_REDACTED]') &&
  protectedContext.headings[0].text.includes('[PHONE_REDACTED]') &&
  protectedContext.buttons[0].text.includes('[CARD_REDACTED]') &&
  protectedContext.inputs[0].label?.includes('[AADHAAR_REDACTED]') &&
  protectedContext.links[0].href === 'mailto:[EMAIL_REDACTED]'
) {
  console.log('✅ TEST 7 PASSED: All 7 sensitive fields (including mailto: href) cleanly redacted. Privacy Shield summary counts verified.');
} else {
  console.error('❌ TEST 7 FAILED: Redaction integrity check failed.', { summary, protectedContext });
  process.exit(1);
}

console.log('\n🎉 ALL DAY 5 PRIVACY SHIELD VERIFICATION TESTS PASSED SUCCESSFULLY!');
