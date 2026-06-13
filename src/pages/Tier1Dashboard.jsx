import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { 
  Globe, Share2, FileText, Mail, Star, CheckSquare, Zap, ArrowUpRight, X, AlertTriangle, ArrowUp, ArrowDown, Search, Filter, MessageSquare, Flame, Clock, Users, Activity
} from 'lucide-react';
import ClientCard from '../components/dashboard/ClientCard';

const timeAgo = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  let interval = seconds / 3600;
  if (interval > 24) return Math.floor(interval / 24) + "d ago";
  if (interval >= 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + "m ago";
  return "Just now";
};

const Badge = ({ text, type }) => {
  const bg = type === 'red' ? 'bg-error-red' : type === 'amber' ? 'bg-warning-amber' : 'bg-success-green';
  return <span className={`text-[10px] font-mono text-white px-1.5 py-0.5 rounded ${bg}`}>{text}</span>;
};

export default function Tier1Dashboard() {
  const { agency, clients } = useApp();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [clientData, setClientData] = useState([]);
  const [globalExceptions, setGlobalExceptions] = useState([]);
  const [globalTasks, setGlobalTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      if (!agency || !clients || clients.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const [
          { data: tasks }, { data: users }, { data: seoAudits }, { data: keywords }, { data: socialPosts },
          { data: gbpListings }, { data: gbpQa }, { data: reviews }, { data: contentItems }, 
          { data: aeoScores }, { data: emailCampaigns }, { data: contacts }
        ] = await Promise.all([
          supabase.from('tasks').eq('agency_id', agency.id),
          supabase.from('users').eq('agency_id', agency.id),
          supabase.from('seo_audits').eq('agency_id', agency.id),
          supabase.from('keyword_trackers').select('*'), 
          supabase.from('social_posts').eq('agency_id', agency.id),
          supabase.from('gbp_listings').eq('agency_id', agency.id),
          supabase.from('gbp_qa').select('*'),
          supabase.from('reviews').eq('agency_id', agency.id),
          supabase.from('content_items').eq('agency_id', agency.id),
          supabase.from('aeo_scores').eq('agency_id', agency.id),
          supabase.from('email_campaigns').eq('agency_id', agency.id),
          supabase.from('contacts').eq('agency_id', agency.id)
        ]);

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

        let exceptions = [];

        const processedClients = clients.map(client => {
          let isUrgent = false;
          let isNeedsAttention = false;
          const signals = [];
          
          let lastActiveDate = new Date(client.created_at);
          const updateLastActive = (dateStr) => {
            if (!dateStr) return;
            const d = new Date(dateStr);
            if (d > lastActiveDate) lastActiveDate = d;
          };

          const pushSignal = (mod, text, type, icon, indicator) => {
            const sig = { module: mod, text, type, icon, indicator, clientName: client.name, clientId: client.id };
            signals.push(sig);
            if (type === 'red' || type === 'amber') exceptions.push(sig);
          };

          // 1. Tasks
          const clientTasks = (tasks || []).filter(t => t.client_id === client.id);
          const openTasks = clientTasks.filter(t => t.status !== 'done');
          const overdueTasks = openTasks.filter(t => t.due_date && new Date(t.due_date) < now);
          clientTasks.forEach(t => updateLastActive(t.created_at));

          if (overdueTasks.length > 0) {
            isUrgent = true;
            pushSignal('tasks', `${overdueTasks.length} overdue tasks`, 'red', <CheckSquare size={16} className="text-[#EF4444]" />, <AlertTriangle size={14} className="text-error-red" />);
          } else if (openTasks.length > 0) {
            pushSignal('tasks', `${openTasks.length} open tasks`, 'gray', <CheckSquare size={16} />, null);
          }

          // 2. Reviews
          const clientReviews = (reviews || []).filter(r => r.client_id === client.id);
          const unrespondedNegative = clientReviews.filter(r => r.rating <= 3 && r.response_status === 'unresponded');
          clientReviews.forEach(r => updateLastActive(r.created_at));

          if (unrespondedNegative.length > 0) {
            isUrgent = true;
            pushSignal('reviews', `⚠ Negative review needs response`, 'red', <Star size={16} className="text-[#EF4444]" />, <Badge text="URGENT" type="red" />);
          }

          // 3. SEO
          const clientSeoAudits = (seoAudits || []).filter(s => s.client_id === client.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          if (clientSeoAudits.length >= 2) {
            const diff = clientSeoAudits[0].overall_score - clientSeoAudits[1].overall_score;
            if (diff <= -10) {
              isUrgent = true;
              pushSignal('seo', `SEO score dropped by ${diff}`, 'red', <Globe size={16} className="text-[#EF4444]" />, <ArrowDown className="text-error-red" size={14} />);
            }
          }

          // 4. GBP
          const clientGbp = (gbpListings || []).filter(g => g.client_id === client.id);
          const clientQa = (gbpQa || []).filter(qa => clientGbp.map(g=>g.id).includes(qa.listing_id));
          if (clientGbp.some(g => g.status === 'suspended')) {
            isUrgent = true;
            pushSignal('gbp', `⚠ GBP Suspended`, 'red', <Globe size={16} className="text-[#EF4444]" />, <Badge text="URGENT" type="red" />);
          } else if (clientQa.some(qa => qa.status === 'unanswered')) {
            isNeedsAttention = true;
            pushSignal('gbp', `⚠ Unanswered Q&A`, 'amber', <MessageSquare size={16} className="text-warning-amber" />, <Badge text="ACTION" type="amber" />);
          }

          // 5. Content
          const clientContent = (contentItems || []).filter(c => c.client_id === client.id);
          const awaitingContent = clientContent.filter(c => (c.status === 'client_review' || c.status === 'internal_review') && new Date(c.created_at) < twoDaysAgo);
          if (awaitingContent.length > 0) {
            isNeedsAttention = true;
            pushSignal('content', `${awaitingContent.length} items stuck awaiting approval`, 'amber', <FileText size={16} className="text-warning-amber" />, <Badge text={awaitingContent.length.toString()} type="amber" />);
          }

          // 6. AEO
          const clientAeo = (aeoScores || []).filter(a => a.client_id === client.id).sort((a,b) => new Date(b.scored_at) - new Date(a.scored_at));
          if (clientAeo.length > 0 && clientAeo[0].visibility_trend === 'downward') {
            isNeedsAttention = true;
            pushSignal('aeo', `⚠ AEO visibility declining`, 'amber', <Search size={16} className="text-warning-amber" />, <ArrowDown className="text-warning-amber" size={14} />);
          }

          // 9. Activity Check
          if (lastActiveDate < sevenDaysAgo) {
            isUrgent = true;
            pushSignal('activity', `⚠ No activity in 7+ days`, 'red', <Zap size={16} className="text-[#EF4444]" />, <AlertTriangle size={14} className="text-error-red" />);
          }

          let health = isUrgent ? 'URGENT' : isNeedsAttention ? 'NEEDS ATTENTION' : 'HEALTHY';
          let priority = isUrgent ? 1 : isNeedsAttention ? 2 : 3;

          const typeWeight = { 'red': 1, 'amber': 2, 'green': 3, 'gray': 4 };
          signals.sort((a, b) => typeWeight[a.type] - typeWeight[b.type]);

          return { ...client, health, priority, signals, lastActiveStr: timeAgo(lastActiveDate.toISOString()) };
        });

        // Sort exceptions worst-first
        exceptions.sort((a, b) => (a.type === 'red' ? 0 : 1) - (b.type === 'red' ? 0 : 1));
        setGlobalExceptions(exceptions);

        // Global Tasks Queue
        const allTasks = (tasks || []).filter(t => t.status !== 'done');
        allTasks.sort((a, b) => {
          const pA = a.priority === 'urgent' ? 1 : a.priority === 'high' ? 2 : 3;
          const pB = b.priority === 'urgent' ? 1 : b.priority === 'high' ? 2 : 3;
          if (pA !== pB) return pA - pB;
          return new Date(a.due_date || '2099-01-01') - new Date(b.due_date || '2099-01-01');
        });
        setGlobalTasks(allTasks);

        // Team Members Oversight
        const tMembers = (users || []).filter(u => u.role !== 'admin').map(user => {
          const userTasks = (tasks || []).filter(t => t.assignee_id === user.id);
          const openCount = userTasks.filter(t => t.status !== 'done').length;
          const overdueCount = userTasks.filter(t => t.status !== 'done' && new Date(t.due_date) < now).length;
          const doneCount = userTasks.filter(t => t.status === 'done').length;
          const completionRate = userTasks.length > 0 ? Math.round((doneCount / userTasks.length) * 100) : 0;
          
          let assignedClients = user.role === 'manager' ? clients.length : (user.assigned_client_ids || []).length;
          
          let workloadStatus = 'optimal';
          if (openCount === 0) workloadStatus = 'idle';
          if (openCount > 8) workloadStatus = 'overloaded';
          if (overdueCount > 2) workloadStatus = 'slipping';

          return { ...user, openCount, overdueCount, completionRate, assignedClients, workloadStatus };
        });
        setTeamMembers(tMembers);

        setClientData(processedClients);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [agency, clients]);

  if (isLoading) {
    return <div className="p-8 font-mono text-xs text-text-muted animate-pulse">Loading Command Center...</div>;
  }

  const attentionCount = clientData.filter(c => c.health !== 'HEALTHY').length;

  return (
    <div className="space-y-8 font-sans animate-fade-in pb-12">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-light pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Owner's Command Center</h1>
          <p className="font-mono text-xs text-text-secondary mt-1">
            AGENCY-WIDE PULSE · {new Date().toLocaleDateString('en-IN').toUpperCase()}
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="font-mono text-[10px] uppercase text-text-muted">TEAM MEMBERS</span>
            <p className="text-sm font-bold text-text-primary">{teamMembers.length}</p>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] uppercase text-text-muted">CLIENT COVERAGE</span>
            <p className="text-sm font-bold text-text-primary">{clients.length} / 3</p>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] uppercase text-text-muted">NEEDS ATTENTION</span>
            <p className={`text-sm font-bold ${attentionCount > 0 ? 'text-error-red' : 'text-success-green'}`}>{attentionCount}</p>
          </div>
        </div>
      </div>

      {/* Section 1: Critical Parameters Strip */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-mono flex items-center gap-2">
          <Flame size={16} className="text-error-red" /> Critical Exceptions Feed
        </h2>
        
        {globalExceptions.length === 0 ? (
          <div className="bg-success-green/10 border border-success-green/30 rounded-lg p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-success-green/20 rounded-full flex items-center justify-center">
              <CheckSquare size={16} className="text-success-green" />
            </div>
            <div>
              <p className="text-sm font-bold text-success-green">All clients healthy</p>
              <p className="text-xs text-success-green/80">No critical parameters or auto-curated exceptions detected agency-wide.</p>
            </div>
          </div>
        ) : (
          <div className="bg-panel-white border border-error-red/20 rounded-lg overflow-hidden shadow-sm">
            {globalExceptions.slice(0, 5).map((exc, i) => (
              <div key={i} className="flex items-center justify-between p-3 border-b border-border-light last:border-0 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded ${exc.type === 'red' ? 'bg-error-red/10 text-error-red' : 'bg-warning-amber/10 text-warning-amber'}`}>
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text-primary block">{exc.clientName}</span>
                    <span className="text-sm text-text-secondary">{exc.text}</span>
                  </div>
                </div>
                <button onClick={() => navigate(`/clients`)} className="px-3 py-1 bg-white border border-border-light rounded text-xs font-semibold hover:border-primary-cyan transition-colors cursor-pointer">
                  Jump to Fix
                </button>
              </div>
            ))}
            {globalExceptions.length > 5 && (
              <div className="p-2 text-center text-xs text-text-muted bg-slate-50 border-t border-border-light">
                + {globalExceptions.length - 5} more critical signals across the board
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid for Section 2 & 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 2: Agency-Wide Priority Queue */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-mono flex items-center gap-2">
            <Clock size={16} className="text-warning-amber" /> Agency Priority Queue
          </h2>
          <div className="bg-panel-white border border-border-light rounded-lg shadow-sm flex flex-col max-h-80 overflow-y-auto scrollbar-thin">
            {globalTasks.slice(0, 8).map((task, i) => {
              const client = clients.find(c => c.id === task.client_id);
              return (
                <div key={i} className="flex items-center justify-between p-3 border-b border-border-light last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => navigate('/tasks')}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {task.priority === 'urgent' ? <Badge text="URGENT" type="red" /> : 
                       task.priority === 'high' ? <Badge text="HIGH" type="amber" /> : 
                       <Badge text="NORMAL" type="gray" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary line-clamp-1">{task.title}</p>
                      <p className="text-xs text-text-muted">{client?.name || 'Agency Task'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {globalTasks.length === 0 && (
              <div className="p-8 text-center text-sm text-text-muted">No pending tasks agency-wide.</div>
            )}
          </div>
        </div>

        {/* Section 3: Team Activity Oversight */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-mono flex items-center gap-2">
            <Users size={16} className="text-primary-cyan" /> Team Activity Oversight
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-panel-white border border-border-light rounded-lg p-4 shadow-sm hover:border-primary-cyan transition-colors cursor-pointer" onClick={() => navigate('/team')}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-cyan-100 text-primary-cyan rounded-full flex items-center justify-center font-bold text-sm">
                      {member.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{member.full_name}</h4>
                      <p className="text-[10px] text-text-muted uppercase tracking-wide">{member.role}</p>
                    </div>
                  </div>
                  {member.workloadStatus === 'overloaded' ? <span className="w-2 h-2 rounded-full bg-error-red animate-pulse" title="Overloaded"></span> :
                   member.workloadStatus === 'slipping' ? <span className="w-2 h-2 rounded-full bg-warning-amber" title="Slipping"></span> :
                   member.workloadStatus === 'idle' ? <span className="w-2 h-2 rounded-full bg-slate-300" title="Idle"></span> :
                   <span className="w-2 h-2 rounded-full bg-success-green" title="Optimal"></span>}
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4 text-center border-t border-border-light pt-3">
                  <div>
                    <p className="text-lg font-bold text-text-primary">{member.assignedClients}</p>
                    <p className="text-[10px] uppercase text-text-secondary">Clients</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${member.overdueCount > 0 ? 'text-error-red' : 'text-text-primary'}`}>{member.openTasks || member.openCount}</p>
                    <p className="text-[10px] uppercase text-text-secondary">Open Tasks</p>
                  </div>
                </div>
                
                <div className="mt-3 bg-page-bg h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-cyan h-full" style={{ width: `${member.completionRate}%` }}></div>
                </div>
              </div>
            ))}
            {teamMembers.length === 0 && (
              <div className="col-span-2 p-8 text-center text-sm text-text-muted bg-panel-white border border-border-light rounded-lg">
                No active team members.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Existing Client Grid */}
      <div className="pt-6 border-t border-border-light">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h3 className="font-sans font-semibold text-lg text-text-primary">All Clients Command Center</h3>
            <p className="font-mono text-[11px] text-text-secondary mt-1">CROSS-MODULE SIGNALS DRILL-DOWN</p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-text-muted" size={14} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-border-medium rounded-md w-48 focus:outline-none focus:border-primary-cyan bg-panel-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {clientData.filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(client => (
            <ClientCard 
              key={client.id}
              client={client}
              health={client.health}
              signals={client.signals}
              lastUpdated={client.lastActiveStr}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
