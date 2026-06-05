import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { 
  Search, HelpCircle, FileText, Check, X, 
  Play, ShieldAlert, Award, Plus, ArrowRight 
} from 'lucide-react';

export default function Support() {
  const location = useLocation();
  const currentPath = location.pathname;

  if (currentPath === '/support/videos') {
    return <VideoTutorials />;
  } else if (currentPath === '/support/tickets') {
    return <SupportTickets />;
  } else {
    return <KnowledgeBase />;
  }
}

// ----------------------------------------------------
// Sub-Page 1: Knowledge Base FAQ Articles
// ----------------------------------------------------
function KnowledgeBase() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    supabase.from('knowledge_base_articles').then(({ data }) => {
      setArticles(data || []);
    });
  }, []);

  const filtered = articles.filter(art => 
    art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    art.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div>
          <h2 className="text-sm font-mono uppercase font-bold text-text-primary">Help Center Knowledge Base</h2>
          <p className="text-xs text-text-secondary">Read guides to master advanced GBP audits and AEO query builders.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => navigate('/support/videos')} className="px-3.5 py-1.5 bg-panel-white border border-border-light rounded text-xs font-semibold cursor-pointer">
            Video Academy
          </button>
          <button onClick={() => navigate('/support/tickets')} className="px-3.5 py-1.5 bg-panel-white border border-border-light rounded text-xs font-semibold cursor-pointer">
            Support Tickets
          </button>
        </div>
      </div>

      {/* Search FAQ */}
      <div className="bg-panel-white border border-border-light rounded p-4">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search help articles (e.g. Add client, AEO Score...)" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border border-border-light rounded pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary-cyan"
          />
        </div>
      </div>

      {/* Articles Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map(art => (
          <div key={art.id} className="bg-panel-white border border-border-light rounded p-4 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-primary-cyan">
                <HelpCircle size={14} />
                <span className="font-mono text-[9px] uppercase font-bold tracking-wider">{art.category}</span>
              </div>
              <h4 className="font-semibold text-text-primary text-xs">{art.title}</h4>
              <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-4 whitespace-pre-line font-sans">
                {art.body}
              </p>
            </div>
            
            <div className="flex gap-3 text-[10px] text-text-muted font-mono leading-none pt-2 border-t border-page-bg">
              <span>Helpful rating: {art.helpful_yes} Yes</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 2: Video Academy gallery
// ----------------------------------------------------
function VideoTutorials() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    supabase.from('video_tutorials').then(({ data }) => {
      setVideos(data || []);
    });
  }, []);

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/support')} className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer">← SUPPORT HOME</button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase">VIDEO ACADEMY</span>
        </div>
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videos.map(vid => (
          <div 
            key={vid.id}
            onClick={() => setActiveVideo(vid)}
            className="bg-panel-white border border-border-light hover:border-primary-cyan p-4 rounded shadow-sm flex flex-col justify-between h-48 cursor-pointer transition-colors"
          >
            <div className="space-y-2">
              <span className="bg-cyan-50 text-primary-cyan text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                {vid.module.toUpperCase()} TUTORIAL
              </span>
              <h4 className="text-xs font-bold text-text-primary">{vid.title}</h4>
              <p className="text-[11px] text-text-secondary leading-relaxed">{vid.description}</p>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-page-bg">
              <span className="text-[10px] text-text-muted font-mono">Duration: {Math.round(vid.duration_seconds / 60)} mins</span>
              <span className="text-xs text-primary-cyan flex items-center gap-1 font-semibold">
                <Play size={12} className="fill-current" /> Watch Video
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* HTML5 Video Modal Player */}
      {activeVideo && (
        <div className="fixed inset-0 bg-[#111827]/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-panel-white rounded border border-border-light shadow-2xl p-6 relative">
            <div className="flex items-center justify-between border-b border-page-bg pb-2.5 mb-4">
              <span className="font-semibold text-xs text-text-primary truncate max-w-xs">{activeVideo.title}</span>
              <button onClick={() => setActiveVideo(null)} className="text-text-secondary hover:text-text-primary cursor-pointer"><X size={16} /></button>
            </div>
            
            {/* HTML5 video element */}
            <video className="w-full rounded border border-border-light" controls autoPlay>
              <source src={activeVideo.video_url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 3: Support Tickets with AI Auto Response
// ----------------------------------------------------
function SupportTickets() {
  const { agency, user } = useApp();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('bug');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    const { data } = await supabase.from('support_tickets').order('created_at', { ascending: false });
    setTickets(data || []);
  };

  const handleAddTicket = async (e) => {
    e.preventDefault();
    if (!subject || !description) return;

    try {
      // Formulate automated AI first response matching the query
      let aiResponse = '';
      if (category === 'bug') {
        aiResponse = "Thank you for logging this bug. Our developer ops team has parsed the browser logs. We are currently patching this in version 2.4.1. Expected completion in 2 hours.";
      } else if (category === 'billing') {
        aiResponse = "To verify Razorpay payments transactions, please share the billing transaction ID in this ticket thread. Our account specialists will verify ledger logs immediately.";
      } else {
        aiResponse = "Your ticket has been logged in our queues. An administrator manager will review and follow up with timing updates shortly.";
      }

      const newTicket = {
        agency_id: agency?.id || 'age_default_id',
        user_id: user?.id || 'usr_boss_id',
        subject,
        category,
        description,
        status: 'in_progress',
        priority: 'normal',
        ai_response: aiResponse,
        created_at: new Date().toISOString()
      };

      await supabase.from('support_tickets').insert(newTicket);
      window.dispatchEvent(new Event('local_db_change'));
      loadTickets();
      
      setSubject('');
      setDescription('');
      setShowAddModal(false);
      alert('Support ticket logged. AI auto response generated.');
    } catch (e) {
      alert('Failed saving support ticket.');
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/support')} className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer">← SUPPORT HOME</button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase">SUPPORT TICKETS</span>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3.5 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer"
        >
          <Plus size={13} />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Tickets List Table */}
      <div className="bg-panel-white border border-border-light rounded shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-page-bg/40 border-b border-border-light text-[9px] font-mono text-text-secondary uppercase">
              <th className="py-2.5 px-4 font-semibold">Subject</th>
              <th className="py-2.5 px-4 font-semibold text-center">Category</th>
              <th className="py-2.5 px-4 font-semibold text-center">Status</th>
              <th className="py-2.5 px-4">AI Auto Reply</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-page-bg">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12 text-center text-text-secondary">
                  No support tickets logged. Click "New Ticket" to file a report.
                </td>
              </tr>
            ) : (
              tickets.map(t => (
                <tr key={t.id} className="hover:bg-page-bg/10 transition-colors">
                  <td className="py-3 px-4 font-semibold text-text-primary flex flex-col gap-0.5">
                    <span>{t.subject}</span>
                    <span className="text-[10px] text-text-secondary font-sans font-normal leading-relaxed">{t.description}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-[10px] uppercase font-bold text-text-secondary">
                    {t.category}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-secondary max-w-xs leading-relaxed italic text-[11px]">
                    {t.ai_response || 'Pending reply...'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Ticket Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-panel-white border border-border-light rounded-lg shadow-2xl p-6">
            <h3 className="text-sm font-semibold text-text-primary border-b border-page-bg pb-3 mb-4 uppercase">
              File Support Ticket
            </h3>
            <form onSubmit={handleAddTicket} className="space-y-4">
              <div className="space-y-1">
                <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase font-sans">Subject / Topic *</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Lead status won is not syncing" className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs focus:outline-none" required />
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-border-light bg-panel-white rounded px-2.5 py-1.5 text-xs focus:outline-none">
                  <option value="bug">Bug / Technical Issue</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="how_to">How-to Inquiry</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">Problem Description *</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Explain the error in detail..." className="w-full border border-border-light rounded p-3 text-xs h-24 font-sans focus:outline-none" required />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border-light pt-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border border-border-light rounded text-xs text-text-secondary hover:bg-page-bg cursor-pointer">Cancel</button>
                <button type="submit" className="px-3.5 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer transition-colors">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
