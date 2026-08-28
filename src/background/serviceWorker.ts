import {
  AURA_ACTIONS,
  AuraMessage,
  AuraResponse,
  isAuraMessage,
  ShowBannerMessage,
  AnalyzePageMessage,
  HighlightElementMessage,
  ToggleAssistantMessage,
  TestConnectionResponseData,
  AnalyzePageResponseData,
  HighlightElementResponseData
} from '../types/messages';
import type { PageContext } from '../types/page';

console.log('[AURA Background] Service Worker initialized.');

/**
 * Handle incoming runtime messages from popup and other extension components
 */
chrome.runtime.onMessage.addListener(
  (
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: AuraResponse<unknown>) => void
  ) => {
    console.log('[AURA Background] Received message from:', sender.id || 'popup/internal', message);

    if (!isAuraMessage(message)) {
      sendResponse({
        success: false,
        error: 'Invalid or unknown message format received',
        timestamp: Date.now()
      });
      return false;
    }

    // 1. Day 1 Test Connection
    if (message.action === AURA_ACTIONS.TEST_CONNECTION) {
      handleTestConnection(sendResponse as (res: AuraResponse<TestConnectionResponseData>) => void);
      return true;
    }

    // 2. Day 2 Page Intelligence Analysis
    if (message.action === AURA_ACTIONS.ANALYZE_PAGE) {
      handleAnalyzePage(sendResponse as (res: AuraResponse<AnalyzePageResponseData>) => void);
      return true;
    }

    // 3. Day 3 Highlight Element
    if (message.action === AURA_ACTIONS.HIGHLIGHT_ELEMENT) {
      handleHighlightElement(
        message as HighlightElementMessage,
        sendResponse as (res: AuraResponse<HighlightElementResponseData>) => void
      );
      return true;
    }

    // 4. Day 3 Toggle In-Page Assistant
    if (message.action === AURA_ACTIONS.TOGGLE_ASSISTANT) {
      handleToggleAssistant(
        message as ToggleAssistantMessage,
        sendResponse
      );
      return true;
    }

    // 5. Health Check
    if (message.action === AURA_ACTIONS.PING) {
      sendResponse({
        success: true,
        message: 'Service Worker is active and healthy',
        timestamp: Date.now()
      });
      return false;
    }

    return false;
  }
);

/**
 * Routes element highlight request to the active tab
 */
async function handleHighlightElement(
  message: HighlightElementMessage,
  sendResponse: (response: AuraResponse<HighlightElementResponseData>) => void
): Promise<void> {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab || !activeTab.id) {
      sendResponse({
        success: false,
        error: 'No active tab found.',
        timestamp: Date.now()
      });
      return;
    }

    if (isRestrictedUrl(activeTab.url || '')) {
      sendResponse({
        success: false,
        error: 'Cannot highlight elements on protected browser pages.',
        timestamp: Date.now()
      });
      return;
    }

    const response = await sendTabMessageWithFallback(activeTab.id, message);
    sendResponse(response as AuraResponse<HighlightElementResponseData>);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Highlight router error';
    sendResponse({
      success: false,
      error: errorMsg,
      timestamp: Date.now()
    });
  }
}

/**
 * Routes toggle assistant request to active tab
 */
async function handleToggleAssistant(
  message: ToggleAssistantMessage,
  sendResponse: (response: AuraResponse<unknown>) => void
): Promise<void> {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab || !activeTab.id) {
      sendResponse({
        success: false,
        error: 'No active tab found.',
        timestamp: Date.now()
      });
      return;
    }

    if (isRestrictedUrl(activeTab.url || '')) {
      sendResponse({
        success: false,
        error: 'Cannot open in-page assistant on protected browser pages.',
        timestamp: Date.now()
      });
      return;
    }

    const response = await sendTabMessageWithFallback(activeTab.id, message);
    sendResponse(response);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Toggle router error';
    sendResponse({
      success: false,
      error: errorMsg,
      timestamp: Date.now()
    });
  }
}

/**
 * Executes the Day 2 Page Analysis pipeline:
 * React Popup -> Service Worker -> Content Script (Active Tab) -> Returns PageContext
 */
async function handleAnalyzePage(
  sendResponse: (response: AuraResponse<AnalyzePageResponseData>) => void
): Promise<void> {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab || !activeTab.id) {
      sendResponse({
        success: false,
        error: 'No active tab found. Please ensure a web page is open and focused.',
        timestamp: Date.now()
      });
      return;
    }

    const tabId = activeTab.id;
    const tabUrl = activeTab.url || '';

    // Validate URL eligibility
    if (isRestrictedUrl(tabUrl)) {
      sendResponse({
        success: false,
        error: `Cannot analyze protected browser page (${tabUrl.split('?')[0] || 'internal URL'}). Please open any normal website (e.g. https://example.com, https://google.com) and try again.`,
        timestamp: Date.now()
      });
      return;
    }

    const analyzeMessage: AnalyzePageMessage = {
      action: AURA_ACTIONS.ANALYZE_PAGE,
      payload: {
        source: 'popup',
        requestedAt: Date.now()
      }
    };

    const contentScriptResponse = await sendTabMessageWithFallback(tabId, analyzeMessage);

    if (contentScriptResponse && contentScriptResponse.success && contentScriptResponse.data) {
      sendResponse({
        success: true,
        message: contentScriptResponse.message || 'Page analysis complete',
        data: contentScriptResponse.data as PageContext,
        timestamp: Date.now()
      });
    } else {
      sendResponse({
        success: false,
        error: contentScriptResponse?.error || 'Page analyzer returned no data.',
        timestamp: Date.now()
      });
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown background error during analysis';
    console.error('[AURA Background] Exception in handleAnalyzePage:', errorMsg);

    sendResponse({
      success: false,
      error: `Service worker error: ${errorMsg}`,
      timestamp: Date.now()
    });
  }
}

/**
 * Executes the Day 1 Test Connection pipeline:
 * React Popup -> Service Worker -> Content Script (Active Tab) -> Webpage Banner
 */
async function handleTestConnection(
  sendResponse: (response: AuraResponse<TestConnectionResponseData>) => void
): Promise<void> {
  const swTimestamp = Date.now();

  try {
    // 1. Query for the active tab in current window
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab || !activeTab.id) {
      sendResponse({
        success: false,
        error: 'No active tab found. Please ensure a web page is open and focused.',
        timestamp: Date.now()
      });
      return;
    }

    const tabId = activeTab.id;
    const tabUrl = activeTab.url || '';
    const tabTitle = activeTab.title || 'Untitled Page';

    console.log(`[AURA Background] Target tab: [${tabId}] ${tabTitle} (${tabUrl})`);

    // 2. Validate URL eligibility (Chrome restricts content scripts on internal/system pages)
    if (isRestrictedUrl(tabUrl)) {
      sendResponse({
        success: false,
        error: `Cannot inject into protected browser page (${tabUrl.split('?')[0] || 'internal URL'}). Please test on any regular website (e.g. https://example.com, https://google.com, or https://wikipedia.org).`,
        data: {
          tab: { tabId, url: tabUrl, title: tabTitle },
          serviceWorkerReceivedAt: swTimestamp
        },
        timestamp: Date.now()
      });
      return;
    }

    // 3. Prepare banner message for content script
    const bannerMessage: ShowBannerMessage = {
      action: AURA_ACTIONS.SHOW_BANNER,
      payload: {
        message: '✨ AURA is connected and ready!',
        durationMs: 3000,
        badge: 'Day 1 Verified'
      }
    };

    // 4. Attempt to send message to content script in the active tab
    try {
      const contentScriptResponse = await sendTabMessageWithFallback(tabId, bannerMessage);

      sendResponse({
        success: true,
        message: 'AURA banner successfully displayed on active webpage!',
        data: {
          tab: { tabId, url: tabUrl, title: tabTitle },
          serviceWorkerReceivedAt: swTimestamp,
          contentScriptRenderedAt: contentScriptResponse?.timestamp || Date.now()
        },
        timestamp: Date.now()
      });
    } catch (tabError: unknown) {
      const errMsg = tabError instanceof Error ? tabError.message : String(tabError);
      console.warn('[AURA Background] Error communicating with tab content script:', errMsg);

      sendResponse({
        success: false,
        error: `Content script communication failed: ${errMsg}. Please refresh the webpage and try again.`,
        data: {
          tab: { tabId, url: tabUrl, title: tabTitle },
          serviceWorkerReceivedAt: swTimestamp
        },
        timestamp: Date.now()
      });
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown background error';
    console.error('[AURA Background] Exception in handleTestConnection:', errorMsg);

    sendResponse({
      success: false,
      error: `Service worker error: ${errorMsg}`,
      timestamp: Date.now()
    });
  }
}

/**
 * Checks if a tab URL is restricted from content script injection
 */
function isRestrictedUrl(url: string): boolean {
  if (!url) return true;
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('view-source:') ||
    url.includes('chromewebstore.google.com') ||
    url.includes('chrome.google.com/webstore')
  );
}

/**
 * Sends message to tab content script. If tab was loaded before extension was installed,
 * dynamically injects the content script via chrome.scripting.executeScript and retries.
 */
async function sendTabMessageWithFallback(
  tabId: number,
  message: AuraMessage
): Promise<AuraResponse> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    return response;
  } catch {
    console.log(`[AURA Background] Content script not active in tab ${tabId}. Injecting dynamically...`);
    
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/content.js']
    });

    await new Promise((resolve) => setTimeout(resolve, 80));
    return await chrome.tabs.sendMessage(tabId, message);
  }
}

// Lifecycle listeners
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[AURA Background] Extension installed/updated. Reason:', details.reason);
});
