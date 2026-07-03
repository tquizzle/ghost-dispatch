import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Key, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Info, 
  BookOpen, 
  Globe, 
  Compass,
  AlertTriangle
} from 'lucide-react';

interface SettingsViewProps {
  onConfigChanged: () => void;
}

export default function SettingsView({ onConfigChanged }: SettingsViewProps) {
  const [apiUrl, setApiUrl] = useState('');
  const [adminApiKey, setAdminApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message?: string;
    siteTitle?: string;
  }>({ tested: false, success: false });

  // Load active configuration from backend
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setApiUrl(data.apiUrl || '');
      setAdminApiKey(data.adminApiKey || '');
      if (data.isConnected) {
        setConnectionStatus({
          tested: true,
          success: true,
          message: 'Active stable connection established to Ghost CMS Admin endpoints.'
        });
      }
    } catch (err) {
      console.error('Failed to load Ghost config', err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setConnectionStatus({ tested: false, success: false });

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiUrl, adminApiKey })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Connection failed');

      setConnectionStatus({
        tested: true,
        success: data.isConnected,
        siteTitle: data.siteTitle,
        message: data.isConnected 
          ? `Connected successfully! Active site title: "${data.siteTitle}"` 
          : 'Disconnected.'
      });
      onConfigChanged();
    } catch (err: any) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: err.message || 'Failed to verify Admin API key connection.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiUrl: '', adminApiKey: '' })
      });
      if (res.ok) {
        setApiUrl('');
        setAdminApiKey('');
        setConnectionStatus({
          tested: true,
          success: false,
          message: 'Ghost CMS config cleared successfully.'
        });
        onConfigChanged();
      }
    } catch (err) {
      console.error('Failed to disconnect', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-[#EAEAEA]">
      {/* Header */}
      <div className="border-b border-[#333333] pb-4">
        <h1 className="font-syne font-extrabold text-4xl text-white uppercase tracking-tighter flex items-center space-x-3">
          <Server className="w-6 h-6 text-[#00FF9D]" />
          <span>Ghost CMS Integration Portal</span>
        </h1>
        <p className="text-xs text-[#8A8782] mt-1.5 font-mono uppercase tracking-wider">
          Configure connection strings, API key credentials, and test authentication endpoints for live publishing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Controls */}
        <div className="md:col-span-2 space-y-4">
          <form onSubmit={handleConnect} className="bg-[#1A1A1C] border border-[#333333] p-6 rounded-none space-y-5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#8A8782] border-b border-[#333333] pb-2">Connection Settings</h3>

            {/* API URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#EAEAEA] uppercase tracking-wider flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-[#00FF9D]" />
                <span>Ghost Blog URL</span>
              </label>
              <input
                type="url"
                required
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="HTTPS://YOUR-BLOG.GHOST.IO"
                className="w-full bg-[#111113] border border-[#333333] rounded-none px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00FF9D] font-mono shadow-inner"
              />
              <span className="text-[10px] text-[#8A8782] font-mono uppercase tracking-wider block">The base URL of your Ghost CMS publication, including https://.</span>
            </div>

            {/* Admin API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#EAEAEA] uppercase tracking-wider flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-[#00FF9D]" />
                <span>Admin API Key</span>
              </label>
              <input
                type="password"
                required
                value={adminApiKey}
                onChange={(e) => setAdminApiKey(e.target.value)}
                placeholder="65E4FF88B6F345C2EA... (ID:SECRET)"
                className="w-full bg-[#111113] border border-[#333333] rounded-none px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00FF9D] font-mono shadow-inner"
              />
              <span className="text-[10px] text-[#8A8782] font-mono uppercase tracking-wider block">
                Retrieve from Ghost Admin &gt; Settings &gt; Integrations &gt; Custom Integration. Format: ID:SECRET.
              </span>
            </div>

            {/* Test / Save buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-[#00FF9D] hover:bg-[#00e08a] disabled:bg-[#333333] disabled:text-[#8A8782] text-[#111113] rounded-none text-xs font-mono font-bold uppercase tracking-widest cursor-pointer transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2 inline" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Test & Save Connection</span>
                )}
              </button>

              {connectionStatus.success && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="px-4 py-2.5 bg-transparent hover:bg-[#FF5F57]/10 text-[#FF5F57] border border-[#FF5F57]/40 hover:border-[#FF5F57] rounded-none text-xs font-mono font-bold uppercase tracking-widest transition-all cursor-pointer"
                >
                  Disconnect Blog
                </button>
              )}
            </div>
          </form>

          {/* Connection Result Indicator */}
          {connectionStatus.tested && (
            <div className={`p-5 border rounded-none flex items-start space-x-3 text-xs ${
              connectionStatus.success 
                ? 'bg-[#00FF9D]/5 border-[#00FF9D]/20 text-white' 
                : 'bg-[#FF5F57]/5 border-[#FF5F57]/20 text-white'
            }`}>
              {connectionStatus.success ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#00FF9D]" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#FF5F57]" />
              )}
              <div className="space-y-1">
                <span className={`font-mono font-bold uppercase tracking-widest block ${
                  connectionStatus.success ? 'text-[#00FF9D]' : 'text-[#FF5F57]'
                }`}>
                  {connectionStatus.success ? 'Success: API Key Active' : 'Error: Verification Failed'}
                </span>
                <p className="leading-relaxed text-[#A0A0A0] font-sans">{connectionStatus.message}</p>
                {connectionStatus.success && (
                  <p className="text-[10px] text-[#00FF9D] font-mono mt-1 font-bold uppercase tracking-wider">
                    System stands ready to dispatch publish events directly.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Informational Sidebar */}
        <div className="space-y-4">
          {/* Simulation mode info */}
          <div className="bg-[#1A1A1C] border border-[#333333] p-5 rounded-none space-y-3">
            <h4 className="text-xs font-syne font-bold text-white flex items-center space-x-1.5 uppercase tracking-widest">
              <Compass className="w-4 h-4 text-[#00FF9D]" />
              <span>Simulation Mode active</span>
            </h4>
            <p className="text-[11px] text-[#A0A0A0] leading-relaxed font-mono uppercase tracking-wide">
              If you don't have a live Ghost CMS account or API credentials ready, this desktop application operates in **Simulation Mode** seamlessly.
            </p>
            <p className="text-[11px] text-[#A0A0A0] leading-relaxed font-mono uppercase tracking-wide">
              You can write posts, schedule campaigns, see success logs, run AI-driven optimizations, and preview output payloads exactly as if you were posting live.
            </p>
          </div>

          {/* Guide card */}
          <div className="bg-[#1A1A1C] border border-[#333333] p-5 rounded-none space-y-3 text-xs text-[#A0A0A0]">
            <h4 className="font-syne font-bold text-white flex items-center space-x-1.5 uppercase tracking-widest">
              <BookOpen className="w-4 h-4 text-[#00FF9D]" />
              <span>API Credentials Guide</span>
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-[11px] leading-relaxed font-mono uppercase tracking-wider">
              <li>Log in to your Ghost Admin interface.</li>
              <li>Go to **Settings &gt; Integrations**.</li>
              <li>Click **Add custom integration** at the bottom.</li>
              <li>Name it (e.g. *Desktop Dispatcher*).</li>
              <li>Copy the displayed **API URL** and **Admin API Key** and input them here.</li>
            </ol>
            <div className="p-3 bg-[#111113] border border-[#333333] rounded-none flex items-start space-x-2 text-[10px] text-[#8A8782] leading-relaxed mt-2 uppercase font-mono">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#00FF9D]" />
              <span>Your private Admin keys are strictly processed on the backend server side and are never exposed to external actors.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
