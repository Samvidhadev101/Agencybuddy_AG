import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, ArrowUpRight, CheckSquare, 
  ExternalLink, FileText, Globe, Star, Mail, MapPin, 
  Users, Settings as SettingsIcon, BarChart3, AlertCircle, Edit, Trash2, Calendar,
  Link2, X
} from 'lucide-react';

const Facebook = ({ size = 14, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const Instagram = ({ size = 14, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const Linkedin = ({ size = 14, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const Twitter = ({ size = 14, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

// Embed modules
import SEO from '../seo/SEO';
import GBP from '../gbp/GBP';
import AEO from '../aeo/AEO';
import Social from '../social/Social';
import Content from '../content/Content';
import EmailCRM from '../email/EmailCRM';
import Reputation from '../reputation/Reputation';
import Analytics from '../analytics/Analytics';
import Tasks from '../tasks/Tasks';
import Geofencing from '../geofencing/Geofencing';

const getStatusDot = (status) => {
  if (status === 'active') return 'bg-emerald-500';
  if (status === 'paused') return 'bg-amber-500';
  return 'bg-gray-400';
};

export default function Clients() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { agency, clients, selectedClientId, changeSelectedClient, forceRefresh } = useApp();

  // List view states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add client form states
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Detail view states
  const [activeTab, setActiveTab] = useState('overview');
  const [clientData, setClientData] = useState(null);
  const [clientTasks, setClientTasks] = useState([]);
  const [clientReviews, setClientReviews] = useState([]);
  const [clientKeywords, setClientKeywords] = useState([]);
  const [clientAeo, setClientAeo] = useState(null);

  // Edit client states
  const [isEditing, setIsEditing] = useState(false);

  // Social Links Modal States
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialFb, setSocialFb] = useState('');
  const [socialIg, setSocialIg] = useState('');
  const [socialLi, setSocialLi] = useState('');
  const [socialTw, setSocialTw] = useState('');
  const [socialGbp, setSocialGbp] = useState('');

  // Synchronize client context on mount or URL change
  useEffect(() => {
    if (id && id !== selectedClientId) {
      changeSelectedClient(id);
    }
  }, [id, selectedClientId]);



  useEffect(() => {
    if (id) {
      loadClientDetail(id);
    }
  }, [id, clients]);

  const loadClientDetail = async (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    setClientData(client);

    // Fetch tasks
    const { data: tasks } = await supabase.from('tasks').eq('client_id', clientId);
    setClientTasks(tasks || []);

    // Fetch reviews
    const { data: reviews } = await supabase.from('reviews').eq('client_id', clientId);
    setClientReviews(reviews || []);

    // Fetch keywords
    const { data: keywords } = await supabase.from('keyword_trackers').eq('client_id', clientId);
    setClientKeywords(keywords || []);

    // Fetch AEO score
    const { data: aeo } = await supabase.from('aeo_scores').eq('client_id', clientId).maybeSingle();
    setClientAeo(aeo);
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !industry || !website) {
      setFormError('Client Name, Industry, and Website are required.');
      return;
    }

    try {
      const newClient = {
        agency_id: agency?.id || 'age_default_id',
        name,
        industry,
        website,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        status: 'active',
        notes,
        seo_audit_status: 'pending',
        aeo_audit_status: 'pending',
        last_auto_audit_at: null
      };

      const { data, error } = await supabase.from('clients').insert(newClient);
      
      if (!error) {
        // Trigger background audit asynchronously (fire and forget)
        supabase.functions.invoke('ai-generate', {
          body: { action: 'auto-audit-client', clientId: data.id, agencyId: agency?.id || 'age_default_id' }
        }).catch(err => console.error("Auto audit trigger failed", err));

        // Increment onboarding step
        const onboardingSteps = JSON.parse(localStorage.getItem('db_onboarding_progress') || '[]');
        const updatedOnboarding = onboardingSteps.map(step => 
          step.step_key === 'add_client' ? { ...step, is_completed: true, completed_at: new Date().toISOString() } : step
        );
        localStorage.setItem('db_onboarding_progress', JSON.stringify(updatedOnboarding));

        // Create log trigger
        const log = {
          id: Math.random().toString(),
          agency_id: agency?.id || 'age_default_id',
          action: 'client-setup',
          module: 'general',
          tokens_used: 0,
          description: `Onboarded Client: ${name}`,
          created_at: new Date().toISOString()
        };


        // Create notification
        const notification = {
          id: Math.random().toString(),
          agency_id: agency?.id || 'age_default_id',
          user_id: 'usr_boss_id',
          title: 'New Client Onboarded',
          message: `${name} has been added successfully to your agency workspace.`,
          type: 'success',
          is_read: false,
          link: `/clients/${data.id}`,
          created_at: new Date().toISOString()
        };
        const notifications = JSON.parse(localStorage.getItem('db_notifications') || '[]');
        notifications.push(notification);
        localStorage.setItem('db_notifications', JSON.stringify(notifications));

        window.dispatchEvent(new Event('local_db_change'));
        forceRefresh();
        setShowAddModal(false);
        // Clear fields
        setName('');
        setIndustry('');
        setWebsite('');
        setContactName('');
        setContactEmail('');
        setContactPhone('');
        setNotes('');
        
        navigate(`/clients/${data.id}`);
      }
    } catch (err) {
      setFormError('Failed to add client. Check your entries.');
    }
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    try {
      await supabase.from('clients').eq('id', id).update({
        name: clientData.name,
        industry: clientData.industry,
        website: clientData.website,
        contact_name: clientData.contact_name,
        contact_email: clientData.contact_email,
        contact_phone: clientData.contact_phone,
        notes: clientData.notes,
        status: clientData.status
      });
      setIsEditing(false);
      window.dispatchEvent(new Event('local_db_change'));
      alert('Client details updated.');
    } catch (e) {
      alert('Failed to update client.');
    }
  };

  // Filter clients
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.website.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesIndustry = industryFilter === 'all' || c.industry === industryFilter;
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const getIndustryList = () => {
    const list = clients.map(c => c.industry);
    return [...new Set(list)];
  };

  // Route routing checks
  if (currentPath === '/clients/new') {
    return <AddClientForm />;
  }

  if (id && currentPath.endsWith('/edit')) {
    return <EditClientForm clientId={id} />;
  }

  // RENDER: Client List Page
  if (!id) {
    return (
      <div className="space-y-6 animate-fade-in font-sans pb-12">
        <div className="flex items-center justify-between border-b border-border-light pb-4">
          <div>
            <h2 className="text-[20px] font-bold text-text-primary">Clients</h2>
            <p className="text-xs text-text-secondary">Onboard and manage profiles for your accounts.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-medium cursor-pointer shadow transition-colors"
          >
            <Plus size={14} />
            <span>Add Client</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-panel-white border border-border-light rounded p-4">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-2.5 top-2.5 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-border-light rounded pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary-cyan"
            />
          </div>

          <div className="flex gap-3 w-full sm:w-auto shrink-0 select-none">
            <div className="flex items-center gap-1.5 border border-border-light rounded px-2 py-1.5 bg-page-bg/40 text-xs">
              <span className="font-mono text-[9px] uppercase font-bold text-text-secondary">STATUS:</span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent focus:outline-none font-semibold cursor-pointer text-text-primary"
              >
                <option value="all">ALL</option>
                <option value="active">ACTIVE</option>
                <option value="paused">PAUSED</option>
                <option value="archived">ARCHIVED</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 border border-border-light rounded px-2 py-1.5 bg-page-bg/40 text-xs">
              <span className="font-mono text-[9px] uppercase font-bold text-text-secondary">INDUSTRY:</span>
              <select 
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="bg-transparent focus:outline-none font-semibold cursor-pointer text-text-primary"
              >
                <option value="all">ALL</option>
                {getIndustryList().map(ind => (
                  <option key={ind} value={ind}>{ind.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        {filteredClients.length === 0 ? (
          <div className="bg-panel-white border border-border-light rounded-md shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-cyan-50 border border-primary-cyan/10 flex items-center justify-center text-primary-cyan">
              <Users size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-text-primary">No clients found</h3>
              <p className="text-xs text-text-secondary max-w-sm">
                Add your first client to start auditing SEO, checking GBP reviews, and executing automated geo-campaigns.
              </p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer transition-colors"
            >
              Add Client Now
            </button>
          </div>
        ) : (
          <div className="bg-panel-white border border-border-light rounded-md shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-page-bg/40 border-b border-border-light text-[10px] font-mono text-text-secondary uppercase">
                  <th className="py-2.5 px-4 font-semibold">Client Name</th>
                  <th className="py-2.5 px-4 font-semibold">Industry</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Assigned Team</th>
                  <th className="py-2.5 px-4 font-semibold">Last Activity</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-page-bg text-xs">
                {filteredClients.map(c => (
                  <tr key={c.id} className="hover:bg-[#F0FDFA] transition-colors">
                    <td className="py-3 px-4 font-medium text-text-primary">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-primary-cyan/10 text-primary-cyan text-xs font-bold flex items-center justify-center">
                          {c.name.charAt(0)}
                        </span>
                        <div className="flex flex-col">
                          <Link to={`/clients/${c.id}`} className="font-semibold hover:text-primary-cyan transition-colors">
                            {c.name}
                          </Link>
                          <span className="text-[10px] text-text-muted font-mono">{c.website}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">{c.industry}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {/* Overlapping avatars */}
                      <div className="flex -space-x-2 overflow-hidden select-none">
                        <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="avatar" />
                        <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="avatar" />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-text-secondary">
                      {c.id === 'cli_kovai_id' ? 'TODAY 11:20' : 'YESTERDAY 15:45'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/clients/${c.id}`} className="p-1 text-text-secondary hover:text-primary-cyan hover:bg-page-bg rounded transition-colors">
                          <Plus size={14} />
                        </Link>
                        <button 
                          onClick={() => {
                            if (confirm(`Archive ${c.name}?`)) {
                              const list = JSON.parse(localStorage.getItem('db_clients') || '[]');
                              const updated = list.map(item => item.id === c.id ? { ...item, status: 'paused' } : item);
                              localStorage.setItem('db_clients', JSON.stringify(updated));
                              window.dispatchEvent(new Event('local_db_change'));
                              forceRefresh();
                            }
                          }}
                          className="p-1 text-text-secondary hover:text-error-red hover:bg-red-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ADD CLIENT MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-panel-white border border-border-light rounded-lg shadow-2xl p-6 relative">
              <h3 className="text-sm font-semibold text-text-primary border-b border-border-light pb-3 mb-4">
                ADD NEW CLIENT
              </h3>

              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-error-red text-[11px] rounded mb-3">
                  {formError}
                </div>
              )}

              <form onSubmit={handleAddClient} className="space-y-3 font-sans">
                <div className="space-y-1">
                  <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
                    Client / Business Name *
                  </label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Kovai Biryani"
                    className="w-full h-8 border border-border-light rounded px-2.5 text-xs focus:outline-none focus:border-primary-cyan"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
                    Industry *
                  </label>
                  <input 
                    type="text" 
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Food & Beverage, Real Estate, Healthcare..."
                    className="w-full h-8 border border-border-light rounded px-2.5 text-xs focus:outline-none focus:border-primary-cyan"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
                    Website URL *
                  </label>
                  <input 
                    type="text" 
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="kovaibiryani.in"
                    className="w-full h-8 border border-border-light rounded px-2.5 text-xs focus:outline-none focus:border-primary-cyan"
                  />
                </div>

                <div className="border-t border-page-bg my-3 pt-3">
                  <span className="font-mono text-[9px] text-text-muted font-bold block mb-2 uppercase">
                    Primary Contact Details
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">
                        Name
                      </label>
                      <input 
                        type="text" 
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Karthik Raja"
                        className="w-full h-8 border border-border-light rounded px-2 text-xs focus:outline-none focus:border-primary-cyan"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">
                        Email
                      </label>
                      <input 
                        type="email" 
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="karthik@kovaibiryani.in"
                        className="w-full h-8 border border-border-light rounded px-2 text-xs focus:outline-none focus:border-primary-cyan"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
                    Notes
                  </label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Key priorities, targets, and notes..."
                    className="w-full border border-border-light rounded p-2 text-xs h-16 focus:outline-none focus:border-primary-cyan font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border-light pt-3 mt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-1.5 border border-border-light rounded text-xs text-text-secondary hover:bg-page-bg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-3.5 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Save Client
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER: Client Detail Workspace
  if (!clientData) {
    return (
      <div className="p-8 text-center text-xs text-text-muted">
        Loading client files...
      </div>
    );
  }

  const criticalIssues = clientTasks.filter(t => t.priority === 'high' || t.priority === 'urgent');

  const handleSaveSocial = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('clients').eq('id', id).update({
        facebook_url: socialFb.trim(),
        instagram_url: socialIg.trim(),
        linkedin_url: socialLi.trim(),
        twitter_url: socialTw.trim(),
        gbp_url: socialGbp.trim()
      });
      if (!error) {
        window.dispatchEvent(new Event('local_db_change'));
        forceRefresh();
        setShowSocialModal(false);
        alert('Social links updated.');
      } else {
        alert('Failed to update social: ' + error.message);
      }
    } catch (e) {
      alert('Failed to update social.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      
      {/* Detail Header */}
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-3">
          <Link to="/clients" className="text-xs font-mono text-text-muted hover:text-primary-cyan">
            CLIENTS /
          </Link>
          <h2 className="text-2xl font-bold text-text-primary leading-none tracking-tight">
            {clientData.name}
          </h2>
          <span className="bg-[#E0F2FE] text-[#075985] text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border border-[#0759851F]">
            {clientData.industry}
          </span>
          <span className={`w-2.5 h-2.5 rounded-full ${getStatusDot(clientData.status)}`} />

          {/* Social Links Icons */}
          <div className="flex items-center gap-2 border-l border-border-light pl-3 ml-1 select-none">
            {clientData.facebook_url && (
              <a href={clientData.facebook_url} target="_blank" rel="noreferrer" className="text-text-secondary hover:text-[#1877F2] transition-colors" title="Facebook">
                <Facebook size={14} />
              </a>
            )}
            {clientData.instagram_url && (
              <a href={clientData.instagram_url} target="_blank" rel="noreferrer" className="text-text-secondary hover:text-[#E1306C] transition-colors" title="Instagram">
                <Instagram size={14} />
              </a>
            )}
            {clientData.linkedin_url && (
              <a href={clientData.linkedin_url} target="_blank" rel="noreferrer" className="text-text-secondary hover:text-[#0A66C2] transition-colors" title="LinkedIn">
                <Linkedin size={14} />
              </a>
            )}
            {clientData.twitter_url && (
              <a href={clientData.twitter_url} target="_blank" rel="noreferrer" className="text-text-secondary hover:text-[#1DA1F2] transition-colors" title="Twitter / X">
                <Twitter size={14} />
              </a>
            )}
            {clientData.gbp_url && (
              <a href={clientData.gbp_url} target="_blank" rel="noreferrer" className="text-text-secondary hover:text-[#4285F4] transition-colors" title="Google Business Profile">
                <Globe size={14} />
              </a>
            )}
            <button 
              onClick={() => {
                setSocialFb(clientData.facebook_url || '');
                setSocialIg(clientData.instagram_url || '');
                setSocialLi(clientData.linkedin_url || '');
                setSocialTw(clientData.twitter_url || '');
                setSocialGbp(clientData.gbp_url || '');
                setShowSocialModal(true);
              }}
              className="p-1 hover:bg-page-bg text-text-secondary hover:text-text-primary rounded transition-colors cursor-pointer"
              title="Edit Social Links"
            >
              <SettingsIcon size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 select-none">
          <a 
            href={`https://${clientData.website}`} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 border border-border-light hover:border-border-medium bg-panel-white rounded text-xs font-medium text-text-secondary hover:text-text-primary transition-all duration-150"
          >
            <span>Visit website</span>
            <ExternalLink size={12} />
          </a>
          <button 
            onClick={() => navigate(`/clients/${id}/edit`)}
            className="px-3 py-1.5 bg-panel-white border border-border-light hover:border-border-medium rounded text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <Edit size={12} className="inline mr-1" /> Edit
          </button>
        </div>
      </div>

      {/* Edit Social Links Modal */}
      {showSocialModal && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-panel-white border border-border-light rounded-lg shadow-2xl p-6 relative">
            <div className="flex items-center justify-between border-b border-border-light pb-3 mb-4">
              <h3 className="text-sm font-semibold text-text-primary">
                EDIT SOCIAL LINKS
              </h3>
              <button 
                onClick={() => setShowSocialModal(false)}
                className="text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSocial} className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-[#1877F2] uppercase">Facebook URL</label>
                <input 
                  type="text" 
                  value={socialFb} 
                  onChange={e => setSocialFb(e.target.value)} 
                  placeholder="https://facebook.com/..."
                  className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-primary-cyan outline-none" 
                />
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-[#E1306C] uppercase">Instagram URL</label>
                <input 
                  type="text" 
                  value={socialIg} 
                  onChange={e => setSocialIg(e.target.value)} 
                  placeholder="https://instagram.com/..."
                  className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-primary-cyan outline-none" 
                />
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-[#0A66C2] uppercase">LinkedIn URL</label>
                <input 
                  type="text" 
                  value={socialLi} 
                  onChange={e => setSocialLi(e.target.value)} 
                  placeholder="https://linkedin.com/company/..."
                  className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-primary-cyan outline-none" 
                />
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-[#1DA1F2] uppercase">Twitter / X URL</label>
                <input 
                  type="text" 
                  value={socialTw} 
                  onChange={e => setSocialTw(e.target.value)} 
                  placeholder="https://twitter.com/..."
                  className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-primary-cyan outline-none" 
                />
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-[#4285F4] uppercase">Google Business Profile URL</label>
                <input 
                  type="text" 
                  value={socialGbp} 
                  onChange={e => setSocialGbp(e.target.value)} 
                  placeholder="https://maps.google.com/?cid=..."
                  className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-primary-cyan outline-none" 
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border-light pt-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowSocialModal(false)}
                  className="px-3.5 py-1.5 border border-border-light rounded text-xs text-text-secondary hover:bg-page-bg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-3.5 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Save Links
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="border-b border-border-light select-none">
        <div className="flex gap-6 -mb-[1px]">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'seo', label: 'SEO Audit' },
            { id: 'gbp', label: 'GBP Listing' },
            { id: 'aeo', label: 'AEO Engine' },
            { id: 'social', label: 'Social Suite' },
            { id: 'content', label: 'Content Hub' },
            { id: 'email', label: 'Email CRM' },
            { id: 'reputation', label: 'Reputation' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'tasks', label: 'Tasks Operations' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id 
                  ? 'border-primary-cyan text-primary-cyan font-semibold' 
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="animate-fade-in">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left columns: Stats Metrics */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-panel-white border border-border-light rounded p-4 flex flex-col justify-between h-24">
                  <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">SEO KEYWORDS</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xl font-bold font-sans">{clientKeywords.length} tracked</span>
                    <span className="text-xs font-mono text-success-green font-bold">2 in top 3</span>
                  </div>
                </div>

                <div className="bg-panel-white border border-border-light rounded p-4 flex flex-col justify-between h-24">
                  <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">GBP REVIEWS AVG</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xl font-bold font-sans">
                      {(clientReviews.reduce((acc, r) => acc + r.rating, 0) / (clientReviews.length || 1)).toFixed(1)} ★
                    </span>
                    <span className="text-xs font-mono text-text-secondary font-bold">{clientReviews.length} total</span>
                  </div>
                </div>

                <div className="bg-panel-white border border-border-light rounded p-4 flex flex-col justify-between h-24">
                  <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">AEO BRAND MENTION</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xl font-bold font-sans">{clientAeo ? `${clientAeo.overall_score}%` : '75%'}</span>
                    <span className="text-xs font-mono text-success-green font-bold">Upward trend</span>
                  </div>
                </div>

                <div className="bg-panel-white border border-border-light rounded p-4 flex flex-col justify-between h-24">
                  <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">CRM PIPELINE STAGE</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xl font-bold font-sans">Corporate won</span>
                    <span className="text-xs font-mono text-primary-cyan font-bold">4 contacts</span>
                  </div>
                </div>
              </div>

              {/* Operations Task Lists */}
              <div className="bg-panel-white border border-border-light rounded shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border-light flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">Active Operations Tasks</span>
                  <Link to="/tasks" className="text-xs text-primary-cyan hover:underline">View Kanban Board</Link>
                </div>
                
                <div className="divide-y divide-page-bg text-xs">
                  {clientTasks.length === 0 ? (
                    <div className="p-8 text-center text-text-muted">No active tasks for this client.</div>
                  ) : (
                    clientTasks.map(task => (
                      <div key={task.id} className="p-3 flex items-center justify-between hover:bg-page-bg/20 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            task.status === 'done' ? 'bg-success-green' : task.status === 'in_progress' ? 'bg-primary-cyan' : 'bg-warning-amber'
                          }`} />
                          <span className="font-medium text-text-primary">{task.title}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[9px] uppercase font-bold text-text-muted bg-page-bg px-2 py-0.5 rounded">
                            {task.module}
                          </span>
                          <span className={`font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            task.priority === 'urgent' ? 'bg-red-100 text-red-700' : task.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right sidebar: Notes & Contacts */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-panel-white border border-border-light rounded shadow-sm p-4 space-y-3">
                <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-1.5">
                  Internal Workspace Notes
                </span>
                <p className="text-xs text-text-secondary leading-relaxed bg-page-bg/40 p-2.5 rounded border border-page-bg">
                  {clientData.notes || 'No profile notes recorded.'}
                </p>
              </div>

              {/* Primary Contacts */}
              <div className="bg-panel-white border border-border-light rounded shadow-sm p-4 space-y-3">
                <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-1.5">
                  Primary Client Contact
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Name:</span>
                    <span className="font-semibold text-text-primary">{clientData.contact_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Email:</span>
                    <span className="font-semibold text-text-primary">{clientData.contact_email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Phone:</span>
                    <span className="font-mono font-semibold text-text-primary">{clientData.contact_phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* SEO ADAPTER */}
        {activeTab === 'seo' && <SEO />}

        {/* GBP ADAPTER */}
        {activeTab === 'gbp' && <GBP />}

        {/* AEO ADAPTER */}
        {activeTab === 'aeo' && <AEO />}

        {/* SOCIAL ADAPTER */}
        {activeTab === 'social' && <Social />}

        {/* CONTENT ADAPTER */}
        {activeTab === 'content' && <Content />}

        {/* EMAIL ADAPTER */}
        {activeTab === 'email' && <EmailCRM />}

        {/* REPUTATION ADAPTER */}
        {activeTab === 'reputation' && <Reputation />}

        {/* ANALYTICS ADAPTER */}
        {activeTab === 'analytics' && <Analytics />}

        {/* TASKS ADAPTER */}
        {activeTab === 'tasks' && <Tasks />}

      </div>
      
    </div>
  );
}

// ----------------------------------------------------
// FULL PAGE VIEW: Add Client Form
// ----------------------------------------------------
function AddClientForm() {
  const { agency, forceRefresh } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [gbp, setGbp] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !industry.trim() || !website.trim()) {
      setFormError('Client Name, Industry, and Website are required.');
      return;
    }

    setSaving(true);
    try {
      const newClient = {
        agency_id: agency?.id || 'age_default_id',
        name: name.trim(),
        industry: industry.trim(),
        website: website.trim(),
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        facebook_url: facebook.trim(),
        instagram_url: instagram.trim(),
        linkedin_url: linkedin.trim(),
        twitter_url: twitter.trim(),
        gbp_url: gbp.trim(),
        status: 'active',
        notes: notes.trim(),
        seo_audit_status: 'pending',
        aeo_audit_status: 'pending',
        last_auto_audit_at: null
      };

      const { data, error } = await supabase.from('clients').insert(newClient);
      
      if (!error && data) {
        // Trigger background audit asynchronously (fire and forget)
        supabase.functions.invoke('ai-generate', {
          body: { action: 'auto-audit-client', clientId: data.id, agencyId: agency?.id || 'age_default_id' }
        }).catch(err => console.error("Auto audit trigger failed", err));

        // Increment onboarding step
        const onboardingSteps = JSON.parse(localStorage.getItem('db_onboarding_progress') || '[]');
        const updatedOnboarding = onboardingSteps.map(step => 
          step.step_key === 'add_client' ? { ...step, is_completed: true, completed_at: new Date().toISOString() } : step
        );
        localStorage.setItem('db_onboarding_progress', JSON.stringify(updatedOnboarding));

        // Create log trigger
        const log = {
          id: Math.random().toString(),
          agency_id: agency?.id || 'age_default_id',
          action: 'client-setup',
          module: 'general',
          tokens_used: 0,
          description: `Onboarded Client: ${name}`,
          created_at: new Date().toISOString()
        };


        // Create notification
        const notification = {
          id: Math.random().toString(),
          agency_id: agency?.id || 'age_default_id',
          user_id: 'usr_boss_id',
          title: 'New Client Onboarded',
          message: `${name} has been added successfully to your agency workspace.`,
          type: 'success',
          is_read: false,
          link: `/clients/${data.id}`,
          created_at: new Date().toISOString()
        };
        const notifications = JSON.parse(localStorage.getItem('db_notifications') || '[]');
        notifications.push(notification);
        localStorage.setItem('db_notifications', JSON.stringify(notifications));

        window.dispatchEvent(new Event('local_db_change'));
        forceRefresh();
        alert('Client onboarded successfully.');
        navigate(`/clients/${data.id}`);
      } else {
        setFormError(error?.message || 'Failed to save client.');
      }
    } catch (err) {
      setFormError('Failed to add client. Check your entries.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans py-4 animate-fade-in select-none">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div>
          <Link to="/clients" className="text-xs font-mono text-text-muted hover:text-primary-cyan uppercase">
            &larr; Back to clients list
          </Link>
          <h2 className="text-xl font-bold text-text-primary mt-1">Onboard New Client</h2>
        </div>
      </div>

      <div className="bg-panel-white border border-border-light rounded-lg shadow-sm p-6">
        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 text-error-red text-xs rounded mb-4">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
                Client / Business Name *
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Dental"
                className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
                Industry *
              </label>
              <input 
                type="text" 
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Healthcare, Real Estate"
                className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
                Website URL *
              </label>
              <input 
                type="text" 
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g. apexdental.com"
                className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none"
              />
            </div>
          </div>

          <div className="border-t border-page-bg pt-4">
            <h3 className="font-mono text-[10px] font-bold text-text-secondary uppercase mb-3">Primary Contact Person</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Name</label>
                <input 
                  type="text" 
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Dr. Sandeep"
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Email</label>
                <input 
                  type="email" 
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. sandeep@apex.com"
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Phone</label>
                <input 
                  type="text" 
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. +91 99000 12345"
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-page-bg pt-4">
            <h3 className="font-mono text-[10px] font-bold text-text-secondary uppercase mb-3">Social & Listing Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-[#1877F2] uppercase">Facebook URL</label>
                <input 
                  type="text" 
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-[#E1306C] uppercase">Instagram URL</label>
                <input 
                  type="text" 
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-[#0A66C2] uppercase">LinkedIn URL</label>
                <input 
                  type="text" 
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-[#1DA1F2] uppercase">Twitter / X URL</label>
                <input 
                  type="text" 
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://twitter.com/..."
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none font-mono"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="block font-mono text-[9px] font-bold text-[#4285F4] uppercase">Google Business Profile URL</label>
                <input 
                  type="text" 
                  value={gbp}
                  onChange={(e) => setGbp(e.target.value)}
                  placeholder="https://maps.google.com/?cid=..."
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-page-bg pt-4 space-y-1">
            <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
              Internal Workspace Notes
            </label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Target audience, campaigns goals, onboarding details..."
              className="w-full border border-border-light rounded p-3 text-xs h-24 focus:ring-1 focus:ring-primary-cyan outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border-light pt-4">
            <button 
              type="button" 
              onClick={() => navigate('/clients')}
              className="px-4 py-2 border border-border-light rounded text-xs text-text-secondary hover:bg-page-bg cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Onboard Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// FULL PAGE VIEW: Edit Client Form
// ----------------------------------------------------
function EditClientForm({ clientId }) {
  const { clients, forceRefresh } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [gbp, setGbp] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('active');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setName(client.name || '');
      setIndustry(client.industry || '');
      setWebsite(client.website || '');
      setContactName(client.contact_name || '');
      setContactEmail(client.contact_email || '');
      setContactPhone(client.contact_phone || '');
      setFacebook(client.facebook_url || '');
      setInstagram(client.instagram_url || '');
      setLinkedin(client.linkedin_url || '');
      setTwitter(client.twitter_url || '');
      setGbp(client.gbp_url || '');
      setNotes(client.notes || '');
      setStatus(client.status || 'active');
    }
  }, [clientId, clients]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !industry.trim() || !website.trim()) {
      setFormError('Client Name, Industry, and Website are required.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('clients').eq('id', clientId).update({
        name: name.trim(),
        industry: industry.trim(),
        website: website.trim(),
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        facebook_url: facebook.trim(),
        instagram_url: instagram.trim(),
        linkedin_url: linkedin.trim(),
        twitter_url: twitter.trim(),
        gbp_url: gbp.trim(),
        status,
        notes: notes.trim()
      });
      
      if (!error) {
        window.dispatchEvent(new Event('local_db_change'));
        forceRefresh();
        alert('Client details updated.');
        navigate(`/clients/${clientId}`);
      } else {
        setFormError(error.message || 'Failed to update client.');
      }
    } catch (err) {
      setFormError('Failed to update client.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans py-4 animate-fade-in select-none">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div>
          <Link to={`/clients/${clientId}`} className="text-xs font-mono text-text-muted hover:text-primary-cyan uppercase">
            &larr; Back to client profile
          </Link>
          <h2 className="text-xl font-bold text-text-primary mt-1">Edit Client Profile</h2>
        </div>
      </div>

      <div className="bg-panel-white border border-border-light rounded-lg shadow-sm p-6">
        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 text-error-red text-xs rounded mb-4">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
                Client / Business Name *
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
                Industry *
              </label>
              <input 
                type="text" 
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
                Website URL *
              </label>
              <input 
                type="text" 
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
                Status
              </label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-border-light rounded px-3 py-1.5 text-xs bg-panel-white focus:outline-none focus:border-primary-cyan"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="border-t border-page-bg pt-4">
            <h3 className="font-mono text-[10px] font-bold text-text-secondary uppercase mb-3">Primary Contact Person</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Name</label>
                <input 
                  type="text" 
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Email</label>
                <input 
                  type="email" 
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Phone</label>
                <input 
                  type="text" 
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-page-bg pt-4">
            <h3 className="font-mono text-[10px] font-bold text-text-secondary uppercase mb-3">Social & Listing Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-[#1877F2] uppercase">Facebook URL</label>
                <input 
                  type="text" 
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-[#E1306C] uppercase">Instagram URL</label>
                <input 
                  type="text" 
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-[#0A66C2] uppercase">LinkedIn URL</label>
                <input 
                  type="text" 
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-[#1DA1F2] uppercase">Twitter / X URL</label>
                <input 
                  type="text" 
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none font-mono"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="block font-mono text-[9px] font-bold text-[#4285F4] uppercase">Google Business Profile URL</label>
                <input 
                  type="text" 
                  value={gbp}
                  onChange={(e) => setGbp(e.target.value)}
                  className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-page-bg pt-4 space-y-1">
            <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
              Internal Workspace Notes
            </label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-border-light rounded p-3 text-xs h-24 focus:ring-1 focus:ring-primary-cyan outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border-light pt-4">
            <button 
              type="button" 
              onClick={() => navigate(`/clients/${clientId}`)}
              className="px-4 py-2 border border-border-light rounded text-xs text-text-secondary hover:bg-page-bg cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
