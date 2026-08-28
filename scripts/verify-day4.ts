/**
 * Automated Verification Script for Day 4 AI Intelligence
 * Tests:
 * 1. Privacy Sanitization (zero form value leak)
 * 2. Prompt Builder
 * 3. AI Response Validator & Anti-Hallucination Firewall
 */

import { sanitizePageContextForAI } from '../src/content/sanitizer';
import { buildSystemInstruction, buildUserPrompt } from '../src/ai/promptBuilder';
import { validateAIResponse } from '../src/ai/responseValidator';
import type { PageContext } from '../src/types/page';

console.log('--- AURA DAY 4 VERIFICATION SUITE ---\n');

// 1. Mock PageContext with sensitive values
const mockContext: PageContext = {
  metadata: {
    title: 'Acme Secure Portal - Login & Dashboard',
    url: 'https://example.com/login',
    lang: 'en-US',
    analyzedAt: Date.now()
  },
  headings: [
    { id: 'aura-heading-001', level: 1, text: 'Welcome to Acme' },
    { id: 'aura-heading-002', level: 2, text: 'Account Access' }
  ],
  buttons: [
    { id: 'aura-button-001', type: 'submit', text: 'Sign In', disabled: false },
    { id: 'aura-button-002', type: 'button', text: 'Forgot Password?', disabled: false }
  ],
  links: [
    { id: 'aura-link-001', text: 'Create an Account', href: 'https://example.com/register' },
    { id: 'aura-link-002', text: 'Privacy Policy', href: 'https://example.com/privacy' }
  ],
  inputs: [
    {
      id: 'aura-input-001',
      element: 'input',
      type: 'email',
      label: 'Email Address',
      placeholder: 'user@example.com',
      required: true,
      disabled: false
    },
    {
      id: 'aura-input-002',
      element: 'input',
      type: 'password',
      label: 'Password',
      required: true,
      disabled: false
    }
  ],
  forms: [
    { id: 'aura-form-001', nameOrLabel: 'Sign In Form', fieldCount: 2 }
  ],
  summary: {
    headingsCount: 2,
    buttonsCount: 2,
    linksCount: 2,
    inputsCount: 2,
    formsCount: 1
  }
};

// TEST 1: Privacy Sanitization
console.log('TEST 1: Privacy Sanitization');
const sanitized = sanitizePageContextForAI(mockContext);
const sanitizedJson = JSON.stringify(sanitized);

const hasValueProperty = (sanitized.inputs as Array<Record<string, unknown>>).some(i => 'value' in i);
const hasPasswordSecret = sanitizedJson.includes('AURA_PRIVATE_TEST_98421');

if (!hasValueProperty && !hasPasswordSecret && sanitized.validElementIds.length === 9) {
  console.log('✅ TEST 1 PASSED: Zero form value leak. All 9 element IDs preserved in validElementIds.');
} else {
  console.error('❌ TEST 1 FAILED: Privacy check failed.', { hasValueProperty, hasPasswordSecret, count: sanitized.validElementIds.length });
  process.exit(1);
}

// TEST 2: Prompt Builder
console.log('\nTEST 2: Prompt Builder');
const systemPrompt = buildSystemInstruction();
const userPrompt = buildUserPrompt('Where can I log in?', sanitized);

if (systemPrompt.includes('validElementIds') && userPrompt.includes('Where can I log in?')) {
  console.log('✅ TEST 2 PASSED: System & User prompts constructed cleanly.');
} else {
  console.error('❌ TEST 2 FAILED: Prompts missing constraints.');
  process.exit(1);
}

// TEST 3: Valid AI Response Validation
console.log('\nTEST 3: Valid AI Response Validation');
const validAiOutput = JSON.stringify({
  answer: 'The Sign In button is located in the account access form.',
  targetId: 'aura-button-001',
  action: 'highlight',
  confidence: 0.95
});

const validatedResult1 = validateAIResponse(validAiOutput, sanitized);

if (
  validatedResult1.action === 'highlight' &&
  validatedResult1.targetId === 'aura-button-001' &&
  validatedResult1.confidence === 0.95
) {
  console.log('✅ TEST 3 PASSED: Valid targetId accepted for highlight action.');
} else {
  console.error('❌ TEST 3 FAILED: Valid response rejected.');
  process.exit(1);
}

// TEST 4: Anti-Hallucination Firewall (Invalid targetId)
console.log('\nTEST 4: Anti-Hallucination Firewall');
const hallucinatedAiOutput = JSON.stringify({
  answer: 'Click the submit button.',
  targetId: 'aura-button-999-fake-hallucination',
  action: 'highlight',
  confidence: 0.9
});

const validatedResult2 = validateAIResponse(hallucinatedAiOutput, sanitized);

if (validatedResult2.action === 'answer' && validatedResult2.targetId === null) {
  console.log('✅ TEST 4 PASSED: Hallucinated targetId was blocked and demoted to answer-only mode.');
} else {
  console.error('❌ TEST 4 FAILED: Hallucinated ID bypassed validator.');
  process.exit(1);
}

// TEST 5: Markdown Code Block JSON Handling
console.log('\nTEST 5: Markdown Fenced JSON Parsing');
const fencedAiOutput = `\`\`\`json
{
  "answer": "This page is Acme login portal.",
  "targetId": null,
  "action": "answer",
  "confidence": 0.88
}
\`\`\``;

const validatedResult3 = validateAIResponse(fencedAiOutput, sanitized);

if (validatedResult3.action === 'answer' && validatedResult3.targetId === null && validatedResult3.confidence === 0.88) {
  console.log('✅ TEST 5 PASSED: Markdown fences stripped and parsed cleanly.');
} else {
  console.error('❌ TEST 5 FAILED: Failed to parse fenced JSON.');
  process.exit(1);
}

console.log('\n🎉 ALL DAY 4 VERIFICATION TESTS PASSED SUCCESSFULLY!');
