import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { 
  Globe, Share2, FileText, Mail, Star, CheckSquare, Zap, ArrowUpRight, X, AlertTriangle, ArrowUp, ArrowDown, Search, Filter, MessageSquare, Edit3
} from 'lucide-react';
import ClientCard from '../components/dashboard/ClientCard';

// Utility for formatting time ago
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

// Indicator Components
const Badge = ({ text, type }) => {
  const bg = type === 'red' ? 'bg-error-red' : type === 'amber' ? 'bg-warning-amber' : 'bg-success-green';
  return <span className={`text-[10px] font-mono text-white px-1.5 py-0.5 rounded ${bg}`}>{text}</span>;
};

export default function Dashboard() {
  const { agency, clients, onboarding, forceRefresh } = useApp();
  const navigate = useNavigate();
  
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  
  const [clientData, setClientData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('needs_attention');
  const [filterBy, setFilterBy] = useState('all');

  // Onboarding computations
  const totalSteps = onboarding.length;
  const completedSteps = onboarding.filter(s => s.is_completed).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const toggleOnboardingStep = async (stepId, currentVal) => {
    const list = JSON.parse(localStorage.getItem('db_onboarding_progress') || '[]');
    const updated = list.map(step => 
      step.id === stepId 
        ? { ...step, is_completed: !currentVal, completed_at: !currentVal ? new Date().toISOString() : null } 
        : step
    );
    localStorage.setItem('db_onboarding_progress', JSON.stringify(updated));
    window.dispatchEvent(new Event('local_db_change'));
    forceRefresh();

    if (updated.filter(s => s.is_completed).length === totalSteps) {
      import('canvas-confetti').then((confetti) => {
        confetti.default({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      });
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      if (!agency || !clients || clients.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch tasks for top stats
        const { data: tasks } = await supabase.from('tasks').eq('agency_id', agency.id);
        setRecentTasks(tasks || []);

        // Fetch all relevant tables for signals
        const [
          { data: seoAudits }, { data: keywords }, { data: socialPosts },
          { data: gbpListings }, { data: gbpQa }, { data: reviews },
          { data: contentItems }, { data: aeoScores }, { data: emailCampaigns }, { data: contacts }
        ] = await Promise.all([
          supabase.from('seo_audits').eq('agency_id', agency.id),
          supabase.from('keyword_trackers').select('*'), // Filter by client later
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

          // 1. Tasks
          const clientTasks = (tasks || []).filter(t => t.client_id === client.id);
          const openTasks = clientTasks.filter(t => t.status !== 'done');
          const overdueTasks = openTasks.filter(t => t.due_date && new Date(t.due_date) < now);
          clientTasks.forEach(t => updateLastActive(t.created_at));

          if (overdueTasks.length > 0) {
            isUrgent = true;
            signals.push({ module: 'tasks', text: `${openTasks.length} open tasks, ${overdueTasks.length} overdue`, type: 'red', icon: <CheckSquare size={16} className="text-[#EF4444]" />, indicator: <AlertTriangle size={14} className="text-error-red" /> });
          } else if (openTasks.length > 0) {
            signals.push({ module: 'tasks', text: `${openTasks.length} open tasks`, type: 'gray', icon: <CheckSquare size={16} />, indicator: null });
          }

          // 2. Reviews / Reputation
          const clientReviews = (reviews || []).filter(r => r.client_id === client.id);
          const unrespondedNegative = clientReviews.filter(r => r.rating <= 3 && r.response_status === 'unresponded');
          const recentReviews = clientReviews.filter(r => new Date(r.created_at) > sevenDaysAgo);
          clientReviews.forEach(r => updateLastActive(r.created_at));

          if (unrespondedNegative.length > 0) {
            isUrgent = true;
            signals.push({ module: 'reviews', text: `⚠ Negative review needs response`, type: 'red', icon: <Star size={16} className="text-[#EF4444]" />, indicator: <Badge text="URGENT" type="red" /> });
          } else if (clientReviews.length > 0) {
            const avgRating = clientReviews.reduce((acc, r) => acc + r.rating, 0) / clientReviews.length;
            signals.push({ module: 'reviews', text: `★ ${avgRating.toFixed(1)} avg (${recentReviews.length} new)`, type: 'green', icon: <Star size={16} className="text-success-green" />, indicator: <ArrowUpRight size={14} className="text-success-green" /> });
          }

          // 3. SEO Monitoring
          const clientSeoAudits = (seoAudits || []).filter(s => s.client_id === client.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          clientSeoAudits.forEach(s => updateLastActive(s.created_at));
          
          if (clientSeoAudits.length >= 2) {
            const latest = clientSeoAudits[0];
            const previous = clientSeoAudits[1];
            const diff = latest.overall_score - previous.overall_score;
            if (diff <= -10) {
              isUrgent = true;
              signals.push({ module: 'seo', text: `SEO score: ${latest.overall_score} (${diff})`, type: 'red', icon: <Globe size={16} className="text-[#EF4444]" />, indicator: <ArrowDown className="text-error-red" size={14} /> });
            } else {
              signals.push({ module: 'seo', text: `SEO score: ${latest.overall_score} (${diff > 0 ? '+'+diff : diff})`, type: diff > 0 ? 'green' : 'gray', icon: <Globe size={16} className={diff > 0 ? "text-success-green" : ""} />, indicator: diff > 0 ? <ArrowUp className="text-success-green" size={14} /> : null });
            }
          } else if (clientSeoAudits.length === 1) {
            signals.push({ module: 'seo', text: `SEO score: ${clientSeoAudits[0].overall_score}`, type: 'gray', icon: <Globe size={16} />, indicator: null });
          }

          // Keywords
          const clientKeywords = (keywords || []).filter(k => k.client_id === client.id);
          const droppedKeywords = clientKeywords.filter(k => k.previous_rank <= 10 && k.current_rank > 10);
          clientKeywords.forEach(k => updateLastActive(k.last_checked));

          if (droppedKeywords.length > 0) {
            isNeedsAttention = true;
            signals.push({ module: 'keywords', text: `⚠ ${droppedKeywords.length} keywords dropped`, type: 'amber', icon: <Globe size={16} className="text-warning-amber" />, indicator: <ArrowDown className="text-warning-amber" size={14} /> });
          }

          // 4. GBP
          const clientGbp = (gbpListings || []).filter(g => g.client_id === client.id);
          const clientGbpIds = clientGbp.map(g => g.id);
          const clientQa = (gbpQa || []).filter(qa => clientGbpIds.includes(qa.listing_id));
          
          clientGbp.forEach(g => updateLastActive(g.created_at));
          clientQa.forEach(q => updateLastActive(q.created_at));

          if (clientGbp.some(g => g.status === 'suspended')) {
            isUrgent = true;
            signals.push({ module: 'gbp', text: `⚠ GBP Suspended`, type: 'red', icon: <Globe size={16} className="text-[#EF4444]" />, indicator: <Badge text="URGENT" type="red" /> });
          } else if (clientQa.some(qa => qa.status === 'unanswered')) {
            isNeedsAttention = true;
            signals.push({ module: 'gbp', text: `⚠ ${clientQa.filter(qa => qa.status === 'unanswered').length} unanswered Q&A`, type: 'amber', icon: <MessageSquare size={16} className="text-warning-amber" />, indicator: <Badge text="ACTION" type="amber" /> });
          } else if (clientGbp.length > 0) {
            signals.push({ module: 'gbp', text: `GBP Active`, type: 'green', icon: <Globe size={16} className="text-success-green" />, indicator: <CheckSquare size={14} className="text-success-green" /> });
          }

          // 5. Content
          const clientContent = (contentItems || []).filter(c => c.client_id === client.id);
          const awaitingContent = clientContent.filter(c => (c.status === 'client_review' || c.status === 'internal_review') && new Date(c.created_at) < twoDaysAgo);
          const publishedThisMonth = clientContent.filter(c => c.status === 'published' && new Date(c.published_at).getMonth() === now.getMonth());
          clientContent.forEach(c => updateLastActive(c.created_at));

          if (awaitingContent.length > 0) {
            isNeedsAttention = true;
            signals.push({ module: 'content', text: `${awaitingContent.length} items awaiting approval`, type: 'amber', icon: <FileText size={16} className="text-warning-amber" />, indicator: <Badge text={awaitingContent.length.toString()} type="amber" /> });
          } else if (publishedThisMonth.length > 0) {
            signals.push({ module: 'content', text: `${publishedThisMonth.length} published this month`, type: 'green', icon: <FileText size={16} className="text-success-green" />, indicator: null });
          }

          // 6. Social
          const clientSocial = (socialPosts || []).filter(p => p.client_id === client.id);
          const scheduledThisWeek = clientSocial.filter(p => p.status === 'scheduled' && new Date(p.scheduled_at) > now && new Date(p.scheduled_at) < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
          clientSocial.forEach(p => updateLastActive(p.created_at));

          if (scheduledThisWeek.length === 0 && clientSocial.length > 0) {
            isNeedsAttention = true;
            signals.push({ module: 'social', text: `⚠ No posts scheduled`, type: 'amber', icon: <Share2 size={16} className="text-warning-amber" />, indicator: <AlertTriangle size={14} className="text-warning-amber" /> });
          } else if (scheduledThisWeek.length > 0) {
             signals.push({ module: 'social', text: `${scheduledThisWeek.length} posts scheduled`, type: 'green', icon: <Share2 size={16} className="text-success-green" />, indicator: null });
          }

          // 7. AEO
          const clientAeo = (aeoScores || []).filter(a => a.client_id === client.id).sort((a,b) => new Date(b.scored_at) - new Date(a.scored_at));
          clientAeo.forEach(a => updateLastActive(a.scored_at));

          if (clientAeo.length > 0 && clientAeo[0].visibility_trend === 'downward') {
            isNeedsAttention = true;
            signals.push({ module: 'aeo', text: `⚠ AEO visibility declining`, type: 'amber', icon: <Search size={16} className="text-warning-amber" />, indicator: <ArrowDown className="text-warning-amber" size={14} /> });
          } else if (clientAeo.length > 0) {
            signals.push({ module: 'aeo', text: `AEO visibility: ${clientAeo[0].overall_score}`, type: 'gray', icon: <Search size={16} />, indicator: null });
          }

          // 8. Email
          const clientEmails = (emailCampaigns || []).filter(e => e.client_id === client.id);
          const clientContacts = (contacts || []).filter(c => c.client_id === client.id);
          clientEmails.forEach(e => updateLastActive(e.created_at));
          clientContacts.forEach(c => updateLastActive(c.created_at));

          if (clientEmails.length > 0) {
            const lastCampaign = clientEmails.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
            const openRate = lastCampaign.recipients_count > 0 ? Math.round((lastCampaign.opens / lastCampaign.recipients_count) * 100) : 0;
            signals.push({ module: 'email', text: `Campaign: ${openRate}% open rate`, type: 'gray', icon: <Mail size={16} />, indicator: null });
          }

          // 9. Activity Check
          if (lastActiveDate < sevenDaysAgo) {
            isUrgent = true;
            signals.push({ module: 'activity', text: `⚠ No activity in 7+ days`, type: 'red', icon: <Zap size={16} className="text-[#EF4444]" />, indicator: <AlertTriangle size={14} className="text-error-red" /> });
          }

          // Determine final health
          let health = 'HEALTHY';
          let priority = 3;
          if (isUrgent) {
            health = 'URGENT';
            priority = 1;
          } else if (isNeedsAttention) {
            health = 'NEEDS ATTENTION';
            priority = 2;
          }

          // Prioritize signals for display (red -> amber -> green -> gray)
          const typeWeight = { 'red': 1, 'amber': 2, 'green': 3, 'gray': 4 };
          signals.sort((a, b) => typeWeight[a.type] - typeWeight[b.type]);

          return {
            ...client,
            health,
            priority,
            signals,
            lastActiveStr: timeAgo(lastActiveDate.toISOString()),
            lastActiveDate: lastActiveDate
          };
        });

        setClientData(processedClients);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [agency, clients]);

  // Filtering and Sorting
  const filteredAndSortedClients = clientData
    .filter(c => {
      if (filterBy === 'active' && c.status !== 'active') return false;
      if (filterBy === 'paused' && c.status !== 'paused') return false;
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'needs_attention') {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.lastActiveDate - a.lastActiveDate; // secondary sort
      }
      if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'recently_active') {
        return b.lastActiveDate - a.lastActiveDate;
      }
      return 0;
    });


  return (
    <div className="space-y-6 font-sans animate-fade-in pb-12">

      {/* Greetings bar */}
      <div className="flex items-end justify-between border-b border-border-light pb-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            Good morning, Boss
          </h2>
          <p className="font-mono text-xs text-text-secondary mt-1">
            SYS TIME: {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase()}
          </p>
        </div>
        
        {/* Quick helper stat */}
        <div className="text-right">
          <span className="font-mono text-xs text-text-muted">CLIENT COVERAGE</span>
          <p className="text-sm font-bold text-text-primary font-mono">{clients.length} / 3 SLOTS</p>
        </div>
      </div>

      {/* Announcement Banner */}
      {showAnnouncement && announcements.length > 0 && (
        <div className="bg-[#ECFEFF] border border-[#06B6D480] px-4 py-3 rounded flex items-center justify-between text-xs text-text-primary">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-cyan inline-block animate-pulse"></span>
            <span className="font-semibold font-mono text-[10px] uppercase text-primary-cyan tracking-wider">ANNOUNCEMENT:</span>
            <span>{announcements[0].body}</span>
          </div>
          <button 
            onClick={() => setShowAnnouncement(false)} 
            className="text-primary-cyan hover:text-primary-cyan-hover cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Onboarding Checklist Widget */}
      {showOnboarding && totalSteps > 0 && completedSteps < totalSteps && (
        <div className="bg-panel-white border border-border-light rounded-md shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold text-text-primary">Workspace Onboarding Progress</h3>
              <p className="text-xs text-text-secondary">Complete the checklist to unlock fully automated dashboards.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-primary-cyan">{progressPercent}%</span>
              <button 
                onClick={() => setShowOnboarding(false)}
                className="text-[11px] text-text-muted hover:text-text-primary font-mono cursor-pointer"
              >
                COLLAPSE
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-page-bg h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary-cyan h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Checklist columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {onboarding.map((step) => (
              <label 
                key={step.id} 
                className={`flex items-center gap-2 p-2.5 border rounded cursor-pointer transition-all duration-150 ${
                  step.is_completed 
                    ? 'bg-page-bg/40 border-border-light opacity-75' 
                    : 'bg-panel-white border-border-light hover:border-primary-cyan'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={step.is_completed} 
                  onChange={() => toggleOnboardingStep(step.id, step.is_completed)}
                  className="rounded text-primary-cyan border-border-medium"
                />
                <span className={`text-[11px] font-medium leading-none select-none ${step.is_completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                  {step.step_title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Clients */}
        <div className="bg-panel-white border border-border-light rounded-md shadow-sm p-4 flex flex-col justify-between h-28 hover:border-border-medium transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-text-secondary tracking-wider">TOTAL CLIENTS</span>
            <span className="text-success-green flex items-center text-[11px] font-mono font-bold">
              <ArrowUpRight size={12} /> +1 this month
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-text-primary font-sans">{clients.length}</span>
            <svg className="w-20 h-8 text-success-green" viewBox="0 0 100 30" fill="none">
              <path d="M0,25 Q15,10 30,20 T60,5 T90,15 L100,5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Stat 2: Active Tasks */}
        <div className="bg-panel-white border border-border-light rounded-md shadow-sm p-4 flex flex-col justify-between h-28 hover:border-border-medium transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-text-secondary tracking-wider">ACTIVE TASKS</span>
            <span className="text-text-muted flex items-center text-[10px] font-mono">
              In progress & review
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-text-primary font-sans">
              {recentTasks.filter(t => t.status !== 'done').length + 4}
            </span>
            <svg className="w-20 h-8 text-primary-cyan" viewBox="0 0 100 30" fill="none">
              <path d="M0,15 L20,10 L40,25 L60,8 L80,18 L100,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Stat 3: Completed Tasks */}
        <div className="bg-panel-white border border-border-light rounded-md shadow-sm p-4 flex flex-col justify-between h-28 hover:border-border-medium transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-text-secondary tracking-wider">COMPLETED TASKS</span>
            <span className="text-text-muted flex items-center text-[10px] font-mono">
              Last 30 Days
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-text-primary font-sans">
              {recentTasks.filter(t => t.status === 'done').length + 12}
            </span>
            <svg className="w-20 h-8 text-primary-cyan" viewBox="0 0 100 30" fill="none">
              <path d="M0,25 Q15,10 30,20 T60,5 T90,15 L100,5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Stat 4: Pending Approvals */}
        <div className="bg-panel-white border border-border-light rounded-md shadow-sm p-4 flex flex-col justify-between h-28 hover:border-border-medium transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-text-secondary tracking-wider">PENDING APPROVALS</span>
            <span className="text-warning-amber flex items-center text-[11px] font-mono font-bold">
              <AlertTriangle size={12} className="mr-0.5" /> 3 items
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-text-primary font-sans">3</span>
            <svg className="w-20 h-8 text-warning-amber" viewBox="0 0 100 30" fill="none">
              <path d="M0,20 L30,5 L70,25 L100,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Client Command Center Header & Filters */}
      <div className="pt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="font-sans font-semibold text-lg text-text-primary">Client Command Center</h3>
          <p className="font-mono text-[11px] text-text-secondary mt-1">LIVE CROSS-MODULE SIGNALS</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-text-muted" size={14} />
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs border border-border-medium rounded-md w-48 focus:outline-none focus:border-primary-cyan focus:ring-1 focus:ring-primary-cyan bg-panel-white"
            />
          </div>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:border-primary-cyan bg-panel-white text-text-primary cursor-pointer"
          >
            <option value="needs_attention">Needs Attention First</option>
            <option value="recently_active">Recently Active</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
          
          <div className="flex items-center bg-panel-white border border-border-medium rounded-md p-1">
            <button 
              onClick={() => setFilterBy('all')}
              className={`text-[11px] px-3 py-1 rounded transition-colors ${filterBy === 'all' ? 'bg-page-bg text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterBy('active')}
              className={`text-[11px] px-3 py-1 rounded transition-colors ${filterBy === 'active' ? 'bg-page-bg text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Active
            </button>
            <button 
              onClick={() => setFilterBy('paused')}
              className={`text-[11px] px-3 py-1 rounded transition-colors ${filterBy === 'paused' ? 'bg-page-bg text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Paused
            </button>
          </div>
        </div>
      </div>

      {/* Client Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => (
            <div key={i} className="bg-panel-white border border-border-light rounded-lg p-5 animate-pulse h-64">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-page-bg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-page-bg rounded w-24"></div>
                  <div className="h-2 bg-page-bg rounded w-16"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-page-bg rounded w-full"></div>
                <div className="h-3 bg-page-bg rounded w-5/6"></div>
                <div className="h-3 bg-page-bg rounded w-4/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-panel-white border border-border-light border-dashed rounded-lg p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-primary-cyan/10 text-primary-cyan rounded-full flex items-center justify-center mb-4">
            <Globe size={32} />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Clients Yet</h3>
          <p className="text-sm text-text-secondary mb-6 max-w-sm">
            Add your first client to see your command center. Monitor SEO, social, reputation, and more all in one place.
          </p>
          <button 
            onClick={() => navigate('/clients')}
            className="bg-primary-cyan hover:bg-primary-cyan-hover text-white font-medium text-sm px-6 py-2 rounded transition-colors"
          >
            Add Client
          </button>
        </div>
      ) : filteredAndSortedClients.length === 0 ? (
        <div className="py-12 text-center text-text-muted font-sans bg-panel-white border border-border-light rounded-lg">
          No clients match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {filteredAndSortedClients.map(client => (
            <ClientCard 
              key={client.id}
              client={client}
              health={client.health}
              signals={client.signals}
              lastUpdated={client.lastActiveStr}
            />
          ))}
        </div>
      )}

    </div>
  );
}
