/**
 * AURA Gemini AI Provider (Day 4: AI Intelligence)
 *
 * Implements AIProvider interface using Google Gemini REST API.
 * Features targeted Gemini 2.5 architecture:
 * gemini-2.5-flash -> gemini-2.5-flash-lite -> gemini-2.5-pro
 */

import type { AIProvider, AuraAIRequest, AuraAIResponse, GeminiModel } from './types';
import { DEFAULT_GEMINI_MODEL, GEMINI_FALLBACK_CHAIN } from './types';
import { buildSystemInstruction, buildUserPrompt } from './promptBuilder';
import { validateAIResponse } from './responseValidator';

export class GeminiProvider implements AIProvider {
  public name = 'Google Gemini';
  private preferredModel: GeminiModel | string = DEFAULT_GEMINI_MODEL;

  constructor(customModel?: GeminiModel | string) {
    if (customModel && customModel.trim()) {
      this.preferredModel = customModel.trim();
    }
  }

  public async ask(request: AuraAIRequest, apiKey: string): Promise<AuraAIResponse> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('Connect your Gemini API key in AURA Settings to enable AI guidance.');
    }

    const trimmedKey = apiKey.trim();
    const systemText = buildSystemInstruction();
    const userText = buildUserPrompt(request.question, request.context);

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userText }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemText }]
      },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    };

    // User-selected model is prioritized first; fallback only if unavailable
    const modelsToTry: string[] = [
      this.preferredModel,
      ...GEMINI_FALLBACK_CHAIN.filter(m => m !== this.preferredModel)
    ];

    let lastErrorType: 'AUTH' | 'RATE_LIMIT' | 'MODEL_404' | 'NETWORK' | 'INVALID_RESPONSE' | 'UNKNOWN' = 'UNKNOWN';
    let lastErrorMessage = '';

    for (const model of modelsToTry) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmedKey}`;

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (fetchErr) {
        lastErrorType = 'NETWORK';
        const msg = fetchErr instanceof Error ? fetchErr.message : 'Connection failed';
        lastErrorMessage = `Network error: Unable to reach Google Gemini API (${msg}). Please check your internet connection.`;
        // Network failures affect all endpoints, abort fallback loop immediately
        throw new Error(lastErrorMessage);
      }

      if (response.ok) {
        let data: Record<string, unknown>;
        try {
          data = await response.json();
        } catch {
          lastErrorType = 'INVALID_RESPONSE';
          throw new Error('Gemini returned an invalid JSON response format. Please rephrase your question.');
        }

        const candidates = data?.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
        const candidateText = candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText || typeof candidateText !== 'string') {
          lastErrorType = 'INVALID_RESPONSE';
          throw new Error('Gemini returned an empty response. Please rephrase your question.');
        }

        // Validate and sanitize AI response
        return validateAIResponse(candidateText, request.context);
      }

      // Parse error details
      let errorDetail = '';
      let errorCode = '';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson?.error?.message || response.statusText;
        errorCode = errorJson?.error?.status || '';
      } catch {
        errorDetail = response.statusText;
      }

      // Distinguish 1: Authentication / Invalid Key (400, 401, 403)
      if (
        response.status === 401 ||
        response.status === 403 ||
        (response.status === 400 && (errorDetail.toLowerCase().includes('key') || errorCode === 'INVALID_ARGUMENT'))
      ) {
        lastErrorType = 'AUTH';
        throw new Error(`Invalid Gemini API Key: ${errorDetail}. Please verify your key in AURA Settings.`);
      }

      // Distinguish 2: Rate Limit / Quota Exceeded (429, RESOURCE_EXHAUSTED)
      if (response.status === 429 || errorCode === 'RESOURCE_EXHAUSTED') {
        lastErrorType = 'RATE_LIMIT';
        throw new Error('Gemini API rate limit exceeded (Quota or QPS reached). Please wait a moment before asking again.');
      }

      // Distinguish 3: Model Unavailable / Not Found (404)
      if (response.status === 404) {
        lastErrorType = 'MODEL_404';
        console.warn(`[AURA Gemini Provider] Model "${model}" returned 404 (${errorDetail}). Trying next fallback candidate in chain...`);
        lastErrorMessage = `Gemini model "${model}" is not available for this account/region (${errorDetail}).`;
        continue; // Try next fallback candidate
      }

      // Other API errors
      lastErrorType = 'UNKNOWN';
      lastErrorMessage = `Gemini API Error (${response.status}): ${errorDetail}`;
    }

    if (lastErrorType === 'MODEL_404') {
      throw new Error('All configured Gemini models (gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.5-pro) were unavailable. Please verify your Google AI Studio access.');
    }

    throw new Error(lastErrorMessage || 'Failed to generate AI guidance. Please verify your settings.');
  }
}
