import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import AiWarningBanner from '../../components/AiWarningBanner';
import { 
  Sparkles, ShieldAlert, Award, Globe, Plus, 
  ArrowUpRight, ChevronDown, ChevronRight, CheckCircle2, 
  Check, X, RefreshCw, BarChart3, AlertCircle 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AEO() {
  const location = useLocation();
  const currentPath = location.pathname;

  let content;
  if (currentPath.startsWith('/aeo/audit/')) {
    content = <AEOAuditResults />;
  } else if (currentPath === '/aeo/audit') {
    content = <AEOAuditRunner />;
  } else if (currentPath === '/aeo/tracker') {
    content = <AEOQueryTracker />;
  } else if (currentPath === '/aeo/recommendations') {
    content = <AEORecommendations />;
  } else {
    content = <AEODashboard />;
  }

  return (
    <div className="space-y-4">
      <AiWarningBanner />
      {content}
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 1: AEO Dashboard
// ----------------------------------------------------
function AEODashboard() {
  const { selectedClientId, activeClient, agency, forceRefresh } = useApp();
  const navigate = useNavigate();

  const [score, setScore] = useState(null);
  const [queries, setQueries] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (selectedClientId) {
      loadData(selectedClientId);
    }
  }, [selectedClientId, forceRefresh]);

  const loadData = async (clientId) => {
    const allScores = JSON.parse(localStorage.getItem('db_aeo_scores') || '[]');
    const clientScores = allScores.filter(s => s.client_id === clientId);
    clientScores.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    if (clientScores.length > 0) {
      setScore(clientScores[clientScores.length - 1]);
      setHistory(clientScores.slice(-10).map(s => ({
        date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: s.overall_score
      })));
    } else {
      setScore(null);
      setHistory([]);
    }

    const { data: qList } = await supabase.from('aeo_tracked_queries').eq('client_id', clientId).execute();
    setQueries(qList || []);
  };

  const trendData = history.length > 0 ? history : [
    { date: 'No Data', score: 0 }
  ];

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Navigation Header */}
      <div className="flex justify-between items-center bg-panel-white p-4 border border-border-light rounded shadow-sm">
         <div>
            <h2 className="text-sm font-bold text-text-primary">AEO Engine Dashboard</h2>
            <p className="text-xs text-text-secondary mt-1">Track AI visibility across major Large Language Models</p>
         </div>
         <div className="flex gap-2">
            <button onClick={() => navigate('/aeo/tracker')} className="bg-page-bg border border-border-light text-text-primary px-4 py-2 rounded text-xs font-bold hover:bg-gray-100 transition-colors">Manage Tracker</button>
            <button onClick={() => navigate('/aeo/audit')} className="bg-primary-cyan hover:bg-primary-cyan-hover text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors">Run New Audit</button>
         </div>
      </div>

      {/* Hero dark panel */}
      <div className="bg-dark-panel border border-dark-surface rounded-lg shadow-lg p-6 flex flex-col md:flex-row items-center justify-between text-white relative overflow-hidden h-44 select-none">
        <div className="space-y-2 z-10">
          <span className="font-mono text-[10px] font-bold text-primary-cyan uppercase tracking-wider block">
            AEO Visibility index score
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {score?.overall_score || 0}%
          </h2>
          <p className="text-xs text-text-muted leading-relaxed max-w-sm">
            Brand appearance frequency across AI Answer Engines (ChatGPT, Gemini, Perplexity, Claude).
          </p>
        </div>

        {/* Circular gauge background */}
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle className="stroke-dark-surface fill-none" cx="60" cy="60" r="45" strokeWidth="8" />
            <circle className="stroke-primary-cyan fill-none" cx="60" cy="60" r="45" strokeWidth="8" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * (score?.overall_score || 0)) / 100} strokeLinecap="round" />
          </svg>
          <span className="absolute font-mono font-bold text-xs text-primary-cyan">VISIBILITY</span>
        </div>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'ChatGPT', score: score?.chatgpt_score || 0 },
          { name: 'Google Gemini', score: score?.gemini_score || 0 },
          { name: 'Perplexity', score: score?.perplexity_score || 0 },
          { name: 'Claude', score: score?.copilot_score || 0 }
        ].map((item, idx) => (
          <div 
            key={idx} 
            className="bg-panel-white border border-border-light rounded p-4 flex flex-col justify-between h-24 shadow-sm"
          >
            <span className="font-semibold text-text-primary text-xs">{item.name}</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-lg font-bold text-text-primary font-mono">{item.score}%</span>
              {score && <span className={`text-[10px] font-mono font-bold flex items-center ${score.visibility_trend === 'downward' ? 'text-error-red' : 'text-success-green'}`}>
                 {score.visibility_trend === 'downward' ? '↓' : '↑'}
              </span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend line chart */}
        <div className="lg:col-span-2 bg-panel-white border border-border-light rounded shadow-sm p-4 flex flex-col h-80">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase border-b border-page-bg pb-2 mb-4">
            Platform visibility trends
          </span>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderRadius: '4px', border: 'none', color: '#FFF', fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                <Line type="monotone" dataKey="score" stroke="#06B6D4" strokeWidth={2.5} dot={{ fill: '#06B6D4' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Missing Opportunities */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-4 flex flex-col h-80 overflow-y-auto">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-2 mb-3">
            Missing Opportunities (Zero Citations)
          </span>
          <div className="space-y-2">
            {score?.top_queries_missing?.length > 0 ? (
               score.top_queries_missing.map((q, idx) => (
                 <div key={idx} className="p-2 border border-border-light rounded text-xs flex justify-between items-center">
                    <span className="truncate max-w-[70%]">{q}</span>
                    <button onClick={() => navigate('/aeo/recommendations')} className="text-[10px] bg-red-50 text-error-red px-2 py-1 rounded font-bold">Fix</button>
                 </div>
               ))
            ) : (
               <p className="text-xs text-text-muted">No missing queries recorded yet.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

function AEOAuditRunner() {
  const { agency, activeClient, forceRefresh, isAiEnabled } = useApp();
  const navigate = useNavigate();

  const [brand, setBrand] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [queriesList, setQueriesList] = useState([]);

  useEffect(() => {
    if (activeClient) {
      setBrand(activeClient.name);
    }
  }, [activeClient]);

  const handleGenerateQueries = async () => {
    if (!brand) return alert('Brand name is required first.');
    
    setGenerating(true);
    try {
      const { data } = await supabase.functions.invoke('ai-generate', {
        body: {
          action: 'aeo-query-gen',
          input: { clientName: brand, industry: activeClient?.industry || 'services' },
          agency_id: agency.id
        }
      });
      const generated = JSON.parse(data.output);
      setQueriesList(generated.slice(0, 5).map(q => ({ text: q, status: 'pending' }))); // Limit to 5 for UI default
    } catch (e) {
      alert('Failed generating queries.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddQuery = () => {
    setQueriesList([...queriesList, { text: '', status: 'pending' }]);
  };

  const updateQueryText = (idx, text) => {
    const list = [...queriesList];
    list[idx].text = text;
    setQueriesList(list);
  };

  const runFullAudit = async (e) => {
    e.preventDefault();
    if (!brand) return;
    const validQueries = queriesList.filter(q => q.text.trim() !== '');
    if (validQueries.length === 0) return alert('Add at least one query.');
    const totalCost = validQueries.length * 2;

    setLoading(true);

    try {
      for (let i = 0; i < queriesList.length; i++) {
        const q = queriesList[i];
        if (!q.text.trim()) continue;
        
        await supabase.functions.invoke('ai-generate', {
          body: {
            action: 'aeo-run-check',
            input: { query: q.text, brand_name: brand, competitors, client_id: activeClient.id },
            agency_id: agency.id
          }
        });
        
        setQueriesList(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'checked' } : item));
      }

      const scoreRes = await supabase.functions.invoke('ai-generate', {
        body: {
          action: 'aeo-calculate-score',
          input: { client_id: activeClient.id },
          agency_id: agency.id
        }
      });

      // Update onboarding progress for 'check_aeo'
      const onboardingSteps = JSON.parse(localStorage.getItem('db_onboarding_progress') || '[]');
      const updatedOnboarding = onboardingSteps.map(step => 
        step.step_key === 'check_aeo' ? { ...step, is_completed: true, completed_at: new Date().toISOString() } : step
      );
      localStorage.setItem('db_onboarding_progress', JSON.stringify(updatedOnboarding));

      window.dispatchEvent(new Event('local_db_change'));
      forceRefresh();
      
      alert('AEO Engine scan completed.');
      if (scoreRes.data && scoreRes.data.id) {
         navigate('/aeo/audit/' + scoreRes.data.id);
      } else {
         navigate('/aeo');
      }
    } catch (e) {
      alert('Failed running AEO crawl checks.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans py-8 animate-fade-in">
      <div className="bg-panel-white border border-border-light rounded-lg shadow p-6 space-y-4">
        
        <div className="border-b border-page-bg pb-3 text-center">
          <h2 className="text-sm font-mono uppercase font-bold text-text-primary tracking-wider">
            AEO LLM Engine Auditor
          </h2>
          <p className="text-xs text-text-secondary mt-1">Simulates consumer queries across primary LLM chat boxes to detect brand citations.</p>
        </div>

        {!loading ? (
          <form onSubmit={runFullAudit} className="space-y-4">
            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">Brand / Business Name</label>
              <input type="text" value={brand} onChange={e => setBrand(e.target.value)} className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs" />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">Competitors (Comma separated)</label>
              <input type="text" value={competitors} onChange={e => setCompetitors(e.target.value)} placeholder="e.g. Behrouz Biryani, Mani Biryani" className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs" />
            </div>

            <div className="space-y-2 border-t border-page-bg pt-4">
              <div className="flex items-center justify-between">
                <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">Queries to check *</label>
                <button type="button" onClick={handleGenerateQueries} disabled={generating || !isAiEnabled()} title={!isAiEnabled() ? 'AI access not enabled for your account' : ''} className="text-[10px] bg-primary-cyan/10 text-primary-cyan px-2 py-1 rounded font-bold uppercase disabled:opacity-50">
                  {generating ? 'Generating...' : 'AI Generate Queries'}
                </button>
              </div>
              <div className="space-y-2">
                {queriesList.map((q, idx) => (
                   <input key={idx} type="text" value={q.text} onChange={e => updateQueryText(idx, e.target.value)} className="w-full border border-border-light rounded px-2.5 py-1 text-xs" placeholder="Search query..." />
                ))}
              </div>
              <button type="button" onClick={handleAddQuery} className="text-xs text-primary-cyan font-semibold flex items-center gap-1 mt-2">
                 <Plus size={12} /> Add Query
              </button>
            </div>

            <div className="pt-4 border-t border-border-light">
              <button type="submit" disabled={!isAiEnabled()} title={!isAiEnabled() ? 'AI access not enabled for your account' : ''} className="w-full py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white text-xs font-semibold rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                LAUNCH AEO SCAN CRAWLER
              </button>
            </div>
          </form>
        ) : (
          <div className="py-6 space-y-4 text-xs">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="animate-spin text-primary-cyan" size={16} />
              <span className="font-mono text-text-secondary uppercase">Testing Platform APIs...</span>
            </div>

            <div className="border border-border-light rounded divide-y divide-page-bg">
              {queriesList.map((q, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-text-primary truncate max-w-[80%]">{q.text}</span>
                  {q.status === 'checked' ? (
                    <span className="text-success-green font-mono font-bold flex items-center gap-0.5"><Check size={12} /> CHECKED</span>
                  ) : (
                    <span className="text-text-muted font-mono animate-pulse">TESTING...</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 3: AEO Query Tracker
// ----------------------------------------------------
function AEOQueryTracker() {
  const { selectedClientId, agency, forceRefresh } = useApp();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newQuery, setNewQuery] = useState('');

  useEffect(() => {
    if (selectedClientId) loadTracker(selectedClientId);
  }, [selectedClientId, forceRefresh]);

  const loadTracker = (clientId) => {
    const all = JSON.parse(localStorage.getItem('db_aeo_tracked_queries') || '[]');
    setQueries(all.filter(q => q.client_id === clientId));
  };

  const handleAdd = () => {
    if(!newQuery.trim()) return;
    const all = JSON.parse(localStorage.getItem('db_aeo_tracked_queries') || '[]');
    all.push({
      id: 'trk_' + Math.random().toString(36).substring(2, 9),
      client_id: selectedClientId,
      agency_id: agency.id,
      query: newQuery.trim(),
      is_active: true,
      created_at: new Date().toISOString()
    });
    localStorage.setItem('db_aeo_tracked_queries', JSON.stringify(all));
    setNewQuery('');
    loadTracker(selectedClientId);
  };

  const checkAll = async () => {
    const activeQ = queries.filter(q => q.is_active);
    if(activeQ.length === 0) return alert("No active queries.");

    setLoading(true);
    try {
      // Get the active client name/competitors for the checks
      const clients = JSON.parse(localStorage.getItem('db_clients') || '[]');
      const client = clients.find(c => c.id === selectedClientId);
      
      for(const q of activeQ) {
         await supabase.functions.invoke('ai-generate', {
            body: {
              action: 'aeo-run-check',
              input: { query: q.query, brand_name: client?.name || '', competitors: '', client_id: selectedClientId },
              agency_id: agency.id
            }
         });
      }
      await supabase.functions.invoke('ai-generate', {
        body: { action: 'aeo-calculate-score', input: { client_id: selectedClientId }, agency_id: agency.id }
      });
      forceRefresh();
      alert("Tracker checks completed!");
    } catch(e) {
      alert("Error running checks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-sans animate-fade-in max-w-4xl mx-auto py-4">
      <div className="flex justify-between items-center bg-panel-white p-4 border border-border-light rounded shadow-sm">
        <div className="flex items-center gap-2">
           <input type="text" value={newQuery} onChange={e=>setNewQuery(e.target.value)} placeholder="Add new tracked query..." className="border border-border-light rounded px-2 py-1 text-xs w-64" />
           <button onClick={handleAdd} className="bg-primary-cyan text-white px-3 py-1 rounded text-xs font-bold">Add</button>
        </div>
        <button onClick={checkAll} disabled={loading} className="bg-primary-cyan text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1">
          {loading ? 'Checking...' : 'Check All Active'}
        </button>
      </div>

      <div className="bg-panel-white border border-border-light rounded shadow-sm">
         <table className="w-full text-left text-xs">
           <thead className="bg-page-bg border-b border-border-light">
             <tr>
               <th className="p-3 font-semibold">Tracked Query</th>
               <th className="p-3 font-semibold">Status</th>
               <th className="p-3 font-semibold">Added</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-border-light">
             {queries.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-text-muted">No tracked queries.</td></tr>}
             {queries.map((q, i) => (
               <tr key={i}>
                 <td className="p-3 font-mono text-[11px] text-text-primary">{q.query}</td>
                 <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${q.is_active ? 'bg-green-50 text-success-green' : 'bg-gray-100 text-gray-500'}`}>{q.is_active ? 'Active' : 'Paused'}</span></td>
                 <td className="p-3 text-text-muted">{new Date(q.created_at).toLocaleDateString()}</td>
               </tr>
             ))}
           </tbody>
         </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 4: AEO Recommendations & Content gap
// ----------------------------------------------------
function AEORecommendations() {
  const { agency, activeClient, forceRefresh, isAiEnabled } = useApp();
  const navigate = useNavigate();
  
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeClient) loadRecs();
  }, [activeClient, forceRefresh]);

  const loadRecs = () => {
    const allRecs = JSON.parse(localStorage.getItem('db_aeo_recommendations') || '[]');
    const clientRecs = allRecs.filter(r => r.client_id === activeClient.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    if (clientRecs.length > 0) {
      setRecs(clientRecs[0].recommendations);
    }
  };

  const handleRefreshRecs = async () => {

    setLoading(true);
    try {
      const allScores = JSON.parse(localStorage.getItem('db_aeo_scores') || '[]');
      const scoreRow = allScores.find(s => s.client_id === activeClient.id);
      await supabase.functions.invoke('ai-generate', {
         body: {
           action: 'aeo-recommendations',
           input: { client_id: activeClient.id, missing_queries: (scoreRow?.top_queries_missing || []).join(', '), score: scoreRow?.overall_score || 0 },
           agency_id: agency.id
         }
      });
      forceRefresh();
    } catch(e) {
      alert("Failed to refresh recommendations");
    } finally {
      setLoading(false);
    }
  }
  
  const handleCreateContent = (topic) => {
    navigate('/content/writer', { state: { prefilledTopic: topic } });
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">AEO Recommendations</h2>
          <p className="text-xs text-text-secondary">AI-generated tasks to improve answer engine visibility.</p>
        </div>
        <button onClick={handleRefreshRecs} disabled={loading || !isAiEnabled()} title={!isAiEnabled() ? 'AI access not enabled for your account' : ''} className="bg-primary-cyan text-white px-3 py-1.5 rounded text-xs font-bold disabled:opacity-50">
          {loading ? 'Analyzing...' : 'Generate New Recs'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recs.length === 0 && <p className="text-xs text-text-muted col-span-2">No recommendations found. Run an audit or click Refresh.</p>}
        {recs.map((item, idx) => (
          <div key={idx} className="bg-panel-white border border-border-light rounded p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className={`border text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${item.priority === 'high' ? 'bg-red-50 border-red-200 text-error-red' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                {item.priority} PRIORITY CONTENT GAP
              </span>
              <h4 className="text-xs font-semibold text-text-primary">{item.title}</h4>
              <p className="text-[11px] text-text-secondary leading-relaxed">{item.reason}</p>
              <div className="text-[10px] text-text-muted font-mono leading-none">
                Target queries: {item.queries}
              </div>
            </div>
            
            <button 
              onClick={() => handleCreateContent(item.title)}
              className="w-full py-1.5 bg-[#ECFEFF] border border-[#06B6D41A] hover:bg-primary-cyan hover:text-white text-primary-cyan rounded text-xs font-semibold cursor-pointer transition-all duration-150 pt-2"
            >
              Compose Blog Copy in AI Writer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 5: AEO Audit Results
// ----------------------------------------------------
function AEOAuditResults() {
  const { activeClient, isAiEnabled } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const scoreId = location.pathname.split('/').pop();

  const [scoreData, setScoreData] = useState(null);
  const [checks, setChecks] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    const scores = JSON.parse(localStorage.getItem('db_aeo_scores') || '[]');
    const s = scores.find(x => x.id === scoreId);
    if (s) {
      setScoreData(s);
      const allChecks = JSON.parse(localStorage.getItem('db_aeo_checks') || '[]');
      // simple timeframe filter to match the run (getting latest check per query per platform)
      const recent = allChecks.filter(c => c.client_id === s.client_id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      
      const uniqueQueries = [...new Set(recent.map(c => c.query_tested))];
      const aggregated = uniqueQueries.map(q => {
         const qChecks = recent.filter(c => c.query_tested === q);
         return {
           query: q,
           platforms: {
             chatgpt: qChecks.find(c => c.platform === 'chatgpt'),
             gemini: qChecks.find(c => c.platform === 'gemini'),
             perplexity: qChecks.find(c => c.platform === 'perplexity'),
             claude: qChecks.find(c => c.platform === 'claude'),
           }
         };
      });
      setChecks(aggregated);
    }
  }, [scoreId]);

  if (!scoreData) return <div className="p-8 text-center text-xs">Loading Results...</div>;

  return (
    <div className="space-y-6 font-sans animate-fade-in max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-sm font-mono uppercase font-bold text-text-primary">AEO Audit Results</h2>
          <p className="text-xs text-text-secondary">Visibility analysis for {activeClient?.name}</p>
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-border-light bg-page-bg/50">
          <button onClick={() => navigate('/aeo/recommendations')} disabled={!isAiEnabled()} title={!isAiEnabled() ? 'AI access not enabled for your account' : ''} className="bg-primary-cyan text-white px-3 py-1.5 rounded text-xs font-bold disabled:opacity-50">Get Recommendations</button>
          <button className="border border-border-light bg-panel-white text-text-primary px-3 py-1.5 rounded text-xs font-bold cursor-not-allowed">Export PDF</button>
        </div>
      </div>

      <div className="bg-dark-panel rounded-lg shadow p-6 flex flex-col md:flex-row items-center justify-between text-white overflow-hidden h-32 select-none relative">
        <div className="space-y-1 z-10">
          <span className="font-mono text-[10px] font-bold text-primary-cyan uppercase">Overall Visibility Score</span>
          <h2 className="text-3xl font-extrabold">{scoreData.overall_score}%</h2>
        </div>
        <div className="flex gap-6 z-10 text-center">
          <div><div className="text-lg font-bold text-success-green">{scoreData.chatgpt_score}%</div><div className="text-[10px] text-text-muted font-mono">ChatGPT</div></div>
          <div><div className="text-lg font-bold text-success-green">{scoreData.gemini_score}%</div><div className="text-[10px] text-text-muted font-mono">Gemini</div></div>
          <div><div className="text-lg font-bold text-success-green">{scoreData.perplexity_score}%</div><div className="text-[10px] text-text-muted font-mono">Perplexity</div></div>
          <div><div className="text-lg font-bold text-success-green">{scoreData.copilot_score}%</div><div className="text-[10px] text-text-muted font-mono">Claude</div></div>
        </div>
      </div>

      <div className="bg-panel-white border border-border-light rounded shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-page-bg border-b border-border-light">
            <tr>
              <th className="p-3 font-semibold">Test Query</th>
              <th className="p-3 font-semibold text-center">ChatGPT</th>
              <th className="p-3 font-semibold text-center">Gemini</th>
              <th className="p-3 font-semibold text-center">Perplexity</th>
              <th className="p-3 font-semibold text-center">Claude</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {checks.map((row, i) => (
              <React.Fragment key={i}>
                <tr className="hover:bg-page-bg/50 cursor-pointer transition-colors" onClick={() => setExpandedRow(expandedRow === i ? null : i)}>
                  <td className="p-3 font-mono text-[11px] text-text-primary max-w-xs truncate">{row.query}</td>
                  {['chatgpt', 'gemini', 'perplexity', 'claude'].map(p => {
                    const c = row.platforms[p];
                    const cited = c && c.brand_mentioned;
                    return (
                      <td key={p} className="p-3 text-center">
                        {cited ? <CheckCircle2 className="inline text-primary-cyan" size={14}/> : <X className="inline text-error-red" size={14}/>}
                      </td>
                    );
                  })}
                </tr>
                {expandedRow === i && (
                  <tr className="bg-page-bg/30">
                    <td colSpan="5" className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['chatgpt', 'gemini', 'perplexity', 'claude'].map(p => {
                          const c = row.platforms[p];
                          if(!c) return null;
                          return (
                            <div key={p} className="border border-border-light bg-panel-white rounded p-3 space-y-2">
                               <div className="flex justify-between items-center border-b border-page-bg pb-1">
                                 <span className="font-bold text-text-primary capitalize">{p}</span>
                                 <span className="text-[10px] font-mono text-text-secondary">{c.mention_position ? `Pos: ${c.mention_position}` : 'No mention'}</span>
                               </div>
                               <p className="text-[10px] text-text-secondary leading-relaxed max-h-32 overflow-y-auto font-mono whitespace-pre-wrap">
                                  {c.full_response}
                               </p>
                            </div>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
