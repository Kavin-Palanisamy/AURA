/**
 * AURA Message Protocol Definitions
 * Manifest V3 Type-Safe Communication Layer (Day 1 - Day 4)
 */

import type { PageContext } from './page';
import type { AuraAIResponse, SanitizedPageContext } from '../ai/types';

export const AURA_ACTIONS = {
  TEST_CONNECTION: 'AURA_TEST_CONNECTION',
  SHOW_BANNER: 'AURA_SHOW_BANNER',
  ANALYZE_PAGE: 'AURA_ANALYZE_PAGE',
  HIGHLIGHT_ELEMENT: 'AURA_HIGHLIGHT_ELEMENT',
  TOGGLE_ASSISTANT: 'AURA_TOGGLE_ASSISTANT',
  ASK_AI: 'AURA_ASK_AI',
  PING: 'AURA_PING',
} as const;

export type AuraAction = typeof AURA_ACTIONS[keyof typeof AURA_ACTIONS];

export interface TestConnectionPayload {
  source: 'popup';
  triggerTime: number;
}

export interface ShowBannerPayload {
  message: string;
  durationMs?: number;
  badge?: string;
}

export interface AnalyzePagePayload {
  source: 'popup' | 'content';
  requestedAt: number;
}

export interface HighlightElementPayload {
  targetId: string;
  message?: string;
}

export interface ToggleAssistantPayload {
  open?: boolean;
}

export interface AskAIPayload {
  question: string;
  context: SanitizedPageContext;
}

export interface PingPayload {
  timestamp: number;
}

export interface TestConnectionMessage {
  action: typeof AURA_ACTIONS.TEST_CONNECTION;
  payload: TestConnectionPayload;
}

export interface ShowBannerMessage {
  action: typeof AURA_ACTIONS.SHOW_BANNER;
  payload: ShowBannerPayload;
}

export interface AnalyzePageMessage {
  action: typeof AURA_ACTIONS.ANALYZE_PAGE;
  payload?: AnalyzePagePayload;
}

export interface HighlightElementMessage {
  action: typeof AURA_ACTIONS.HIGHLIGHT_ELEMENT;
  payload: HighlightElementPayload;
}

export interface ToggleAssistantMessage {
  action: typeof AURA_ACTIONS.TOGGLE_ASSISTANT;
  payload?: ToggleAssistantPayload;
}

export interface AskAIMessage {
  action: typeof AURA_ACTIONS.ASK_AI;
  payload: AskAIPayload;
}

export interface PingMessage {
  action: typeof AURA_ACTIONS.PING;
  payload?: PingPayload;
}

export type AuraMessage =
  | TestConnectionMessage
  | ShowBannerMessage
  | AnalyzePageMessage
  | HighlightElementMessage
  | ToggleAssistantMessage
  | AskAIMessage
  | PingMessage;

export interface AuraResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface TabInfo {
  tabId?: number;
  url?: string;
  title?: string;
}

export interface TestConnectionResponseData {
  tab: TabInfo;
  serviceWorkerReceivedAt: number;
  contentScriptRenderedAt?: number;
}

export type AnalyzePageResponseData = PageContext;

export interface HighlightElementResponseData {
  targetId: string;
  elementTag: string;
  highlightedAt: number;
}

export type AskAIResponseData = AuraAIResponse;

/**
 * Type guard to check if an object is a valid AuraMessage
 */
export function isAuraMessage(obj: unknown): obj is AuraMessage {
  if (typeof obj !== 'object' || obj === null) return false;
  const msg = obj as Record<string, unknown>;
  return (
    typeof msg.action === 'string' &&
    Object.values(AURA_ACTIONS).includes(msg.action as AuraAction)
  );
}
