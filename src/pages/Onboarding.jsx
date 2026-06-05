import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ChevronDown, Search, EyeOff, Eye } from 'lucide-react';

export default function Onboarding() {
  const { user, agency } = useApp();
  const navigate = useNavigate();
  
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('google/gemini-2.0-flash-exp:free');
  const [modelsList, setModelsList] = useState([]);
  const [showKey, setShowKey] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

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

  const handleNext = async () => {
    if (!agency) return;
    setLoading(true);
    try {
      const agencies = JSON.parse(localStorage.getItem('db_agencies') || '[]');
      const updated = agencies.map(a =>
        a.id === agency.id
          ? { ...a, openrouter_api_key: apiKey.trim(), preferred_model: model }
          : a
      );
      localStorage.setItem('db_agencies', JSON.stringify(updated));
      window.dispatchEvent(new Event('local_db_change'));
      
      // Delay to show transition
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (e) {
      alert('Failed to save config: ' + e.message);
      setLoading(false);
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
    <div className="min-h-screen bg-page-bg bg-grid-pattern flex items-center justify-center p-4 font-sans select-none animate-fade-in">
      <div className="w-full max-w-[500px] bg-panel-white border border-border-light rounded-xl shadow-2xl p-8 flex flex-col gap-6 relative overflow-hidden">
        
        {/* Step Indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
          <div className="h-full bg-primary-cyan w-1/2 rounded-r-full"></div>
        </div>

        {/* Header */}
        <div className="text-center space-y-3 mt-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-50 text-primary-cyan mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight font-inter">
            POWER UP YOUR AI
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed font-inter">
            Paste your OpenRouter API key to enable all AI features. It's free to get started.
          </p>
        </div>

        <div className="space-y-5 text-xs">
          
          {/* API Key */}
          <div className="space-y-1.5 relative">
            <label className="block font-mono text-[11px] font-bold text-text-secondary uppercase">OPENROUTER API KEY</label>
            <div className="relative">
              <input 
                type={showKey ? 'text' : 'password'} 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)} 
                placeholder="sk-or-v1-xxxxxxxxxxxx"
                className="w-full h-10 border border-border-light rounded-lg pl-3 pr-10 text-sm font-mono focus:outline-none focus:border-primary-cyan focus:ring-1 focus:ring-primary-cyan transition-all" 
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-text-secondary hover:text-text-primary cursor-pointer"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="mt-1.5 flex justify-end">
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-primary-cyan font-bold hover:underline flex items-center gap-1">
                Get your free key →
              </a>
            </div>
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] font-bold text-text-secondary uppercase">PREFERRED AI MODEL</label>
            <div className="relative">
              <div 
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  if (!isDropdownOpen && modelsList.length === 0) fetchModels();
                }}
                className="w-full h-11 border border-border-light rounded-lg px-3 flex justify-between items-center bg-panel-white cursor-pointer focus-within:border-primary-cyan focus-within:ring-1 focus-within:ring-primary-cyan transition-all"
              >
                <div className="flex flex-col justify-center">
                  <span className="font-sans text-[13px] text-text-primary font-medium">{currentSelectedModel.name}</span>
                  <span className="font-mono text-[10px] text-text-muted">{currentSelectedModel.id}</span>
                </div>
                <ChevronDown size={18} className="text-text-secondary" />
              </div>

              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-panel-white border border-border-light rounded-lg shadow-xl max-h-[250px] flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-border-light bg-slate-50">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-2.5 text-text-muted" />
                      <input 
                        type="text" 
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="w-full border border-border-light rounded pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:border-primary-cyan bg-panel-white"
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1 p-1">
                    {Object.entries(groupedModels).map(([provider, models]) => (
                      <div key={provider} className="mb-2">
                        <div className="px-2 py-1 font-mono text-[10px] font-bold text-text-muted uppercase tracking-wider bg-slate-50/50 sticky top-0 backdrop-blur-sm">
                          {provider}
                        </div>
                        {models.map(m => {
                          const isFree = m.id.endsWith(':free') || (m.pricing?.prompt === "0" && m.pricing?.completion === "0");
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
                                <span className="font-sans text-[13px] text-text-primary truncate">{m.name}</span>
                                <span className="font-mono text-[10px] text-text-muted truncate">{m.id}</span>
                              </div>
                              <div className="shrink-0">
                                {isFree && <span className="font-mono text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">FREE</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mt-4">
          <button 
            onClick={handleNext}
            disabled={loading}
            className="w-full h-11 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center shadow-sm"
          >
            {loading ? 'Saving...' : 'Next'}
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-xs text-text-muted hover:text-text-primary transition-colors text-center cursor-pointer"
          >
            Skip for now
          </button>
        </div>

      </div>
    </div>
  );
}
