/// <reference types="vite/client" />
/**
 * AURA Environment Configuration Abstraction
 *
 * Centralized, safe access to Vite build-time environment variables.
 * Privacy & Security Rule:
 * - Never log, expose, or print raw API keys in UI, logs, or reports.
 */

/**
 * Safely retrieves the Gemini API key configured at build time
 */
export function getGeminiApiKey(): string | null {
  try {
    // 1. Check Vite environment variable
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
    if (metaEnv?.VITE_GEMINI_API_KEY) {
      const key = String(metaEnv.VITE_GEMINI_API_KEY).trim();
      return key.length > 0 ? key : null;
    }
  } catch {
    // Fallback if import.meta is unavailable
  }

  try {
    // 2. Check Node / Test runner environment
    if (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) {
      const key = String(process.env.VITE_GEMINI_API_KEY).trim();
      return key.length > 0 ? key : null;
    }
  } catch {
    // Fallback
  }

  return null;
}

/**
 * Checks whether the Gemini API key is configured without exposing the value
 */
export function isGeminiConfigured(): boolean {
  const key = getGeminiApiKey();
  return key !== null && key.length > 0;
}
