/**
 * AURA Gemini AI Provider (Day 4 - Day 6 Environment Architecture)
 *
 * Implements AIProvider interface using Google Gemini REST API.
 * - Automatically loads API key from Vite environment configuration (src/config/env.ts).
 * - Targeted Gemini 2.5 architecture:
 *   1. User-selected model (e.g., gemini-2.5-flash)
 *   2. Fallback chain (gemini-2.5-flash -> gemini-2.5-flash-lite -> gemini-2.5-pro)
 *   3. Dynamic account model discovery via /v1beta/models?key=... if 404 occurs
 */

import type { AIProvider, AuraAIRequest, AuraAIResponse, GeminiModel } from './types';
import { DEFAULT_GEMINI_MODEL, GEMINI_FALLBACK_CHAIN } from './types';
import { buildSystemInstruction, buildUserPrompt } from './promptBuilder';
import { validateAIResponse } from './responseValidator';
import { getGeminiApiKey } from '../config/env';

/**
 * Dynamically retrieves the active list of models supporting generateContent for an API key
 */
export async function fetchAvailableGeminiModels(apiKey?: string): Promise<string[]> {
  const resolvedKey = (apiKey && apiKey.trim()) || getGeminiApiKey();
  if (!resolvedKey) return [];
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${resolvedKey.trim()}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) return [];
    const data = await res.json();
    const list = (data.models as Array<{ name?: string; supportedGenerationMethods?: string[] }>) || [];
    return list
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => (m.name || '').replace(/^models\//, ''))
      .filter(Boolean);
  } catch {
    return [];
  }
}

export class GeminiProvider implements AIProvider {
  public name = 'Google Gemini';
  private preferredModel: GeminiModel | string = DEFAULT_GEMINI_MODEL;

  constructor(customModel?: GeminiModel | string) {
    if (customModel && customModel.trim()) {
      this.preferredModel = customModel.trim();
    }
  }

  public async ask(request: AuraAIRequest, apiKey?: string): Promise<AuraAIResponse> {
    const resolvedKey = (apiKey && apiKey.trim()) || getGeminiApiKey();

    if (!resolvedKey) {
      throw new Error('Gemini AI is not configured. Add VITE_GEMINI_API_KEY to .env.local and rebuild AURA.');
    }

    const trimmedKey = resolvedKey.trim();
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

    // User-selected model is prioritized first, followed by default fallback chain
    const modelsToTry: string[] = [
      this.preferredModel,
      ...GEMINI_FALLBACK_CHAIN.filter(m => m !== this.preferredModel)
    ];

    let lastErrorType: 'AUTH' | 'RATE_LIMIT' | 'MODEL_404' | 'NETWORK' | 'INVALID_RESPONSE' | 'UNKNOWN' = 'UNKNOWN';
    let lastErrorMessage = '';
    const triedSet = new Set<string>();

    for (const model of modelsToTry) {
      if (triedSet.has(model)) continue;
      triedSet.add(model);

      try {
        const result = await this.tryGenerate(model, trimmedKey, payload, request.context);
        return result;
      } catch (err: unknown) {
        const error = err as { type?: string; message?: string; status?: number };
        if (error.type === 'NETWORK' || error.type === 'AUTH' || error.type === 'RATE_LIMIT') {
          throw new Error(error.message || 'Gemini API Error');
        }
        if (error.type === 'MODEL_404') {
          lastErrorType = 'MODEL_404';
          lastErrorMessage = error.message || `Model ${model} unavailable.`;
          continue;
        }
        lastErrorMessage = error.message || 'Unknown generation failure.';
      }
    }

    // If static chain candidates returned 404, dynamically query the user's available models
    if (lastErrorType === 'MODEL_404') {
      console.log('[AURA Gemini Provider] Static models returned 404. Discovering account-enabled models...');
      const discovered = await fetchAvailableGeminiModels(trimmedKey);

      // Sort discovered models (prefer flash models first)
      const sortedDiscovered = discovered.filter(m => !triedSet.has(m)).sort((a, b) => {
        const aFlash = a.includes('flash') ? 1 : 0;
        const bFlash = b.includes('flash') ? 1 : 0;
        return bFlash - aFlash;
      });

      for (const model of sortedDiscovered) {
        triedSet.add(model);
        try {
          console.log(`[AURA Gemini Provider] Attempting discovered model: "${model}"...`);
          const result = await this.tryGenerate(model, trimmedKey, payload, request.context);
          return result;
        } catch {
          // Continue trying next discovered model
        }
      }

      const availableNames = discovered.length > 0 ? ` Available models for your key: [${discovered.slice(0, 4).join(', ')}]` : '';
      throw new Error(`The requested Gemini model is not enabled for your API key.${availableNames} Please select an active model in AURA Settings.`);
    }

    throw new Error(lastErrorMessage || 'Failed to generate AI guidance. Please check your configuration.');
  }

  private async tryGenerate(
    model: string,
    apiKey: string,
    payload: Record<string, unknown>,
    context: Parameters<typeof validateAIResponse>[1]
  ): Promise<AuraAIResponse> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
      const msg = fetchErr instanceof Error ? fetchErr.message : 'Connection failed';
      throw {
        type: 'NETWORK',
        message: `Network error: Unable to reach Google Gemini API (${msg}). Please check your internet connection.`
      };
    }

    if (response.ok) {
      let data: Record<string, unknown>;
      try {
        data = await response.json();
      } catch {
        throw {
          type: 'INVALID_RESPONSE',
          message: 'Gemini returned an invalid JSON response format. Please rephrase your question.'
        };
      }

      const candidates = data?.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
      const candidateText = candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText || typeof candidateText !== 'string') {
        throw {
          type: 'INVALID_RESPONSE',
          message: 'Gemini returned an empty response. Please rephrase your question.'
        };
      }

      return validateAIResponse(candidateText, context);
    }

    let errorDetail = '';
    let errorCode = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson?.error?.message || response.statusText;
      errorCode = errorJson?.error?.status || '';
    } catch {
      errorDetail = response.statusText;
    }

    if (
      response.status === 401 ||
      response.status === 403 ||
      (response.status === 400 && (errorDetail.toLowerCase().includes('key') || errorCode === 'INVALID_ARGUMENT'))
    ) {
      throw {
        type: 'AUTH',
        message: 'Gemini AI configuration was rejected by the provider. Check your local API key in .env.local and rebuild AURA.'
      };
    }

    if (response.status === 429 || errorCode === 'RESOURCE_EXHAUSTED') {
      throw {
        type: 'RATE_LIMIT',
        message: 'Gemini API rate limit exceeded (Quota or QPS reached). Please wait a moment before asking again.'
      };
    }

    if (response.status === 404) {
      throw {
        type: 'MODEL_404',
        message: `Gemini model "${model}" is not available.`
      };
    }

    throw {
      type: 'UNKNOWN',
      message: `Gemini API Error (${response.status}): ${errorDetail}`
    };
  }
}
