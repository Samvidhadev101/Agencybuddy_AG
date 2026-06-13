import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { PARAMETER_CATALOG } from '../lib/dashboardCatalog';
import { 
  Settings, X, GripVertical, Check, ArrowUpRight, ArrowDownRight, 
  AlertTriangle, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';

const DEFAULT_PARAMS = ['seo_score', 'avg_rating', 'overdue_tasks', 'content_awaiting_approval', 'social_engagement'];

export default function Tier2Dashboard() {
  const { userProfile, agency, clients } = useApp();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [configId, setConfigId] = useState(null);
  const [selectedParams, setSelectedParams] = useState([]);
  
  // Customization Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [tempParams, setTempParams] = useState([]);

  // Data Store for all modules
  const [store, setStore] = useState({
    seo_audits: [], keyword_trackers: [], social_posts: [], gbp_listings: [],
    gbp_qa: [], reviews: [], content_items: [], aeo_scores: [], tasks: []
  });

  useEffect(() => {
    if (userProfile && agency) {
      loadDashboard();
    }
  }, [userProfile, agency]);

  const loadDashboard = async () => {
    setIsLoading(true);
    
    // 1. Fetch Configuration
    const { data: configs } = await supabase.from('dashboard_configs')
      .eq('user_id', userProfile.id)
      .eq('agency_id', agency.id);

    let currentParams = DEFAULT_PARAMS;
    if (configs && configs.length > 0) {
      setConfigId(configs[0].id);
      currentParams = configs[0].selected_parameters || DEFAULT_PARAMS;
    } else {
      // Create default config
      const { data: newConfig } = await supabase.from('dashboard_configs').insert({
        user_id: userProfile.id,
        agency_id: agency.id,
        selected_parameters: DEFAULT_PARAMS
      });
      if (newConfig) setConfigId(newConfig[0].id);
    }
    
    setSelectedParams(currentParams);
    setTempParams(currentParams);

    // 2. Fetch Module Data for all clients
    if (clients && clients.length > 0) {
      const clientIds = clients.map(c => c.id);
      
      const [
        { data: seoAudits }, { data: keywords }, { data: socialPosts },
        { data: gbpListings }, { data: gbpQa }, { data: reviews },
        { data: contentItems }, { data: aeoScores }, { data: tasks }
      ] = await Promise.all([
        supabase.from('seo_audits').in('client_id', clientIds),
        supabase.from('keyword_trackers').in('client_id', clientIds),
        supabase.from('social_posts').in('client_id', clientIds),
        supabase.from('gbp_listings').in('client_id', clientIds),
        supabase.from('gbp_qa').select('*'), // filter below
        supabase.from('reviews').in('client_id', clientIds),
        supabase.from('content_items').in('client_id', clientIds),
        supabase.from('aeo_scores').in('client_id', clientIds),
        supabase.from('tasks').in('client_id', clientIds)
      ]);

      const gbpListingIds = (gbpListings || []).map(g => g.id);
      const filteredQa = (gbpQa || []).filter(q => gbpListingIds.includes(q.listing_id));

      setStore({
        seo_audits: seoAudits || [],
        keyword_trackers: keywords || [],
        social_posts: socialPosts || [],
        gbp_listings: gbpListings || [],
        gbp_qa: filteredQa,
        reviews: reviews || [],
        content_items: contentItems || [],
        aeo_scores: aeoScores || [],
        tasks: tasks || []
      });
    }

    setIsLoading(false);
  };

  const saveConfiguration = async () => {
    setSelectedParams(tempParams);
    if (configId) {
      await supabase.from('dashboard_configs').eq('id', configId).update({
        selected_parameters: tempParams
      });
    } else {
      const { data: newConfig } = await supabase.from('dashboard_configs').insert({
        user_id: userProfile.id,
        agency_id: agency.id,
        selected_parameters: tempParams
      });
      if (newConfig) setConfigId(newConfig[0].id);
    }
    setIsPanelOpen(false);
  };

  const toggleParam = (paramId) => {
    if (tempParams.includes(paramId)) {
      setTempParams(tempParams.filter(id => id !== paramId));
    } else {
      setTempParams([...tempParams, paramId]);
    }
  };

  const moveParam = (index, direction) => {
    if (direction === 'up' && index > 0) {
      const newParams = [...tempParams];
      [newParams[index - 1], newParams[index]] = [newParams[index], newParams[index - 1]];
      setTempParams(newParams);
    } else if (direction === 'down' && index < tempParams.length - 1) {
      const newParams = [...tempParams];
      [newParams[index + 1], newParams[index]] = [newParams[index], newParams[index + 1]];
      setTempParams(newParams);
    }
  };

  // --- Metric Resolver ---
  const resolveMetric = (clientId, paramId) => {
    const paramDef = PARAMETER_CATALOG.find(p => p.id === paramId);
    if (!paramDef) return { value: 'N/A', health: 'neutral' };

    const now = new Date();
    let value = 'N/A';
    let health = 'neutral'; // 'good', 'neutral', 'bad', 'warning'
    let trend = null; // numeric or element

    switch (paramId) {
      case 'seo_score': {
        const audits = store.seo_audits.filter(a => a.client_id === clientId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        if (audits.length > 0) {
          value = audits[0].overall_score;
          if (audits.length > 1) {
            const diff = value - audits[1].overall_score;
            trend = diff > 0 ? `+${diff}` : diff;
            health = diff < 0 ? 'bad' : 'good';
          }
          if (value < 50) health = 'bad';
        }
        break;
      }
      case 'keyword_movement': {
        const kws = store.keyword_trackers.filter(k => k.client_id === clientId);
        if (kws.length > 0) {
          const up = kws.filter(k => k.current_rank < k.previous_rank).length;
          const down = kws.filter(k => k.current_rank > k.previous_rank).length;
          value = `${up} Up / ${down} Down`;
          health = down > up ? 'bad' : up > 0 ? 'good' : 'neutral';
        }
        break;
      }
      case 'organic_traffic': {
        const audits = store.seo_audits.filter(a => a.client_id === clientId);
        if (audits.length > 0) {
          value = '5.4k'; // Mock as source doesn't have exact traffic
          health = 'good';
        }
        break;
      }
      case 'social_engagement': {
        const posts = store.social_posts.filter(p => p.client_id === clientId && p.status === 'published');
        if (posts.length > 0) {
          const avg = posts.reduce((acc, p) => acc + (p.likes || 0), 0) / posts.length;
          value = `${(avg / 10).toFixed(1)}%`; // mock engagement calculation
          health = avg > 50 ? 'good' : 'neutral';
        }
        break;
      }
      case 'follower_growth': {
        value = '+120';
        health = 'good';
        break;
      }
      case 'posts_scheduled': {
        const posts = store.social_posts.filter(p => p.client_id === clientId && p.status === 'scheduled');
        value = posts.length.toString();
        health = posts.length === 0 ? 'warning' : 'good';
        break;
      }
      case 'gbp_rating': {
        value = '4.8';
        health = 'good';
        break;
      }
      case 'gbp_unanswered_qa': {
        const listings = store.gbp_listings.filter(l => l.client_id === clientId);
        const lIds = listings.map(l => l.id);
        const qas = store.gbp_qa.filter(q => lIds.includes(q.listing_id) && q.status === 'unanswered');
        value = qas.length.toString();
        health = qas.length > 0 ? 'bad' : 'good';
        break;
      }
      case 'avg_rating': {
        const revs = store.reviews.filter(r => r.client_id === clientId);
        if (revs.length > 0) {
          const avg = revs.reduce((acc, r) => acc + r.rating, 0) / revs.length;
          value = avg.toFixed(1);
          health = avg < 4.0 ? 'bad' : 'good';
        }
        break;
      }
      case 'unresponded_reviews': {
        const revs = store.reviews.filter(r => r.client_id === clientId && r.response_status === 'unresponded');
        value = revs.length.toString();
        health = revs.length > 0 ? 'warning' : 'good';
        if (revs.some(r => r.rating <= 3)) health = 'bad';
        break;
      }
      case 'content_awaiting_approval': {
        const items = store.content_items.filter(c => c.client_id === clientId && c.status === 'client_review');
        value = items.length.toString();
        health = items.length > 0 ? 'warning' : 'neutral';
        break;
      }
      case 'content_published': {
        const items = store.content_items.filter(c => c.client_id === clientId && c.status === 'published' && new Date(c.published_at).getMonth() === now.getMonth());
        value = items.length.toString();
        health = items.length > 0 ? 'good' : 'neutral';
        break;
      }
      case 'aeo_score': {
        const scores = store.aeo_scores.filter(a => a.client_id === clientId).sort((a,b)=>new Date(b.scored_at)-new Date(a.scored_at));
        if (scores.length > 0) {
          value = scores[0].overall_score;
          health = value >= 70 ? 'good' : value < 40 ? 'bad' : 'neutral';
        }
        break;
      }
      case 'overdue_tasks': {
        const t = store.tasks.filter(t => t.client_id === clientId && t.status !== 'done' && new Date(t.due_date) < new Date(now.toDateString()));
        value = t.length.toString();
        health = t.length > 0 ? 'bad' : 'good';
        break;
      }
      case 'open_tasks': {
        const t = store.tasks.filter(t => t.client_id === clientId && t.status !== 'done');
        value = t.length.toString();
        health = 'neutral';
        break;
      }
      case 'completion_rate': {
        const t = store.tasks.filter(t => t.client_id === clientId);
        if (t.length > 0) {
          const done = t.filter(x => x.status === 'done').length;
          value = `${Math.round((done / t.length) * 100)}%`;
          health = 'neutral';
        }
        break;
      }
    }

    return { label: paramDef.label, value, health, trend, type: paramDef.displayType };
  };

  const getHealthColors = (health) => {
    switch (health) {
      case 'bad': return 'text-error-red bg-red-50/50 border-error-red/20';
      case 'warning': return 'text-warning-amber bg-amber-50/50 border-warning-amber/20';
      case 'good': return 'text-success-green bg-green-50/50 border-success-green/20';
      default: return 'text-text-primary bg-slate-50/50 border-border-light';
    }
  };

  const getHealthTextColors = (health) => {
    switch (health) {
      case 'bad': return 'text-error-red';
      case 'warning': return 'text-warning-amber';
      case 'good': return 'text-success-green';
      default: return 'text-text-secondary';
    }
  };

  // Group catalog by module for the panel
  const catalogGroups = useMemo(() => {
    return PARAMETER_CATALOG.reduce((acc, param) => {
      if (!acc[param.module]) acc[param.module] = [];
      acc[param.module].push(param);
      return acc;
    }, {});
  }, []);

  if (isLoading) {
    return <div className="p-8 font-mono text-xs text-text-muted animate-pulse">Loading Team Board...</div>;
  }

  // Count clients needing attention
  let attentionCount = 0;
  const clientMetrics = clients.map(c => {
    const metrics = selectedParams.map(pid => resolveMetric(c.id, pid));
    const hasIssues = metrics.some(m => m.health === 'bad' || m.health === 'warning');
    if (hasIssues) attentionCount++;
    return { ...c, metrics, hasIssues };
  });

  return (
    <div className="space-y-6 font-sans animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Team Board, {userProfile?.full_name?.split(' ')[0]}</h1>
          <p className="text-sm text-text-secondary mt-1">
            Monitoring <strong className="text-text-primary">{clients.length}</strong> total clients · <strong className={attentionCount > 0 ? "text-error-red" : "text-success-green"}>{attentionCount}</strong> need attention
          </p>
        </div>
        <button 
          onClick={() => setIsPanelOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-panel-white border border-border-light hover:border-primary-cyan rounded-lg text-sm font-semibold text-text-primary shadow-sm transition-colors cursor-pointer"
        >
          <Settings size={16} className="text-primary-cyan" />
          Customize Board
        </button>
      </div>

      {/* Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientMetrics.map(client => (
          <div 
            key={client.id}
            onClick={() => navigate(`/clients`)} // Generic route for now, usually would be /clients/:id
            className="bg-panel-white border border-border-light rounded-xl shadow-sm hover:shadow hover:border-primary-cyan/50 transition-all cursor-pointer overflow-hidden flex flex-col"
          >
            {/* Box Header */}
            <div className="p-4 border-b border-border-light flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-primary-cyan font-bold text-lg">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-sm line-clamp-1">{client.name}</h3>
                  <p className="text-xs text-text-muted">{client.industry || 'Digital Marketing'}</p>
                </div>
              </div>
              {client.hasIssues && <AlertTriangle size={16} className="text-error-red" />}
            </div>

            {/* Box Body (Metrics) */}
            <div className="p-4 flex flex-col gap-3">
              {client.metrics.map((metric, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">{metric.label}</span>
                  <div className={`flex items-center gap-2 px-2 py-1 rounded border text-xs font-bold ${getHealthColors(metric.health)}`}>
                    <span>{metric.value}</span>
                    {metric.trend && (
                      <span className="text-[10px] ml-1">
                        {metric.trend.toString().startsWith('-') ? <ArrowDownRight size={12} className="inline text-error-red" /> : <ArrowUpRight size={12} className="inline text-success-green" />}
                        {metric.trend}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {client.metrics.length === 0 && (
                <div className="text-center text-xs text-text-muted py-4">No parameters selected.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Slide-over Panel for Customization */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setIsPanelOpen(false)}></div>
          <div className="relative w-full max-w-md bg-panel-white h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-border-light">
            <div className="p-5 border-b border-border-light flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Customize Board</h2>
                <p className="text-xs text-text-secondary">Select and reorder metrics for all client boxes.</p>
              </div>
              <button onClick={() => setIsPanelOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer p-1">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
              {/* Selected Parameters Reordering */}
              {tempParams.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider font-mono mb-3">Active Parameters ({tempParams.length})</h3>
                  <div className="flex flex-col gap-2">
                    {tempParams.map((paramId, index) => {
                      const def = PARAMETER_CATALOG.find(p => p.id === paramId);
                      if (!def) return null;
                      return (
                        <div key={paramId} className="flex items-center justify-between bg-white border border-border-light rounded p-2 shadow-sm">
                          <div className="flex items-center gap-2">
                            <GripVertical size={14} className="text-text-muted cursor-move" />
                            <span className="text-sm font-semibold text-text-primary">{def.label}</span>
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-slate-100 text-text-muted rounded">{def.module}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => moveParam(index, 'up')} disabled={index === 0} className="p-1 text-text-muted hover:bg-slate-100 rounded disabled:opacity-30">↑</button>
                            <button onClick={() => moveParam(index, 'down')} disabled={index === tempParams.length - 1} className="p-1 text-text-muted hover:bg-slate-100 rounded disabled:opacity-30">↓</button>
                            <button onClick={() => toggleParam(paramId)} className="p-1 text-error-red hover:bg-red-50 rounded ml-1"><X size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Catalog Toggles */}
              <div className="pt-4 border-t border-border-light">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider font-mono mb-4">Available Metrics</h3>
                {Object.entries(catalogGroups).map(([moduleName, params]) => (
                  <div key={moduleName} className="mb-5">
                    <h4 className="text-xs font-bold text-primary-cyan uppercase mb-2 ml-1">{moduleName}</h4>
                    <div className="flex flex-col gap-1.5">
                      {params.map(param => {
                        const isActive = tempParams.includes(param.id);
                        return (
                          <div 
                            key={param.id} 
                            onClick={() => toggleParam(param.id)}
                            className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${isActive ? 'bg-cyan-50/50 border-primary-cyan' : 'bg-white border-border-light hover:border-slate-300'}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${isActive ? 'bg-primary-cyan border-primary-cyan text-white' : 'border-slate-300'}`}>
                                {isActive && <Check size={10} strokeWidth={3} />}
                              </div>
                              <span className={`text-sm ${isActive ? 'font-semibold text-primary-cyan' : 'text-text-primary'}`}>{param.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-border-light bg-slate-50/50">
              <button 
                onClick={saveConfiguration}
                className="w-full bg-primary-cyan hover:bg-primary-cyan-hover text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
