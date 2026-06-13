import ClientAvatar from '../components/ClientAvatar';
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { 
  AlertCircle, CheckSquare, Search, FileText, Star, Share2, 
  MessageSquare, Globe, Calendar, Clock, ArrowRight, MessageCircle 
} from 'lucide-react';

export default function Tier3Dashboard() {
  const { userProfile, clients, agency } = useApp();
  const [tasks, setTasks] = useState([]);
  const [moduleData, setModuleData] = useState({
    seoAudits: [], keywords: [], socialPosts: [], gbpListings: [],
    gbpQa: [], reviews: [], contentItems: [], aeoScores: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [inlineComment, setInlineComment] = useState({});

  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  useEffect(() => {
    fetchData();
    const handleDbChange = () => fetchData();
    window.addEventListener('local_db_change', handleDbChange);
    return () => window.removeEventListener('local_db_change', handleDbChange);
  }, [userProfile, agency]);

  const fetchData = async () => {
    if (!agency || !userProfile) return;
    setIsLoading(true);
    
    // Fetch user's tasks
    const { data: userTasks } = await supabase.from('tasks')
      .eq('agency_id', agency.id)
      .eq('assignee_id', userProfile.id);
      
    setTasks(userTasks || []);

    // If no clients, we skip fetching module data
    if (!clients || clients.length === 0) {
      setIsLoading(false);
      return;
    }
    
    const clientIds = clients.map(c => c.id);

    const [
      { data: seoAudits }, { data: keywords }, { data: socialPosts },
      { data: gbpListings }, { data: gbpQa }, { data: reviews },
      { data: contentItems }, { data: aeoScores }
    ] = await Promise.all([
      supabase.from('seo_audits').in('client_id', clientIds),
      supabase.from('keyword_trackers').in('client_id', clientIds),
      supabase.from('social_posts').in('client_id', clientIds),
      supabase.from('gbp_listings').in('client_id', clientIds),
      supabase.from('gbp_qa').select('*'), // Filter later
      supabase.from('reviews').in('client_id', clientIds),
      supabase.from('content_items').in('client_id', clientIds),
      supabase.from('aeo_scores').in('client_id', clientIds)
    ]);

    setModuleData({
      seoAudits: seoAudits || [],
      keywords: keywords || [],
      socialPosts: socialPosts || [],
      gbpListings: gbpListings || [],
      gbpQa: gbpQa || [],
      reviews: reviews || [],
      contentItems: contentItems || [],
      aeoScores: aeoScores || []
    });

    setIsLoading(false);
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    await supabase.from('tasks').eq('id', taskId).update({ status: newStatus });
    fetchData(); // re-fetch locally
  };

  const handleAddComment = async (taskId) => {
    const text = inlineComment[taskId];
    if (!text || !text.trim()) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const existingNotes = task.description || '';
    const updatedDesc = existingNotes + `\n[${new Date().toLocaleDateString()}] ${userProfile.full_name}: ${text}`;

    await supabase.from('tasks').eq('id', taskId).update({ description: updatedDesc });
    setInlineComment(prev => ({ ...prev, [taskId]: '' }));
    fetchData();
  };

  // Computations
  const now = new Date();
  const sortedTasks = useMemo(() => {
    const openTasks = tasks.filter(t => t.status !== 'done');
    const priorityWeight = { urgent: 1, high: 2, medium: 3, low: 4 };
    return openTasks.sort((a, b) => {
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[a.priority] - priorityWeight[b.priority];
      }
      return new Date(a.due_date || '2099-01-01') - new Date(b.due_date || '2099-01-01');
    });
  }, [tasks]);

  const tasksToday = sortedTasks.filter(t => {
    const d = new Date(t.due_date);
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  
  const overdueTasks = sortedTasks.filter(t => t.due_date && new Date(t.due_date) < new Date(now.toDateString()));

  // Urgent signals strip
  const urgentSignals = [];
  overdueTasks.forEach(t => {
    const client = clients.find(c => c.id === t.client_id);
    urgentSignals.push({ id: t.id, type: 'task', text: `Overdue Task for ${client?.name || 'Unknown'}: ${t.title}`, urgent: true });
  });

  const getModuleAccess = (moduleName) => {
    if (userProfile?.role === 'executive') return true;
    return userProfile?.custom_permissions?.modules?.[moduleName] !== false;
  };

  if (isLoading) {
    return <div className="p-8 font-mono text-xs text-text-muted animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-border-light pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Your work, {userProfile?.full_name?.split(' ')[0]}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · <strong className="text-text-primary">{tasksToday.length}</strong> tasks today · <strong className="text-text-primary">{clients.length}</strong> assigned clients
          </p>
        </div>
      </div>

      {/* Needs My Attention Strip */}
      {urgentSignals.length > 0 && (
        <div className="bg-red-50 border border-error-red/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-error-red" />
            <h3 className="text-xs font-bold text-error-red uppercase tracking-wider">Needs My Attention</h3>
          </div>
          <div className="flex flex-col gap-2">
            {urgentSignals.slice(0, 3).map((sig, i) => (
              <div key={i} className="flex items-center justify-between bg-panel-white p-2 rounded border border-red-100 shadow-sm text-sm cursor-pointer hover:border-red-300">
                <span className="font-medium text-text-primary">{sig.text}</span>
                <ArrowRight size={14} className="text-error-red" />
              </div>
            ))}
            {urgentSignals.length > 3 && (
              <p className="text-xs text-error-red font-mono font-medium">...and {urgentSignals.length - 3} more</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Col: My Clients */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-mono">My Clients</h2>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClientId(c.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${selectedClientId === c.id ? 'bg-primary-cyan text-white border-primary-cyan shadow' : 'bg-panel-white text-text-secondary border-border-light hover:border-primary-cyan/50'}`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {selectedClientId && (
            <div className="bg-panel-white border border-border-light rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-border-light pb-4">
                <h3 className="text-lg font-bold text-text-primary">{clients.find(c => c.id === selectedClientId)?.name} — Deep Dive</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SEO */}
                {getModuleAccess('seo') && (
                  <div className="p-4 border border-border-light rounded-lg bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe size={16} className="text-primary-cyan" />
                      <span className="font-bold text-sm text-text-primary">SEO & Keywords</span>
                    </div>
                    {(() => {
                      const audits = moduleData.seoAudits.filter(a => a.client_id === selectedClientId).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
                      const kw = moduleData.keywords.filter(k => k.client_id === selectedClientId);
                      return (
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Latest Audit Score:</span>
                            <span className="font-bold text-text-primary">{audits[0]?.overall_score || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Tracked Keywords:</span>
                            <span className="font-bold text-text-primary">{kw.length}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Content */}
                {getModuleAccess('content') && (
                  <div className="p-4 border border-border-light rounded-lg bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={16} className="text-primary-cyan" />
                      <span className="font-bold text-sm text-text-primary">Content Pipeline</span>
                    </div>
                    {(() => {
                      const items = moduleData.contentItems.filter(c => c.client_id === selectedClientId);
                      const inProgress = items.filter(i => i.status === 'draft' || i.status === 'briefing');
                      const awaiting = items.filter(i => i.status === 'client_review');
                      return (
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">In Progress:</span>
                            <span className="font-bold text-text-primary">{inProgress.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-warning-amber font-semibold">Awaiting Approval:</span>
                            <span className="font-bold text-warning-amber">{awaiting.length}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Social */}
                {getModuleAccess('social') && (
                  <div className="p-4 border border-border-light rounded-lg bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Share2 size={16} className="text-primary-cyan" />
                      <span className="font-bold text-sm text-text-primary">Social Media</span>
                    </div>
                    {(() => {
                      const posts = moduleData.socialPosts.filter(p => p.client_id === selectedClientId);
                      const scheduled = posts.filter(p => p.status === 'scheduled');
                      return (
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Scheduled Posts:</span>
                            <span className="font-bold text-text-primary">{scheduled.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Total Posts:</span>
                            <span className="font-bold text-text-primary">{posts.length}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Reputation / GBP */}
                {(getModuleAccess('reputation') || getModuleAccess('gbp')) && (
                  <div className="p-4 border border-border-light rounded-lg bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Star size={16} className="text-primary-cyan" />
                      <span className="font-bold text-sm text-text-primary">GBP & Reputation</span>
                    </div>
                    {(() => {
                      const rev = moduleData.reviews.filter(r => r.client_id === selectedClientId);
                      const unresponded = rev.filter(r => r.response_status === 'unresponded');
                      return (
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Total Reviews:</span>
                            <span className="font-bold text-text-primary">{rev.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-error-red font-semibold">Unresponded:</span>
                            <span className="font-bold text-error-red">{unresponded.length}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {/* AEO */}
                {getModuleAccess('aeo') && (
                  <div className="p-4 border border-border-light rounded-lg bg-slate-50/50 md:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Search size={16} className="text-primary-cyan" />
                      <span className="font-bold text-sm text-text-primary">AEO Visibility</span>
                    </div>
                    {(() => {
                      const scores = moduleData.aeoScores.filter(a => a.client_id === selectedClientId).sort((a,b)=>new Date(b.scored_at)-new Date(a.scored_at));
                      return (
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between max-w-xs">
                            <span className="text-text-secondary">Latest Score:</span>
                            <span className="font-bold text-text-primary">{scores[0]?.overall_score || 'N/A'}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Right Col: My Tasks */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-mono">My Tasks, By Priority</h2>
          <div className="flex flex-col gap-3">
            {sortedTasks.filter(t => t.client_id === selectedClientId).length === 0 && (
              <div className="p-4 border border-dashed border-border-light rounded-lg text-center text-xs text-text-muted">
                No active tasks for this client.
              </div>
            )}
            
            {sortedTasks.filter(t => t.client_id === selectedClientId).map(task => {
              const priorityStyles = {
                urgent: 'bg-error-red text-white',
                high: 'bg-warning-amber text-white',
                medium: 'bg-primary-cyan text-white',
                low: 'bg-slate-200 text-text-secondary'
              };

              return (
                <div key={task.id} className="bg-panel-white border border-border-light rounded-lg p-4 shadow-sm flex flex-col gap-3 group">
                  
                  {/* Task Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex gap-2 items-center mb-1">
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${priorityStyles[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] uppercase font-mono font-bold text-primary-cyan bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
                          {task.module}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-text-primary">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar size={12} className={new Date(task.due_date) < new Date(now.toDateString()) ? "text-error-red" : "text-text-muted"} />
                        <span className={`text-xs ${new Date(task.due_date) < new Date(now.toDateString()) ? "text-error-red font-bold" : "text-text-secondary"}`}>
                          {task.due_date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Task Status */}
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border border-slate-100">
                    {['todo', 'in_progress', 'review', 'done'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleTaskStatusChange(task.id, status)}
                        className={`flex-1 text-[10px] font-bold uppercase py-1 rounded transition-colors ${task.status === status ? 'bg-white shadow-sm border border-border-light text-primary-cyan' : 'text-text-muted hover:bg-slate-100'}`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Comments/Notes */}
                  {task.description && (
                    <div className="text-xs text-text-secondary whitespace-pre-wrap bg-slate-50 p-2 rounded border border-slate-100 max-h-24 overflow-y-auto scrollbar-thin">
                      {task.description}
                    </div>
                  )}
                  
                  {/* Inline Action - Comment */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <input 
                      type="text" 
                      placeholder="Add a note or comment..."
                      value={inlineComment[task.id] || ''}
                      onChange={(e) => setInlineComment({ ...inlineComment, [task.id]: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(task.id); }}
                      className="flex-1 border border-border-light rounded px-2 py-1 text-xs focus:outline-none focus:border-primary-cyan"
                    />
                    <button 
                      onClick={() => handleAddComment(task.id)}
                      className="bg-slate-100 hover:bg-slate-200 text-text-primary px-2 rounded cursor-pointer transition-colors"
                    >
                      <MessageCircle size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
