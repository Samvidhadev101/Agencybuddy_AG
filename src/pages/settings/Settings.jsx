import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { 
  Settings as SettingsIcon, Shield, Bell, UserCheck, 
  Trash2, AlertTriangle, Eye, EyeOff, Save, Star, BarChart3, AlertCircle, CheckCircle2, XCircle, Search, ChevronDown
} from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const navigate = useNavigate();

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      
      {/* Sub-tabs menu */}
      <div className="border-b border-border-light pb-2 flex gap-4 text-xs font-mono">
        {[
          { id: 'general', label: 'General Info' },
          { id: 'whitelabel', label: 'White-label Customizer' },
          { id: 'notifications', label: 'Notification Settings' },
          { id: 'feedback', label: 'Exit Feedback Logs' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-1.5 px-3 rounded transition-colors cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-[#ECFEFF] text-primary-cyan border border-primary-cyan/20 font-bold' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="bg-panel-white border border-border-light rounded shadow-sm p-6">
        {activeTab === 'general' && (
          <>
            <AiConfiguration />
            <GeneralSettings />
          </>
        )}
        {activeTab === 'whitelabel' && <WhiteLabelSettings />}
        {activeTab === 'notifications' && <NotificationToggles />}
        {activeTab === 'feedback' && <ExitFeedbackAdmin />}
      </div>

    </div>
  );
}

// ----------------------------------------------------
// Sub-Tab 1: General Info
// ----------------------------------------------------
function GeneralSettings() {
  const { agency, theme, updateTheme } = useApp();
  const [name, setName] = useState('');
  const [web, setWeb] = useState('');
  const [autoAeo, setAutoAeo] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (agency) {
      setName(agency.name || '');
      setWeb(agency.website || '');
      setAutoAeo(agency.auto_aeo_on_client_add !== false);
    }
  }, [agency]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!agency) return;

    try {
      const agencies = JSON.parse(localStorage.getItem('db_agencies') || '[]');
      const updated = agencies.map(a =>
        a.id === agency.id
          ? { ...a, name: name.trim(), website: web.trim(), auto_aeo_on_client_add: autoAeo }
          : a
      );
      localStorage.setItem('db_agencies', JSON.stringify(updated));
      window.dispatchEvent(new Event('local_db_change'));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('Failed to save settings: ' + e.message);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-md text-xs">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Agency Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none" 
          />
        </div>
        <div className="space-y-1">
          <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Agency Website</label>
          <input 
            type="text" 
            value={web} 
            onChange={e => setWeb(e.target.value)} 
            className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none" 
          />
        </div>
      </div>

      <div className="space-y-1 pt-2">
        <label className="block font-mono text-[11px] font-bold text-text-secondary uppercase">THEME</label>
        <div className="flex border border-border-light rounded overflow-hidden w-fit">
          {['light', 'dark', 'system'].map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => updateTheme(opt)}
              className={`px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                theme === opt 
                  ? 'bg-primary-cyan text-white' 
                  : 'bg-panel-white text-text-secondary hover:bg-page-bg hover:text-text-primary'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-border-light">
        <label className="block font-mono text-[11px] font-bold text-text-secondary uppercase">AUTOMATION PREFERENCES</label>
        <label className="flex items-start gap-2 cursor-pointer mt-2">
          <input 
            type="checkbox" 
            checked={autoAeo}
            onChange={(e) => setAutoAeo(e.target.checked)}
            className="text-primary-cyan mt-1" 
          />
          <div className="flex flex-col">
            <span className="font-medium text-text-primary">Auto-run AEO audit on new clients</span>
            <span className="text-[10px] text-text-secondary mt-0.5 max-w-sm">
              AEO uses Perplexity Sonar and draws from your OpenRouter balance. Turn off to run AEO manually instead. SEO audits always run automatically (free).
            </span>
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button 
          type="submit" 
          className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Save size={13} />
          Save Settings
        </button>
        {saved && (
          <span className="text-success-green font-mono text-[10px] font-bold animate-pulse">
            ✓ CONFIGURATION SAVED
          </span>
        )}
      </div>
    </form>
  );
}

// ----------------------------------------------------
// Sub-Tab 2: White Label Branding
// ----------------------------------------------------
function WhiteLabelSettings() {
  const [primaryColor, setPrimaryColor] = useState('#06B6D4');
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Primary Branding Color</label>
          <div className="flex gap-2 items-center">
            <input 
              type="color" 
              value={primaryColor} 
              onChange={e => setPrimaryColor(e.target.value)} 
              className="w-10 h-8 border border-border-light rounded cursor-pointer"
            />
            <input 
              type="text" 
              value={primaryColor} 
              onChange={e => setPrimaryColor(e.target.value)} 
              className="border border-border-light rounded px-2 py-1 text-xs w-32 font-mono"
            />
          </div>
        </div>

        <button 
          onClick={() => alert('Branding profile saved. Reports will render in selected color themes.')}
          className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer"
        >
          Save Whitelabel settings
        </button>
      </div>

      {/* Live Preview Panel */}
      <div className="p-4 bg-page-bg/40 border border-border-light rounded space-y-3">
        <span className="font-mono text-[9px] font-bold text-text-muted uppercase block border-b border-page-bg pb-1">
          REPORT PREVIEW SCREEN
        </span>
        
        <div 
          className="bg-panel-white border rounded shadow p-4 text-xs font-sans space-y-2"
          style={{ borderTop: `4px solid ${primaryColor}` }}
        >
          <h4 className="font-bold text-text-primary text-[11px]">Organic Marketing Performance Card</h4>
          <p className="text-[10px] text-text-secondary">Summary details generated in branding template configurations.</p>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Tab 3: Notification Toggles
// ----------------------------------------------------
function NotificationToggles() {
  return (
    <div className="space-y-3 text-xs text-text-secondary">
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" defaultChecked className="text-primary-cyan" />
        <span>Notify on critical negative reviews drops alerts</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" defaultChecked className="text-primary-cyan" />
        <span>Notify when scheduled email campaigns send successfully</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="text-primary-cyan" />
        <span>Notify when monthly invoice generates</span>
      </label>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Tab 4: Exit Feedback Admin dashboard
// ----------------------------------------------------
function ExitFeedbackAdmin() {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    supabase.from('exit_feedback').order('created_at', { ascending: false }).then(({ data }) => {
      setFeedbacks(data || []);
    });
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h4 className="font-mono text-[10px] font-bold text-text-secondary uppercase">
          Client Exit survey logs
        </h4>
        <p className="text-xs text-text-secondary">Review reasons and rating profiles logged by cancelling accounts.</p>
      </div>

      {/* Table list */}
      <div className="bg-panel-white border border-border-light rounded overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-page-bg/40 border-b border-border-light text-[9px] font-mono text-text-secondary uppercase">
              <th className="py-2.5 px-4 font-semibold">Exit Type</th>
              <th className="py-2.5 px-4 font-semibold">Reason</th>
              <th className="py-2.5 px-4 font-semibold text-center">Satisfaction</th>
              <th className="py-2.5 px-4 font-semibold">Competitor</th>
              <th className="py-2.5 px-4 font-semibold">Remarks / Comments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-page-bg">
            {feedbacks.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-text-secondary">
                  No cancellation feedbacks stored in the system databases.
                </td>
              </tr>
            ) : (
              feedbacks.map(f => (
                <tr key={f.id} className="hover:bg-page-bg/10 transition-colors">
                  <td className="py-3 px-4 font-semibold text-text-primary uppercase font-mono text-[10px]">
                    {f.exit_type?.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 text-text-secondary capitalize">
                    {f.reason?.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-yellow-500">
                    {f.satisfaction_rating} ★
                  </td>
                  <td className="py-3 px-4 font-semibold text-text-primary font-sans">
                    {f.competitor_name || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-text-secondary leading-relaxed max-w-xs truncate">
                    {f.additional_comments || f.reason_detail || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ----------------------------------------------------
// AI Configuration Component
// ----------------------------------------------------
function AiConfiguration() {
  const { agency } = useApp();
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('google/gemini-2.0-flash-exp:free');
  const [modelsList, setModelsList] = useState([]);
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState({ success: null, message: '' });
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (agency) {
      setApiKey(agency.openrouter_api_key || '');
      setModel(agency.preferred_model || 'google/gemini-2.0-flash-exp:free');
    }
    fetchModels();
  }, [agency]);

  const fetchModels = async () => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models');
      const data = await response.json();
      if (data.data) {
        setModelsList(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch OpenRouter models', err);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key first.' });
      return;
    }
    setTesting(true);
    setTestResult({ success: null, message: '' });
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`
        }
      });
      if (response.ok) {
        setTestResult({ success: true, message: 'Connected' });
      } else {
        const errText = await response.text();
        setTestResult({ success: false, message: 'Invalid Key: ' + errText });
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'Network error occurred.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!agency) return;

    try {
      const agencies = JSON.parse(localStorage.getItem('db_agencies') || '[]');
      const updated = agencies.map(a =>
        a.id === agency.id
          ? { ...a, openrouter_api_key: apiKey.trim(), preferred_model: model }
          : a
      );
      localStorage.setItem('db_agencies', JSON.stringify(updated));
      window.dispatchEvent(new Event('local_db_change'));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('Failed to save AI config: ' + e.message);
    }
  };

  const filteredModels = modelsList.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (searchQuery.toLowerCase() === 'free' && m.id.endsWith(':free'))
  );

  const groupedModels = filteredModels.reduce((acc, m) => {
    const provider = m.id.split('/')[0];
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(m);
    return acc;
  }, {});

  const currentSelectedModel = modelsList.find(m => m.id === model) || { name: model, id: model };

  return (
    <div className="mb-8 pb-8 border-b border-border-light">
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold text-text-primary font-sans leading-none tracking-tight">AI Configuration</h2>
        <p className="text-[14px] text-text-secondary mt-1">Connect your AI provider to power all AI features across the platform.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl text-xs">
        <div className="space-y-1 relative">
          <label className="block font-mono text-[11px] font-bold text-text-secondary uppercase">OPENROUTER API KEY</label>
          <div className="flex gap-2 items-start">
            <div className="flex-1 relative">
              <input 
                type={showKey ? 'text' : 'password'} 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)} 
                placeholder="sk-or-v1-xxxxxxxxxxxx"
                className="w-full border border-border-light rounded pl-2.5 pr-10 py-2 text-xs font-mono focus:outline-none focus:border-primary-cyan" 
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-2 text-text-secondary hover:text-text-primary cursor-pointer"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <div className="mt-1">
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-primary-cyan hover:underline">
                  Get your free API key from openrouter.ai/keys
                </a>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
                <button 
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-55 whitespace-nowrap"
                >
                {testing ? 'Testing...' : 'Test Connection'}
                </button>
                {testResult.success !== null && (
                    <div className={`mt-2 flex items-center gap-1 text-[11px] font-bold ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                        {testResult.success ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                        {testResult.message}
                    </div>
                )}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block font-mono text-[11px] font-bold text-text-secondary uppercase">PREFERRED AI MODEL</label>
          <div className="relative">
            <div 
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                if (!isDropdownOpen && modelsList.length === 0) fetchModels();
              }}
              className="w-full border border-border-light rounded px-3 py-2 text-xs bg-panel-white cursor-pointer flex justify-between items-center"
            >
              <div className="flex flex-col">
                <span className="font-sans text-[14px] text-text-primary font-medium">{currentSelectedModel.name}</span>
                <span className="font-mono text-[11px] text-text-muted">{currentSelectedModel.id}</span>
              </div>
              <ChevronDown size={16} className="text-text-secondary" />
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-panel-white border border-border-light rounded shadow-xl max-h-[300px] flex flex-col">
                <div className="p-2 border-b border-border-light sticky top-0 bg-panel-white">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2 text-text-muted" />
                    <input 
                      type="text" 
                      placeholder="Search models... (type 'free' for free models)"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className="w-full border border-border-light rounded pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:border-primary-cyan"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 p-1">
                  {Object.entries(groupedModels).map(([provider, models]) => (
                    <div key={provider} className="mb-2">
                      <div className="px-2 py-1 font-mono text-[11px] font-bold text-text-muted uppercase tracking-wider bg-slate-50 sticky top-0">
                        {provider}
                      </div>
                      {models.map(m => {
                        const isFree = m.id.endsWith(':free') || (m.pricing?.prompt === "0" && m.pricing?.completion === "0");
                        const ctx = m.context_length ? `${Math.round(m.context_length / 1000)}k ctx` : '';
                        const priceText = isFree ? 'FREE' : `$${parseFloat(m.pricing?.prompt || 0).toFixed(2)}/M in · $${parseFloat(m.pricing?.completion || 0).toFixed(2)}/M out`;
                        
                        return (
                          <div 
                            key={m.id}
                            onClick={() => {
                              setModel(m.id);
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className={`px-3 py-2 cursor-pointer rounded flex justify-between items-center ${model === m.id ? 'bg-cyan-50' : 'hover:bg-slate-50'}`}
                          >
                            <div className="flex flex-col truncate pr-4">
                              <span className="font-sans text-[14px] text-text-primary truncate">{m.name}</span>
                              <span className="font-mono text-[11px] text-text-muted truncate">{m.id}</span>
                            </div>
                            <div className="flex flex-col items-end shrink-0 pl-2">
                              {isFree ? (
                                <span className="font-mono text-[11px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">FREE</span>
                              ) : (
                                <span className="font-mono text-[11px] text-text-secondary">{priceText}</span>
                              )}
                              <span className="font-mono text-[10px] text-text-muted">{ctx}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  {Object.keys(groupedModels).length === 0 && (
                    <div className="p-4 text-center text-text-muted text-xs">No models found</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <p className="font-mono text-[11px] text-text-secondary mt-1">Free models have usage limits. Paid models charge to your OpenRouter balance.</p>
        </div>

        <div className="bg-[#F0FDFA] border border-primary-cyan rounded p-4">
          <h4 className="font-sans text-[13px] font-medium text-text-primary mb-2">Recommended for Agency OS</h4>
          <div className="space-y-1.5">
            <div className="font-mono text-[12px] text-text-secondary"><strong className="text-text-primary">Best Free:</strong> Google Gemini 2.0 Flash (Free)</div>
            <div className="font-mono text-[12px] text-text-secondary"><strong className="text-text-primary">Best Quality:</strong> Google Gemini 2.0 Flash (Paid) — $0.14/M tokens</div>
            <div className="font-mono text-[12px] text-text-secondary"><strong className="text-text-primary">Best Reasoning:</strong> DeepSeek V4 Flash — $0.14/M tokens</div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button 
            type="submit" 
            className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Save size={13} />
            Save AI Settings
          </button>
          {saved && (
            <span className="text-success-green font-mono text-[10px] font-bold animate-pulse">
              ✓ AI SETTINGS SAVED
            </span>
          )}
        </div>
      </form>
    </div>
  );
}


