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
  Binary
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
    loadStoredApiKey();
  }, []);

  const loadStoredApiKey = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        const data = await chrome.storage.local.get(['aura_gemini_api_key', 'aura_gemini_model']);
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
      }
    } catch (err) {
      console.warn('Could not read chrome.storage:', err);
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
   * Day 5: Run Local Privacy Shield Scan
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
   * Day 2: Run Page Analyzer Flow
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

  return (
    <div className="w-[390px] bg-slate-950 text-slate-100 p-4 flex flex-col gap-3 font-sans border border-slate-800/80 shadow-2xl relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Logo Section */}
      <header className="flex items-center justify-between border-b border-slate-800/60 pb-2.5 relative z-10">
        <div className="flex items-center gap-2.5">
          {/* Logo Mark */}
          <div className="relative flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse-glow" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                AURA
              </h1>
              <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-700/50">
                Day 5 Shield
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">
              Understand. Navigate. Protect.
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[9.5px] text-emerald-400">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span className="font-medium">Shield Active</span>
        </div>
      </header>

      {/* 4-Tab Switcher */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 rounded-lg border border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTabMode('analyze')}
          className={`py-1.5 px-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
            activeTabMode === 'analyze'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Inspect webpage interactive structure"
        >
          <Search className="w-3 h-3" />
          <span className="text-[10px]">Analyze</span>
        </button>

        <button
          onClick={() => setActiveTabMode('privacy')}
          className={`py-1.5 px-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
            activeTabMode === 'privacy'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Privacy Shield dashboard & sensitive data detection"
        >
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px]">Privacy</span>
        </button>

        <button
          onClick={() => setActiveTabMode('settings')}
          className={`py-1.5 px-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
            activeTabMode === 'settings'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="AI model and Gemini API Key configuration"
        >
          <KeyRound className="w-3 h-3" />
          <span className="text-[10px]">Settings</span>
        </button>

        <button
          onClick={() => setActiveTabMode('test')}
          className={`py-1.5 px-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
            activeTabMode === 'test'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Diagnostic connection pipeline test"
        >
          <Zap className="w-3 h-3" />
          <span className="text-[10px]">Test</span>
        </button>
      </div>

      {/* Target Tab Info Card */}
      <section className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80 text-xs flex flex-col gap-1 backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 text-[10.5px]">
          <div className="flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-300">Active Webpage</span>
          </div>
          <button
            onClick={fetchActiveTabInfo}
            title="Refresh tab info"
            className="hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-slate-500 hover:text-slate-300" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-slate-200 truncate max-w-[290px]" title={activeTabTitle}>
            {activeTabTitle}
          </span>
          {activeTabUrl && !isRestrictedTab && (
            <span className="text-[9.5px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40 shrink-0">
              Ready
            </span>
          )}
        </div>

        {isRestrictedTab && (
          <div className="flex items-start gap-1.5 mt-1 text-[10.5px] text-amber-300 bg-amber-950/40 p-1.5 rounded border border-amber-800/40">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Restricted browser page. Switch to a standard website to use AURA.
            </span>
          </div>
        )}
      </section>

      {/* VIEW 1: PAGE INTELLIGENCE ANALYZER */}
      {activeTabMode === 'analyze' && (
        <div className="flex flex-col gap-2.5 animate-fade-in">
          {/* Dual Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="aura-analyze-btn"
              onClick={handleAnalyzePage}
              disabled={analyzeStatus === 'loading' || isRestrictedTab}
              className="aura-btn-gradient relative py-2 px-3 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Open floating AURA assistant directly on the webpage"
            >
              <PanelRightOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>In-Page Panel</span>
            </button>
          </div>

          {highlightFeedback && (
            <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-700/60 text-indigo-200 text-[11px] flex items-center gap-1.5 animate-fade-in">
              <Focus className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{highlightFeedback}</span>
            </div>
          )}

          {/* Analysis Summary Result */}
          {pageContext ? (
            <div className="flex flex-col gap-2 bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    PAGE ANALYSIS
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  lang: {pageContext.metadata.lang || 'en'}
                </span>
              </div>

              {/* Title display */}
              <div className="text-[11px]">
                <span className="text-slate-400 font-medium">Title: </span>
                <span className="text-slate-100 font-semibold truncate block">
                  {pageContext.metadata.title}
                </span>
              </div>

              {/* 5-Metric Summary Grid */}
              <div className="grid grid-cols-5 gap-1.5 text-center mt-1">
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
                  <Heading className="w-3.5 h-3.5 text-indigo-400 mb-0.5" />
                  <span className="text-sm font-bold text-slate-100">{pageContext.summary.headingsCount}</span>
                  <span className="text-[9px] text-slate-400">Headings</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
                  <MousePointerClick className="w-3.5 h-3.5 text-cyan-400 mb-0.5" />
                  <span className="text-sm font-bold text-slate-100">{pageContext.summary.buttonsCount}</span>
                  <span className="text-[9px] text-slate-400">Buttons</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
                  <Link2 className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
                  <span className="text-sm font-bold text-slate-100">{pageContext.summary.linksCount}</span>
                  <span className="text-[9px] text-slate-400">Links</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
                  <FormInput className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                  <span className="text-sm font-bold text-slate-100">{pageContext.summary.inputsCount}</span>
                  <span className="text-[9px] text-slate-400">Inputs</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400 mb-0.5" />
                  <span className="text-sm font-bold text-slate-100">{pageContext.summary.formsCount}</span>
                  <span className="text-[9px] text-slate-400">Forms</span>
                </div>
              </div>

              {/* Sample Quick Highlight Elements */}
              {pageContext.buttons.length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Quick Highlight
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {pageContext.buttons.slice(0, 3).map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => handleHighlight(btn.id)}
                        className="text-[10.5px] px-2 py-1 rounded bg-slate-800 hover:bg-indigo-900/60 border border-slate-700 hover:border-indigo-500 text-slate-200 flex items-center gap-1 transition-colors truncate max-w-[170px] cursor-pointer"
                        title={`Highlight ${btn.id}: ${btn.text}`}
                      >
                        <Focus className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{btn.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Collapsible View Page Context (Debug Only) */}
              <div className="mt-1 border-t border-slate-800/60 pt-2">
                <button
                  onClick={() => setIsJsonOpen(!isJsonOpen)}
                  className="w-full flex items-center justify-between text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-indigo-400" />
                    <span>View Page Context (Debug)</span>
                  </span>
                  {isJsonOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isJsonOpen && (
                  <div className="mt-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 max-h-36 overflow-y-auto relative animate-fade-in">
                    <button
                      onClick={handleCopyJson}
                      title="Copy JSON"
                      className="absolute top-2 right-2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <pre className="whitespace-pre-wrap break-all leading-tight">
                      {JSON.stringify(pageContext, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-dashed border-slate-800 text-center flex flex-col items-center gap-1 text-slate-500 text-xs">
              <Search className="w-4 h-4 text-slate-600" />
              <p>Click "Analyze Page" or "In-Page Panel" to inspect and ask AI questions about this page.</p>
            </div>
          )}

          {analyzeStatus === 'error' && (
            <div className="p-2.5 rounded-lg text-xs flex items-start gap-2 bg-rose-950/50 border border-rose-800/60 text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">{analyzeMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: DAY 5 PRIVACY SHIELD DASHBOARD */}
      {activeTabMode === 'privacy' && (
        <div className="flex flex-col gap-2.5 animate-fade-in">
          {/* Action Button: Scan Current Page */}
          <button
            onClick={handleScanPrivacy}
            disabled={privacyStatus === 'loading' || isRestrictedTab}
            className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 py-2.5 px-3 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
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
            <div className="bg-slate-900/70 rounded-xl p-3 border border-slate-800/80 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    SCAN SUMMARY
                  </span>
                </div>
                {lastScannedTime && (
                  <span className="text-[9px] text-slate-500 font-mono">
                    {new Date(lastScannedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Status Message */}
              <p className="text-[11px] text-slate-300 leading-snug">
                {privacyMessage}
              </p>

              {/* 6-Metric Sensitive Data Grid */}
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
                  <Mail className="w-3.5 h-3.5 text-indigo-400 mb-0.5" />
                  <span className="text-sm font-bold text-slate-100">{privacySummary.emailCount}</span>
                  <span className="text-[9px] text-slate-400">Emails</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
                  <Phone className="w-3.5 h-3.5 text-cyan-400 mb-0.5" />
                  <span className="text-sm font-bold text-slate-100">{privacySummary.phoneCount}</span>
                  <span className="text-[9px] text-slate-400">Phones</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                  <span className="text-sm font-bold text-slate-100">{privacySummary.creditCardCount}</span>
                  <span className="text-[9px] text-slate-400">Cards (Luhn)</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
                  <Fingerprint className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
                  <span className="text-sm font-bold text-slate-100">{privacySummary.aadhaarCount}</span>
                  <span className="text-[9px] text-slate-400">Aadhaar-like</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
                  <KeyRound className="w-3.5 h-3.5 text-rose-400 mb-0.5" />
                  <span className="text-sm font-bold text-slate-100">{privacySummary.apiKeyCount}</span>
                  <span className="text-[9px] text-slate-400">API Keys</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
                  <Binary className="w-3.5 h-3.5 text-purple-400 mb-0.5" />
                  <span className="text-sm font-bold text-slate-100">{privacySummary.tokenCount}</span>
                  <span className="text-[9px] text-slate-400">Tokens</span>
                </div>
              </div>

              {/* Findings List (Metadata Only) */}
              {privacyFindings.length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Redacted Locations ({privacyFindings.length})
                  </span>
                  <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
                    {privacyFindings.map((f, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-slate-950/90 border border-slate-800 text-[10px] flex items-center justify-between">
                        <span className="font-mono text-cyan-300 uppercase">[{f.type.replace('_', ' ')}]</span>
                        <span className="text-slate-400 truncate max-w-[200px]" title={f.location}>{f.location}</span>
                        <span className="text-emerald-400 text-[9px] font-semibold">Redacted</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-dashed border-slate-800 text-center flex flex-col items-center gap-1 text-slate-500 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <p>Click "Scan Current Page" to run local sensitive data detection without transmitting anything to AI.</p>
            </div>
          )}

          {/* Immutable Guarantees Checklist */}
          <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/60 flex flex-col gap-1.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Privacy Shield Guarantees</span>
            </div>
            <ul className="flex flex-col gap-1 text-[10.5px] text-slate-300">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Form values (<code className="text-cyan-300">input.value</code>) are never collected</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Raw HTML & DOM nodes are never sent</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Sensitive text is detected & redacted locally</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Luhn checksum validates cards before redacting</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* VIEW 3: DAY 4 AI SETTINGS */}
      {activeTabMode === 'settings' && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="bg-slate-900/70 rounded-xl p-3 border border-slate-800/80 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Google Gemini API Key</span>
              </div>
              <span
                className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full border ${
                  hasStoredKey
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                    : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                }`}
              >
                {hasStoredKey ? 'Connected' : 'Missing Key'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              Enter your Google Gemini API key to enable live AI page understanding and element guidance.
            </p>

            {/* Input Box */}
            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg py-2 pl-3 pr-10 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Model Selector with Auto-Detect */}
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-slate-400 font-medium">Gemini Model</label>
                <button
                  type="button"
                  onClick={handleDetectModels}
                  disabled={isDetectingModels}
                  className="text-[9.5px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Detect supported models for your API key"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isDetectingModels ? 'animate-spin' : ''}`} />
                  <span>{isDetectingModels ? 'Detecting...' : 'Auto-Detect'}</span>
                </button>
              </div>

              <select
                value={modelSelect}
                onChange={(e) => setModelSelect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg py-1.5 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
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
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Settings</span>
              </button>

              {hasStoredKey && (
                <button
                  onClick={handleClearApiKey}
                  className="bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800/60 border border-slate-700 text-slate-400 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Remove stored key"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {settingsFeedback && (
              <div
                className={`p-2 rounded-lg text-xs flex items-center gap-1.5 border animate-fade-in ${
                  settingsFeedback.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-800/60 text-rose-200'
                }`}
              >
                {settingsFeedback.type === 'success' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span className="text-[10.5px]">{settingsFeedback.text}</span>
              </div>
            )}
          </div>

          {/* Privacy Note Card */}
          <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/60 flex flex-col gap-1.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Local Storage Security</span>
            </div>
            <p className="leading-relaxed text-[10.5px]">
              Your API key is stored strictly within your browser's <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">chrome.storage.local</code>. It is never logged, never exposed to webpage scripts, and used solely for direct communication with Gemini API.
            </p>
          </div>
        </div>
      )}

      {/* VIEW 4: DAY 1 CONNECTION TEST */}
      {activeTabMode === 'test' && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <button
            id="aura-test-connection-btn"
            onClick={handleTestConnection}
            disabled={connStatus === 'loading'}
            className="aura-btn-gradient relative w-full py-2.5 px-4 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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

          <section className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/70 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Communication Pipeline</span>
              </div>
              {connLatency !== null && (
                <span className="text-[9.5px] font-mono text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/40">
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
                      ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                      : step.status === 'active'
                      ? 'bg-indigo-950/40 border-indigo-700/60 text-indigo-300 animate-pulse'
                      : step.status === 'error'
                      ? 'bg-rose-950/30 border-rose-800/50 text-rose-300'
                      : 'bg-slate-950/40 border-slate-800/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="truncate">{step.label}</span>
                    {step.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                    {step.status === 'active' && <Radio className="w-3 h-3 text-indigo-400 animate-spin shrink-0" />}
                    {step.status === 'error' && <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />}
                  </div>
                  <p className="text-[9px] opacity-75 mt-0.5 truncate">{step.detail}</p>
                </div>
              ))}
            </div>

            {connStatus !== 'idle' && (
              <div
                className={`p-2 rounded-lg text-xs flex items-start gap-2 border ${
                  connStatus === 'success'
                    ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-200'
                    : connStatus === 'error'
                    ? 'bg-rose-950/50 border-rose-800/60 text-rose-200'
                    : 'bg-indigo-950/50 border-indigo-800/60 text-indigo-200'
                }`}
              >
                {connStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                {connStatus === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />}
                {connStatus === 'loading' && <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0 mt-0.5" />}
                <span className="leading-snug text-[10.5px]">{connMessage}</span>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Footer Info */}
      <footer className="flex items-center justify-between text-[9.5px] text-slate-500 pt-1 border-t border-slate-900">
        <span>Manifest V3 &bull; Privacy Shield &bull; Gemini AI</span>
        <span className="font-mono text-slate-400">Day 5 Complete</span>
      </footer>
    </div>
  );
}
