/**
 * AURA Gemini AI Provider (Day 4: AI Intelligence)
 *
 * Implements AIProvider interface using Google Gemini REST API.
 * Features automatic resilient fallback across supported Gemini models:
 * gemini-1.5-flash -> gemini-2.0-flash -> gemini-1.5-pro
 */

import type { AIProvider, AuraAIRequest, AuraAIResponse } from './types';
import { buildSystemInstruction, buildUserPrompt } from './promptBuilder';
import { validateAIResponse } from './responseValidator';

const CANDIDATE_MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

export class GeminiProvider implements AIProvider {
  public name = 'Google Gemini';
  private preferredModel: string = 'gemini-1.5-flash';

  constructor(customModel?: string) {
    if (customModel) {
      this.preferredModel = customModel;
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

    // Prepare list of models to try: preferred first, then fallbacks
    const modelsToTry = [
      this.preferredModel,
      ...CANDIDATE_MODELS.filter(m => m !== this.preferredModel)
    ];

    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmedKey}`;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          const candidate = data?.candidates?.[0];
          const candidateText = candidate?.content?.parts?.[0]?.text;

          if (!candidateText || typeof candidateText !== 'string') {
            throw new Error('Gemini returned an empty response. Please rephrase your question.');
          }

          // Validate and sanitize AI response
          return validateAIResponse(candidateText, request.context);
        }

        let errorDetail = '';
        try {
          const errorJson = await response.json();
          errorDetail = errorJson?.error?.message || response.statusText;
        } catch {
          errorDetail = response.statusText;
        }

        // If 404 (model not found / deprecated for this API key), try next model in fallback list
        if (response.status === 404) {
          console.warn(`[AURA Gemini Provider] Model "${model}" returned 404 (${errorDetail}). Trying fallback model...`);
          lastError = new Error(`Model ${model} unavailable: ${errorDetail}`);
          continue;
        }

        if (response.status === 400 || response.status === 403) {
          throw new Error(`Gemini API Authentication Error: ${errorDetail}. Please verify your API key in AURA Settings.`);
        }

        if (response.status === 429) {
          throw new Error('Gemini API rate limit exceeded. Please wait a moment and try again.');
        }

        throw new Error(`Gemini API Error (${response.status}): ${errorDetail}`);
      } catch (fetchErr) {
        if (fetchErr instanceof Error && (fetchErr.message.includes('Authentication Error') || fetchErr.message.includes('rate limit'))) {
          throw fetchErr;
        }
        lastError = fetchErr instanceof Error ? fetchErr : new Error(String(fetchErr));
      }
    }

    throw lastError || new Error('Failed to connect to Gemini API. Please check your network and API key.');
  }
}
