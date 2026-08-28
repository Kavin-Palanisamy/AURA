import { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Radio,
  Monitor,
  RefreshCw,
  Layers,
  Search,
  Heading,
  MousePointerClick,
  Link2,
  FormInput,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ShieldCheck,
  PanelRightOpen,
  Focus,
  KeyRound,
  Eye,
  EyeOff,
  Trash2,
  Save,
  Mail,
  Phone,
  CreditCard,
  Fingerprint,
  Lock,
  Binary,
  Sun,
  Moon
} from 'lucide-react';
import {
  AURA_ACTIONS,
  AuraResponse,
  TestConnectionMessage,
  AnalyzePageMessage,
  ToggleAssistantMessage,
  HighlightElementMessage,
  ScanPrivacyMessage,
  TestConnectionResponseData,
  AnalyzePageResponseData,
  ScanPrivacyResponseData
} from '../types/messages';
import type { PageContext } from '../types/page';
import type { PrivacyFinding, PrivacyScanSummary } from '../privacy/types';
import type { ThemeMode } from '../types/theme';
import { fetchAvailableGeminiModels } from '../ai/geminiProvider';

type ActiveTabMode = 'analyze' | 'privacy' | 'settings' | 'test';
type StatusState = 'idle' | 'loading' | 'success' | 'error';

interface DiagnosticStep {
  label: string;
  detail: string;
  status: 'pending' | 'active' | 'success' | 'error';
}

export default function Popup() {
  const [activeTabMode, setActiveTabMode] = useState<ActiveTabMode>('analyze');

  // Day 6 Theme State
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  // Day 1 Connection Test State
  const [connStatus, setConnStatus] = useState<StatusState>('idle');
  const [connMessage, setConnMessage] = useState<string>('Ready to test message flow.');
  const [connLatency, setConnLatency] = useState<number | null>(null);
  const [testSteps, setTestSteps] = useState<DiagnosticStep[]>([
    { label: 'React Popup', detail: 'Trigger user action', status: 'pending' },
    { label: 'Service Worker', detail: 'Route message via MV3', status: 'pending' },
    { label: 'Content Script', detail: 'Shadow DOM injection', status: 'pending' },
    { label: 'Webpage Banner', detail: '3s auto-dismiss overlay', status: 'pending' }
  ]);

  // Day 2 Page Analysis State
  const [analyzeStatus, setAnalyzeStatus] = useState<StatusState>('idle');
  const [analyzeMessage, setAnalyzeMessage] = useState<string>('');
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [isJsonOpen, setIsJsonOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [highlightFeedback, setHighlightFeedback] = useState<string | null>(null);

  // Day 4 Settings & API Key State
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [modelSelect, setModelSelect] = useState<string>('gemini-2.5-flash');
  const [isDetectingModels, setIsDetectingModels] = useState<boolean>(false);
  const [detectedModels, setDetectedModels] = useState<string[]>([]);
  const [hasStoredKey, setHasStoredKey] = useState<boolean>(false);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Day 5 Privacy Shield State
  const [privacyStatus, setPrivacyStatus] = useState<StatusState>('idle');
  const [privacyMessage, setPrivacyMessage] = useState<string>('');
  const [privacySummary, setPrivacySummary] = useState<PrivacyScanSummary | null>(null);
  const [privacyFindings, setPrivacyFindings] = useState<PrivacyFinding[]>([]);
  const [lastScannedTime, setLastScannedTime] = useState<number | null>(null);

  // Active Tab Info
  const [activeTabTitle, setActiveTabTitle] = useState<string>('Detecting active tab...');
  const [activeTabUrl, setActiveTabUrl] = useState<string>('');
  const [isRestrictedTab, setIsRestrictedTab] = useState<boolean>(false);

  useEffect(() => {
    fetchActiveTabInfo();
    loadStoredSettings();
  }, []);

  const loadStoredSettings = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        const data = await chrome.storage.local.get(['aura_gemini_api_key', 'aura_gemini_model', 'aura_theme_mode']);
        if (data?.aura_gemini_api_key) {
          setHasStoredKey(true);
          setApiKeyInput(data.aura_gemini_api_key);
        } else {
          setHasStoredKey(false);
        }
        if (data?.aura_gemini_model) {
          const storedModel = data.aura_gemini_model;
          if (['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'].includes(storedModel)) {
            setModelSelect('gemini-2.5-flash');
            await chrome.storage.local.set({ aura_gemini_model: 'gemini-2.5-flash' });
          } else {
            setModelSelect(storedModel);
          }
        }
        if (data?.aura_theme_mode) {
          setThemeMode(data.aura_theme_mode as ThemeMode);
        }
      }
    } catch (err) {
      console.warn('Could not read chrome.storage:', err);
    }
  };

  const handleToggleTheme = async () => {
    const nextTheme: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({ aura_theme_mode: nextTheme });
      }
    } catch (err) {
      console.warn('Could not save theme preference:', err);
    }
  };

  const handleDetectModels = async () => {
    if (!apiKeyInput.trim()) {
      setSettingsFeedback({ type: 'error', text: 'Enter your API key first to auto-detect models.' });
      return;
    }
    setIsDetectingModels(true);
    try {
      const list = await fetchAvailableGeminiModels(apiKeyInput.trim());
      if (list.length > 0) {
        setDetectedModels(list);
        if (!list.includes(modelSelect)) {
          const best = list.find(m => m.includes('flash')) || list[0];
          setModelSelect(best);
        }
        setSettingsFeedback({ type: 'success', text: `Found ${list.length} active model(s) for your account!` });
      } else {
        setSettingsFeedback({ type: 'error', text: 'Could not fetch models. Verify your API key or network.' });
      }
    } catch {
      setSettingsFeedback({ type: 'error', text: 'Failed to query Gemini models API.' });
    } finally {
      setIsDetectingModels(false);
      setTimeout(() => setSettingsFeedback(null), 4000);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setSettingsFeedback({ type: 'error', text: 'Please enter a valid Gemini API key.' });
      return;
    }

    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({
          aura_gemini_api_key: apiKeyInput.trim(),
          aura_gemini_model: modelSelect
        });
        setHasStoredKey(true);
        setSettingsFeedback({ type: 'success', text: 'Gemini settings saved securely in extension storage!' });
        setTimeout(() => setSettingsFeedback(null), 3000);
      } else {
        setSettingsFeedback({ type: 'error', text: 'Chrome extension storage is unavailable in preview.' });
      }
    } catch (err) {
      setSettingsFeedback({ type: 'error', text: 'Failed to save settings.' });
    }
  };

  const handleClearApiKey = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.remove(['aura_gemini_api_key', 'aura_gemini_model']);
        setApiKeyInput('');
        setModelSelect('gemini-2.5-flash');
        setHasStoredKey(false);
        setSettingsFeedback({ type: 'success', text: 'API key cleared from storage.' });
        setTimeout(() => setSettingsFeedback(null), 3000);
      }
    } catch (err) {
      setSettingsFeedback({ type: 'error', text: 'Failed to clear API key.' });
    }
  };

  const fetchActiveTabInfo = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          const title = tab.title || 'Untitled Webpage';
          const url = tab.url || '';
          setActiveTabTitle(title);
          setActiveTabUrl(url);

          const isRestricted =
            url.startsWith('chrome://') ||
            url.startsWith('chrome-extension://') ||
            url.startsWith('edge://') ||
            url.startsWith('about:') ||
            url.includes('chromewebstore.google.com');

          setIsRestrictedTab(isRestricted);
        }
      } else {
        setActiveTabTitle('Standalone Preview Tab');
      }
    } catch (err) {
      console.warn('Could not query active tab:', err);
    }
  };

  /**
   * Day 5: Run Local Privacy Shield Scan (On-Demand Fresh Scan)
   */
  const handleScanPrivacy = async () => {
    setPrivacyStatus('loading');
    setPrivacyMessage('Running local privacy scan on webpage context...');

    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        throw new Error('Chrome runtime messaging is unavailable.');
      }

      const message: ScanPrivacyMessage = {
        action: AURA_ACTIONS.SCAN_PRIVACY
      };

      const response: AuraResponse<ScanPrivacyResponseData> = await new Promise(
        (resolve, reject) => {
          chrome.runtime.sendMessage(message, (res) => {
            const lastError = chrome.runtime.lastError;
            if (lastError) reject(new Error(lastError.message));
            else resolve(res);
          });
        }
      );

      if (response && response.success && response.data) {
        setPrivacyStatus('success');
        setPrivacySummary(response.data.summary);
        setPrivacyFindings(response.data.findings || []);
        setLastScannedTime(response.data.scannedAt);
        setPrivacyMessage(
          response.data.summary.totalRedactedCount > 0
            ? `Protected: ${response.data.summary.totalRedactedCount} sensitive item(s) found and redacted locally.`
            : 'Clean: No sensitive personal data patterns detected in page metadata.'
        );
      } else {
        setPrivacyStatus('error');
        setPrivacyMessage(response?.error || 'Privacy scan failed to inspect page.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Privacy scan error';
      setPrivacyStatus('error');
      setPrivacyMessage(errMsg);
    }
  };

  /**
   * Day 1: Run Test Connection Flow
   */
  const handleTestConnection = async () => {
    setConnStatus('loading');
    setConnMessage('Initiating message to Background Service Worker...');
    setConnLatency(null);

    const startTime = performance.now();

    setTestSteps([
      { label: 'React Popup', detail: 'Sending runtime message...', status: 'active' },
      { label: 'Service Worker', detail: 'Awaiting routing...', status: 'pending' },
      { label: 'Content Script', detail: 'Awaiting injection...', status: 'pending' },
      { label: 'Webpage Banner', detail: '3s auto-dismiss overlay', status: 'pending' }
    ]);

    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        throw new Error('Chrome runtime messaging is unavailable.');
      }

      const message: TestConnectionMessage = {
        action: AURA_ACTIONS.TEST_CONNECTION,
        payload: {
          source: 'popup',
          triggerTime: Date.now()
        }
      };

      setTestSteps(prev => [
        { ...prev[0], status: 'success', detail: 'Dispatched message' },
        { ...prev[1], status: 'active', detail: 'Service worker processing...' },
        prev[2],
        prev[3]
      ]);

      const response: AuraResponse<TestConnectionResponseData> = await new Promise(
        (resolve, reject) => {
          chrome.runtime.sendMessage(message, (res) => {
            const lastError = chrome.runtime.lastError;
            if (lastError) reject(new Error(lastError.message));
            else resolve(res);
          });
        }
      );

      const elapsed = Math.round(performance.now() - startTime);
      setConnLatency(elapsed);

      if (response && response.success) {
        setConnStatus('success');
        setConnMessage(response.message || '✨ AURA is connected and ready!');

        setTestSteps([
          { label: 'React Popup', detail: 'Dispatched message', status: 'success' },
          { label: 'Service Worker', detail: 'Resolved active tab', status: 'success' },
          { label: 'Content Script', detail: 'Injected Shadow DOM', status: 'success' },
          { label: 'Webpage Banner', detail: 'Visible (3s timer active)', status: 'success' }
        ]);

        if (response.data?.tab) {
          if (response.data.tab.title) setActiveTabTitle(response.data.tab.title);
          if (response.data.tab.url) setActiveTabUrl(response.data.tab.url);
        }
      } else {
        setConnStatus('error');
        setConnMessage(response?.error || 'Failed to complete connection test.');
        setTestSteps(prev => [
          { ...prev[0], status: 'success' },
          { ...prev[1], status: 'error', detail: response?.error || 'Worker error' },
          { ...prev[2], status: 'error', detail: 'Halted' },
          { ...prev[3], status: 'pending', detail: 'Not reached' }
        ]);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown communication failure';
      setConnStatus('error');
      setConnMessage(errMsg);
      setTestSteps(prev => [
        { ...prev[0], status: 'error', detail: 'Dispatch failed' },
        { ...prev[1], status: 'error', detail: 'Connection refused' },
        { ...prev[2], status: 'pending', detail: 'Not reached' },
        { ...prev[3], status: 'pending', detail: 'Not reached' }
      ]);
    }
  };

  /**
   * Day 2: Run Page Analyzer Flow (Fresh on-demand context for SPA reliability)
   */
  const handleAnalyzePage = async () => {
    setAnalyzeStatus('loading');
    setAnalyzeMessage('Inspecting webpage structure safely in memory...');
    setHighlightFeedback(null);

    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        throw new Error('Chrome runtime messaging is unavailable.');
      }

      const message: AnalyzePageMessage = {
        action: AURA_ACTIONS.ANALYZE_PAGE,
        payload: {
          source: 'popup',
          requestedAt: Date.now()
        }
      };

      const response: AuraResponse<AnalyzePageResponseData> = await new Promise(
        (resolve, reject) => {
          chrome.runtime.sendMessage(message, (res) => {
            const lastError = chrome.runtime.lastError;
            if (lastError) reject(new Error(lastError.message));
            else resolve(res);
          });
        }
      );

      if (response && response.success && response.data) {
        setAnalyzeStatus('success');
        setPageContext(response.data);
        setAnalyzeMessage(response.message || 'Page structure analyzed successfully');
        if (response.data.metadata.title) {
          setActiveTabTitle(response.data.metadata.title);
        }
      } else {
        setAnalyzeStatus('error');
        setAnalyzeMessage(response?.error || 'Page analysis failed to extract context.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Analysis error';
      setAnalyzeStatus('error');
      setAnalyzeMessage(errMsg);
    }
  };

  /**
   * Day 3: Open Floating Assistant inside webpage
   */
  const handleOpenFloatingAssistant = async () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;

      const message: ToggleAssistantMessage = {
        action: AURA_ACTIONS.TOGGLE_ASSISTANT,
        payload: { open: true }
      };

      chrome.runtime.sendMessage(message);
      window.close(); // Close popup so user sees in-page assistant
    } catch (err) {
      console.warn('Could not toggle assistant:', err);
    }
  };

  /**
   * Day 3: Highlight a specific element from the popup
   */
  const handleHighlight = (targetId: string) => {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;

      const message: HighlightElementMessage = {
        action: AURA_ACTIONS.HIGHLIGHT_ELEMENT,
        payload: { targetId }
      };

      chrome.runtime.sendMessage(message, (res) => {
        if (res && res.success) {
          setHighlightFeedback(`Highlighted ${targetId} on webpage!`);
          setTimeout(() => setHighlightFeedback(null), 3000);
        }
      });
    } catch (err) {
      console.warn('Highlight failed:', err);
    }
  };

  const handleCopyJson = () => {
    if (!pageContext) return;
    navigator.clipboard.writeText(JSON.stringify(pageContext, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLight = themeMode === 'light';

  return (
    <div
      className={`w-[390px] min-h-[500px] p-4 flex flex-col gap-3 font-sans border shadow-2xl relative overflow-hidden transition-colors duration-200 ${
        isLight
          ? 'bg-slate-50 text-slate-900 border-slate-300'
          : 'bg-slate-950 text-slate-100 border-slate-800/80'
      }`}
    >
      {/* Background Ambient Glow */}
      <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none ${isLight ? 'bg-indigo-300/25' : 'bg-indigo-600/15'}`} />
      <div className={`absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none ${isLight ? 'bg-cyan-300/25' : 'bg-cyan-600/15'}`} />

      {/* Header & Logo Section */}
      <header className={`flex items-center justify-between border-b pb-2.5 relative z-10 ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`}>
        <div className="flex items-center gap-2.5">
          {/* Logo Mark */}
          <div className="relative flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isLight ? 'bg-white' : 'bg-slate-950'}`}>
              <Sparkles className={`w-4 h-4 animate-pulse-glow ${isLight ? 'text-indigo-600' : 'text-cyan-300'}`} />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent'}`}>
                AURA
              </h1>
              <span className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full border ${isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/90 text-emerald-300 border-emerald-700/50'}`}>
                v1.0 Ready
              </span>
            </div>
            <p className={`text-[10.5px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Understand. Navigate. Protect.
            </p>
          </div>
        </div>

        {/* Header Right Actions (Theme Toggle & Status) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggleTheme}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none ${
              isLight
                ? 'bg-slate-200/80 border-slate-300 text-slate-700 hover:bg-slate-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
            aria-label={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
          >
            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-300" />}
          </button>

          <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[9.5px] font-medium ${isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-slate-900 border-slate-800 text-emerald-400'}`}>
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>{hasStoredKey ? 'AI Ready' : 'Protected'}</span>
          </div>
        </div>
      </header>

      {/* 4-Tab Switcher with WCAG Tablist Roles */}
      <div
        role="tablist"
        aria-label="AURA Feature Sections"
        className={`grid grid-cols-4 gap-1 p-1 rounded-lg border text-xs font-semibold ${isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-slate-900/90 border-slate-800'}`}
      >
        <button
          role="tab"
          id="tab-analyze"
          aria-selected={activeTabMode === 'analyze'}
          aria-controls="panel-analyze"
          onClick={() => setActiveTabMode('analyze')}
          className={`py-1.5 px-1.5 rounded-md transition-all flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none cursor-pointer ${
            activeTabMode === 'analyze'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Inspect webpage interactive structure"
        >
          <Search className="w-3 h-3" />
          <span className="text-[10px]">Analyze</span>
        </button>

        <button
          role="tab"
          id="tab-privacy"
          aria-selected={activeTabMode === 'privacy'}
          aria-controls="panel-privacy"
          onClick={() => setActiveTabMode('privacy')}
          className={`py-1.5 px-1.5 rounded-md transition-all flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none cursor-pointer ${
            activeTabMode === 'privacy'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Privacy Shield dashboard & sensitive data detection"
        >
          <ShieldCheck className="w-3 h-3" />
          <span className="text-[10px]">Privacy</span>
        </button>

        <button
          role="tab"
          id="tab-settings"
          aria-selected={activeTabMode === 'settings'}
          aria-controls="panel-settings"
          onClick={() => setActiveTabMode('settings')}
          className={`py-1.5 px-1.5 rounded-md transition-all flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none cursor-pointer ${
            activeTabMode === 'settings'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="AI model and Gemini API Key configuration"
        >
          <KeyRound className="w-3 h-3" />
          <span className="text-[10px]">Settings</span>
        </button>

        <button
          role="tab"
          id="tab-test"
          aria-selected={activeTabMode === 'test'}
          aria-controls="panel-test"
          onClick={() => setActiveTabMode('test')}
          className={`py-1.5 px-1.5 rounded-md transition-all flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none cursor-pointer ${
            activeTabMode === 'test'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Diagnostic connection pipeline test"
        >
          <Zap className="w-3 h-3" />
          <span className="text-[10px]">Test</span>
        </button>
      </div>

      {/* Target Tab Info Card */}
      <section className={`rounded-xl p-2.5 border text-xs flex flex-col gap-1 backdrop-blur-sm ${isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-900/80 border-slate-800/80'}`}>
        <div className={`flex items-center justify-between text-[10.5px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          <div className="flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5" />
            <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Active Webpage</span>
          </div>
          <button
            onClick={fetchActiveTabInfo}
            title="Refresh tab info"
            aria-label="Refresh active webpage info"
            className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors p-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none rounded"
          >
            <RefreshCw className={`w-3 h-3 ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-500 hover:text-slate-300'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className={`font-medium truncate max-w-[280px] ${isLight ? 'text-slate-900' : 'text-slate-200'}`} title={activeTabTitle}>
            {activeTabTitle}
          </span>
          {activeTabUrl && !isRestrictedTab && (
            <span className={`text-[9.5px] px-1.5 py-0.5 rounded border shrink-0 font-medium ${isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'}`}>
              Ready
            </span>
          )}
        </div>

        {isRestrictedTab && (
          <div className={`flex items-start gap-1.5 mt-1 text-[10.5px] p-1.5 rounded border ${isLight ? 'bg-amber-100 border-amber-300 text-amber-900' : 'text-amber-300 bg-amber-950/40 border-amber-800/40'}`}>
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>Restricted browser page. Switch to a standard website to use AURA.</span>
          </div>
        )}
      </section>

      {/* VIEW 1: PAGE INTELLIGENCE ANALYZER */}
      {activeTabMode === 'analyze' && (
        <div role="tabpanel" id="panel-analyze" aria-labelledby="tab-analyze" className="flex flex-col gap-2.5 animate-fade-in">
          {/* Dual Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="aura-analyze-btn"
              onClick={handleAnalyzePage}
              disabled={analyzeStatus === 'loading' || isRestrictedTab}
              className="aura-btn-gradient relative py-2 px-3 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
            >
              {analyzeStatus === 'loading' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Analyze Page</span>
                </>
              )}
            </button>

            <button
              id="aura-open-assistant-btn"
              onClick={handleOpenFloatingAssistant}
              disabled={isRestrictedTab}
              className={`font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none border ${
                isLight
                  ? 'bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-800'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100'
              }`}
              title="Open floating AURA assistant directly on the webpage"
            >
              <PanelRightOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>In-Page Panel</span>
            </button>
          </div>

          {highlightFeedback && (
            <div className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 animate-fade-in border ${isLight ? 'bg-indigo-100 border-indigo-300 text-indigo-900' : 'bg-indigo-950/60 border-indigo-700/60 text-indigo-200'}`}>
              <Focus className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span>{highlightFeedback}</span>
            </div>
          )}

          {/* Analysis Summary Result */}
          {pageContext ? (
            <div className={`flex flex-col gap-2 rounded-xl p-3 border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/80'}`}>
              <div className={`flex items-center justify-between border-b pb-1.5 ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`}>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    PAGE ANALYSIS
                  </span>
                </div>
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  lang: {pageContext.metadata.lang || 'en'}
                </span>
              </div>

              {/* Title display */}
              <div className="text-[11px]">
                <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Title: </span>
                <span className={`font-semibold truncate block ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {pageContext.metadata.title}
                </span>
              </div>

              {/* 5-Metric Summary Grid */}
              <div className="grid grid-cols-5 gap-1.5 text-center mt-1">
                <div className={`p-2 rounded-lg border flex flex-col items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'}`}>
                  <Heading className="w-3.5 h-3.5 text-indigo-500 mb-0.5" />
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{pageContext.summary.headingsCount}</span>
                  <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Headings</span>
                </div>
                <div className={`p-2 rounded-lg border flex flex-col items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'}`}>
                  <MousePointerClick className="w-3.5 h-3.5 text-cyan-500 mb-0.5" />
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{pageContext.summary.buttonsCount}</span>
                  <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Buttons</span>
                </div>
                <div className={`p-2 rounded-lg border flex flex-col items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'}`}>
                  <Link2 className="w-3.5 h-3.5 text-emerald-500 mb-0.5" />
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{pageContext.summary.linksCount}</span>
                  <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Links</span>
                </div>
                <div className={`p-2 rounded-lg border flex flex-col items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'}`}>
                  <FormInput className="w-3.5 h-3.5 text-amber-500 mb-0.5" />
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{pageContext.summary.inputsCount}</span>
                  <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Inputs</span>
                </div>
                <div className={`p-2 rounded-lg border flex flex-col items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'}`}>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-500 mb-0.5" />
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{pageContext.summary.formsCount}</span>
                  <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Forms</span>
                </div>
              </div>

              {/* Sample Quick Highlight Elements */}
              {pageContext.buttons.length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Quick Highlight
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {pageContext.buttons.slice(0, 3).map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => handleHighlight(btn.id)}
                        className={`text-[10.5px] px-2 py-1 rounded border flex items-center gap-1 transition-colors truncate max-w-[170px] cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none ${
                          isLight
                            ? 'bg-slate-100 hover:bg-indigo-50 border-slate-200 hover:border-indigo-400 text-slate-800'
                            : 'bg-slate-800 hover:bg-indigo-900/60 border-slate-700 hover:border-indigo-500 text-slate-200'
                        }`}
                        title={`Highlight ${btn.id}: ${btn.text}`}
                        aria-label={`Highlight element ${btn.text}`}
                      >
                        <Focus className="w-3 h-3 text-cyan-500 shrink-0" />
                        <span className="truncate">{btn.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Collapsible View Page Context (Debug Only) */}
              <div className={`mt-1 border-t pt-2 ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`}>
                <button
                  onClick={() => setIsJsonOpen(!isJsonOpen)}
                  className={`w-full flex items-center justify-between text-[11px] font-medium transition-colors py-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none rounded ${
                    isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  aria-expanded={isJsonOpen}
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-indigo-500" />
                    <span>View Page Context (Debug)</span>
                  </span>
                  {isJsonOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isJsonOpen && (
                  <div className={`mt-2 p-2.5 rounded-lg border text-[10px] font-mono max-h-36 overflow-y-auto relative animate-fade-in ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}>
                    <button
                      onClick={handleCopyJson}
                      title="Copy JSON"
                      aria-label="Copy Page Context JSON"
                      className={`absolute top-2 right-2 p-1 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                        isLight ? 'bg-white hover:bg-slate-200 text-slate-700 shadow-sm border border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <pre className="whitespace-pre-wrap break-all leading-tight">
                      {JSON.stringify(pageContext, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`p-3.5 rounded-xl border border-dashed text-center flex flex-col items-center gap-1 text-xs ${
              isLight ? 'border-slate-300 text-slate-500' : 'border-slate-800 text-slate-500'
            }`}>
              <Search className="w-4 h-4 text-slate-400" />
              <p>Click "Analyze Page" or "In-Page Panel" to inspect and ask AI questions about this page.</p>
            </div>
          )}

          {analyzeStatus === 'error' && (
            <div role="alert" className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
              isLight ? 'bg-rose-100 border-rose-300 text-rose-900' : 'bg-rose-950/50 border-rose-800/60 text-rose-200'
            }`}>
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">{analyzeMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: DAY 5 PRIVACY SHIELD DASHBOARD */}
      {activeTabMode === 'privacy' && (
        <div role="tabpanel" id="panel-privacy" aria-labelledby="tab-privacy" className="flex flex-col gap-2.5 animate-fade-in">
          {/* Action Button: Scan Current Page */}
          <button
            onClick={handleScanPrivacy}
            disabled={privacyStatus === 'loading' || isRestrictedTab}
            className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 py-2.5 px-3 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
          >
            {privacyStatus === 'loading' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Local Privacy Shield Scan...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Scan Current Page (Local Only)</span>
              </>
            )}
          </button>

          {/* Privacy Scan Results Card */}
          {privacySummary ? (
            <div className={`rounded-xl p-3 border flex flex-col gap-2 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/70 border-slate-800/80'}`}>
              <div className={`flex items-center justify-between border-b pb-1.5 ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`}>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    SCAN SUMMARY
                  </span>
                </div>
                {lastScannedTime && (
                  <span className={`text-[9px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                    {new Date(lastScannedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Status Message */}
              <p className={`text-[11px] leading-snug ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {privacyMessage}
              </p>

              {/* 6-Metric Sensitive Data Grid */}
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                <div className={`p-2 rounded-lg border flex flex-col items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'}`}>
                  <Mail className="w-3.5 h-3.5 text-indigo-500 mb-0.5" />
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{privacySummary.emailCount}</span>
                  <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Emails</span>
                </div>
                <div className={`p-2 rounded-lg border flex flex-col items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'}`}>
                  <Phone className="w-3.5 h-3.5 text-cyan-500 mb-0.5" />
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{privacySummary.phoneCount}</span>
                  <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Phones</span>
                </div>
                <div className={`p-2 rounded-lg border flex flex-col items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'}`}>
                  <CreditCard className="w-3.5 h-3.5 text-amber-500 mb-0.5" />
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{privacySummary.creditCardCount}</span>
                  <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Cards (Luhn)</span>
                </div>
                <div className={`p-2 rounded-lg border flex flex-col items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'}`}>
                  <Fingerprint className="w-3.5 h-3.5 text-emerald-500 mb-0.5" />
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{privacySummary.aadhaarCount}</span>
                  <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Aadhaar-like</span>
                </div>
                <div className={`p-2 rounded-lg border flex flex-col items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'}`}>
                  <KeyRound className="w-3.5 h-3.5 text-rose-500 mb-0.5" />
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{privacySummary.apiKeyCount}</span>
                  <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>API Keys</span>
                </div>
                <div className={`p-2 rounded-lg border flex flex-col items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'}`}>
                  <Binary className="w-3.5 h-3.5 text-purple-500 mb-0.5" />
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{privacySummary.tokenCount}</span>
                  <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tokens</span>
                </div>
              </div>

              {/* Findings List with User-Friendly Location Badges */}
              {privacyFindings.length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Redacted Locations ({privacyFindings.length})
                  </span>
                  <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
                    {privacyFindings.map((f, idx) => (
                      <div key={idx} className={`p-1.5 rounded border text-[10px] flex items-center justify-between ${
                        isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/90 border-slate-800'
                      }`}>
                        <span className="font-mono text-cyan-500 uppercase font-semibold">[{f.type.replace('_', ' ')}]</span>
                        <span className={`truncate max-w-[190px] font-medium ${isLight ? 'text-slate-800' : 'text-slate-300'}`} title={f.location}>
                          {f.friendlyLocation || f.location}
                        </span>
                        <span className="text-emerald-500 text-[9px] font-semibold">Redacted</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={`p-3.5 rounded-xl border border-dashed text-center flex flex-col items-center gap-1 text-xs ${
              isLight ? 'border-slate-300 text-slate-500' : 'border-slate-800 text-slate-500'
            }`}>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <p>Click "Scan Current Page" to run local sensitive data detection without transmitting anything to AI.</p>
            </div>
          )}

          {/* Immutable Guarantees Checklist */}
          <div className={`rounded-xl p-3 border flex flex-col gap-1.5 text-[11px] ${isLight ? 'bg-slate-100/70 border-slate-200 text-slate-600' : 'bg-slate-900/40 border-slate-800/60 text-slate-400'}`}>
            <div className={`flex items-center gap-1.5 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Privacy Shield Guarantees</span>
            </div>
            <ul className="flex flex-col gap-1 text-[10.5px]">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Form values (<code className="text-cyan-500 font-mono">input.value</code>) are never collected</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Raw HTML & DOM nodes are never sent</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Sensitive text is detected & redacted locally</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Luhn checksum validates cards before redacting</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* VIEW 3: DAY 4 AI SETTINGS */}
      {activeTabMode === 'settings' && (
        <div role="tabpanel" id="panel-settings" aria-labelledby="tab-settings" className="flex flex-col gap-3 animate-fade-in">
          <div className={`rounded-xl p-3 border flex flex-col gap-2.5 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/70 border-slate-800/80'}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                <KeyRound className="w-3.5 h-3.5 text-cyan-500" />
                <span>Google Gemini API Key</span>
              </div>
              <span
                className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full border ${
                  hasStoredKey
                    ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                    : isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                }`}
              >
                {hasStoredKey ? 'Connected' : 'Missing Key'}
              </span>
            </div>

            <p className={`text-[11px] leading-snug ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Enter your Google Gemini API key to enable live AI page understanding and element guidance.
            </p>

            {/* Input Box */}
            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                aria-label="Google Gemini API Key"
                className={`w-full border rounded-lg py-2 pl-3 pr-10 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-950 border-slate-700/80 text-slate-200 placeholder-slate-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none rounded"
                title={showKey ? 'Hide key' : 'Show key'}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Model Selector with Auto-Detect */}
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center justify-between">
                <label className={`text-[10px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Gemini Model</label>
                <button
                  type="button"
                  onClick={handleDetectModels}
                  disabled={isDetectingModels}
                  className="text-[9.5px] text-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none rounded"
                  title="Detect supported models for your API key"
                  aria-label="Auto-detect supported Gemini models"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isDetectingModels ? 'animate-spin' : ''}`} />
                  <span>{isDetectingModels ? 'Detecting...' : 'Auto-Detect'}</span>
                </button>
              </div>

              <select
                value={modelSelect}
                onChange={(e) => setModelSelect(e.target.value)}
                aria-label="Select Gemini Model"
                className={`w-full border rounded-lg py-1.5 px-2.5 text-xs font-mono cursor-pointer focus:outline-none focus:border-indigo-500 ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-700/80 text-slate-200'
                }`}
              >
                {detectedModels.length > 0 ? (
                  detectedModels.map((m) => (
                    <option key={m} value={m}>
                      {m} {m === 'gemini-2.5-flash' ? '(Recommended)' : ''}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Default & Recommended)</option>
                    <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (Fast & Lightweight)</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro (High Reasoning)</option>
                  </>
                )}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleSaveApiKey}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Settings</span>
              </button>

              {hasStoredKey && (
                <button
                  onClick={handleClearApiKey}
                  className={`border text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none ${
                    isLight
                      ? 'bg-slate-200 hover:bg-rose-100 hover:text-rose-800 hover:border-rose-300 border-slate-300 text-slate-700'
                      : 'bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800/60 border-slate-700 text-slate-400'
                  }`}
                  title="Remove stored key"
                  aria-label="Clear API key from storage"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {settingsFeedback && (
              <div
                role="status"
                className={`p-2 rounded-lg text-xs flex items-center gap-1.5 border animate-fade-in ${
                  settingsFeedback.type === 'success'
                    ? isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-emerald-950/60 border-emerald-800/60 text-emerald-200'
                    : isLight ? 'bg-rose-100 border-rose-300 text-rose-900' : 'bg-rose-950/60 border-rose-800/60 text-rose-200'
                }`}
              >
                {settingsFeedback.type === 'success' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                )}
                <span className="text-[10.5px]">{settingsFeedback.text}</span>
              </div>
            )}
          </div>

          {/* Privacy Note Card */}
          <div className={`rounded-xl p-3 border flex flex-col gap-1.5 text-[11px] ${isLight ? 'bg-slate-100/70 border-slate-200 text-slate-600' : 'bg-slate-900/40 border-slate-800/60 text-slate-400'}`}>
            <div className={`flex items-center gap-1.5 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Local Storage Security</span>
            </div>
            <p className="leading-relaxed text-[10.5px]">
              Your API key is stored strictly within your browser's <code className="text-cyan-500 bg-slate-200 dark:bg-slate-950 px-1 py-0.5 rounded font-mono">chrome.storage.local</code>. It is never logged, never exposed to webpage scripts, and used solely for direct communication with the Gemini API.
            </p>
          </div>
        </div>
      )}

      {/* VIEW 4: DAY 1 CONNECTION TEST */}
      {activeTabMode === 'test' && (
        <div role="tabpanel" id="panel-test" aria-labelledby="tab-test" className="flex flex-col gap-3 animate-fade-in">
          <button
            id="aura-test-connection-btn"
            onClick={handleTestConnection}
            disabled={connStatus === 'loading'}
            className="aura-btn-gradient relative w-full py-2.5 px-4 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
          >
            {connStatus === 'loading' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Transmitting Message Flow...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-cyan-200 fill-cyan-300/30" />
                <span>Test Connection</span>
              </>
            )}
          </button>

          <section className={`rounded-xl p-2.5 border flex flex-col gap-2 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/70'}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Communication Pipeline</span>
              </div>
              {connLatency !== null && (
                <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border ${isLight ? 'bg-cyan-100 border-cyan-300 text-cyan-900' : 'text-cyan-400 bg-cyan-950/50 border-cyan-800/40'}`}>
                  {connLatency}ms
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
              {testSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border transition-all duration-200 ${
                    step.status === 'success'
                      ? isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                      : step.status === 'active'
                      ? isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-800 animate-pulse' : 'bg-indigo-950/40 border-indigo-700/60 text-indigo-300 animate-pulse'
                      : step.status === 'error'
                      ? isLight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
                      : isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-950/40 border-slate-800/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="truncate">{step.label}</span>
                    {step.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                    {step.status === 'active' && <Radio className="w-3 h-3 text-indigo-500 animate-spin shrink-0" />}
                    {step.status === 'error' && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                  </div>
                  <p className="text-[9px] opacity-75 mt-0.5 truncate">{step.detail}</p>
                </div>
              ))}
            </div>

            {connStatus !== 'idle' && (
              <div
                role="status"
                className={`p-2 rounded-lg text-xs flex items-start gap-2 border ${
                  connStatus === 'success'
                    ? isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-emerald-950/50 border-emerald-800/60 text-emerald-200'
                    : connStatus === 'error'
                    ? isLight ? 'bg-rose-100 border-rose-300 text-rose-900' : 'bg-rose-950/50 border-rose-800/60 text-rose-200'
                    : isLight ? 'bg-indigo-100 border-indigo-300 text-indigo-900' : 'bg-indigo-950/50 border-indigo-800/60 text-indigo-200'
                }`}
              >
                {connStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />}
                {connStatus === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />}
                {connStatus === 'loading' && <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin shrink-0 mt-0.5" />}
                <span className="leading-snug text-[10.5px]">{connMessage}</span>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Footer Info */}
      <footer className={`flex items-center justify-between text-[9.5px] pt-1 border-t mt-auto ${isLight ? 'border-slate-200 text-slate-500' : 'border-slate-900 text-slate-500'}`}>
        <span>Manifest V3 &bull; Privacy Shield &bull; Gemini AI</span>
        <span className="font-mono">Day 6 Release Ready</span>
      </footer>
    </div>
  );
}
