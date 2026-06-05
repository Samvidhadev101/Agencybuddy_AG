import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, ShieldAlert, Award, FileText, CheckCircle2,
  Clock, Mail, Phone, Calendar, ArrowRight, UserPlus, Save, Trash2, Edit 
} from 'lucide-react';

export default function Team() {
  const location = useLocation();
  const currentPath = location.pathname;

  if (currentPath === '/team/time') {
    return <TimeSheetLogs />;
  } else if (currentPath === '/team/workload') {
    return <WorkloadCapacity />;
  } else if (currentPath === '/team/sops') {
    return <SOPLibrary />;
  } else if (currentPath === '/team/invite') {
    return <InviteTeammateForm />;
  } else {
    return <TeamDirectory />;
  }
}

// ----------------------------------------------------
// Sub-Page 1: Team Directory
// ----------------------------------------------------
function TeamDirectory() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    supabase.from('users').then(({ data }) => {
      setMembers(data || []);
    });
  }, []);

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div>
          <h2 className="text-sm font-mono uppercase font-bold text-text-primary">Teammates Index Directory</h2>
          <p className="text-xs text-text-secondary">Invite team operators and define access rights policies.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => navigate('/team/workload')} className="px-3.5 py-1.5 bg-panel-white border border-border-light rounded text-xs font-semibold cursor-pointer">
            Workload Capacity
          </button>
          <button onClick={() => navigate('/team/sops')} className="px-3.5 py-1.5 bg-panel-white border border-border-light rounded text-xs font-semibold cursor-pointer">
            SOP Wiki Docs
          </button>
          
          <button 
            onClick={() => navigate('/team/invite')}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer"
          >
            <UserPlus size={13} />
            <span>Invite Teammate</span>
          </button>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {members.map(mem => (
          <div key={mem.id} className="bg-panel-white border border-border-light rounded shadow-sm p-5 flex items-start gap-4">
            <img 
              src={mem.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} 
              alt={mem.full_name} 
              className="w-12 h-12 rounded border border-border-medium object-cover shrink-0"
            />
            
            <div className="space-y-1 truncate">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-text-primary text-xs leading-none truncate max-w-[120px]">{mem.full_name}</h4>
                <span className={mem.role === 'custom' ? "bg-amber-50 text-amber-700 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase leading-none border border-amber-200" : "bg-emerald-50 text-emerald-700 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase leading-none border border-emerald-100"}>
                  {mem.role}
                </span>
              </div>
              <p className="text-[10px] text-text-secondary font-mono truncate">{mem.email}</p>
              
              {mem.role === 'custom' ? (
                <div className="flex flex-col gap-1.5 text-[10px] text-text-muted font-mono leading-none pt-2">
                  <div className="flex gap-2">
                    <span>{mem.custom_permissions?.modules ? Object.values(mem.custom_permissions.modules).filter(Boolean).length : 0} modules</span>
                    <span>•</span>
                    <span>{mem.custom_permissions?.client_scope === 'all' ? 'All' : mem.assigned_client_ids?.length || 0} clients</span>
                    <span>•</span>
                    <span>AI {mem.ai_access_enabled ? 'on' : 'off'}</span>
                  </div>
                  <button onClick={() => navigate(`/team/invite?edit=${mem.id}`)} className="text-primary-cyan hover:underline text-left mt-0.5 cursor-pointer">
                    Edit Permissions
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 text-[10px] text-text-muted font-mono leading-none pt-2">
                  <span>3 Assigned clients</span>
                  <span>•</span>
                  <span>{mem.role === 'admin' ? '2 active tasks' : '3 active tasks'}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 2: Time Sheets Logs
// ----------------------------------------------------
function TimeSheetLogs() {
  const navigate = useNavigate();
  return (
    <div className="p-8 text-center bg-panel-white border border-border-light rounded font-sans">
      <p className="text-xs text-text-secondary mb-3">To review tracked minutes sheets log, view details in tasks dashboard.</p>
      <Link to="/tasks" className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold inline-block">Manage Tasks & Times</Link>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 3: Workload Capacity
// ----------------------------------------------------
function WorkloadCapacity() {
  const navigate = useNavigate();

  // Mock workloads data
  const capacities = [
    { name: 'Boss / Administrator', used: 15, max: 40, color: 'bg-primary-cyan' },
    { name: 'Rahul Sharma', used: 35, max: 45, color: 'bg-[#8B5CF6]' }
  ];

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/team')} className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer">← TEAM DIRECTORY</button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase">WORKLOAD CAPACITY</span>
        </div>
      </div>

      <div className="bg-panel-white border border-border-light rounded shadow-sm p-6 space-y-6">
        <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-1.5">
          Teammate Hours allocated per week
        </span>

        <div className="space-y-4">
          {capacities.map((item, idx) => {
            const percent = Math.round((item.used / item.max) * 100);
            return (
              <div key={idx} className="space-y-2 text-xs">
                <div className="flex justify-between font-medium text-text-primary">
                  <span>{item.name}</span>
                  <span className="font-mono">{item.used} / {item.max} hours ({percent}%)</span>
                </div>
                
                {/* Horizontal capacity bar */}
                <div className="w-full bg-page-bg h-3 rounded overflow-hidden">
                  <div className={`h-full rounded ${item.color}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 4: SOP Wiki Library (Markdown wiki)
// ----------------------------------------------------
function SOPLibrary() {
  const navigate = useNavigate();

  const [sops, setSops] = useState([
    { id: '1', title: 'Google Business Profile sunday timings guidelines', body: '# Sunday Timing Update SOP\n\n1. Confirm with clients on restaurant Sunday morning slots.\n2. Open Listing Editor.\n3. Make sure timing shows open from 11:30 AM.\n4. Commit changes to maps API.' },
    { id: '2', title: 'AI Writer Markdown formats parameters', body: '# AI Formatting Guide\n\n1. Target h2 headers for subheadings.\n2. Add local keywords in bold tags.\n3. Output copy as Markdown formats only.' }
  ]);

  const [activeSopId, setActiveSopId] = useState('1');
  const [isEditing, setIsEditing] = useState(false);

  const activeSop = sops.find(s => s.id === activeSopId);

  const handleSaveSop = () => {
    setIsEditing(false);
    alert('SOP article updated.');
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/team')} className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer">← TEAM DIRECTORY</button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase">SOP WIKI LIBRARY</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[340px] bg-panel-white border border-border-light rounded shadow-sm overflow-hidden">
        
        {/* Left Column: Index list */}
        <div className="border-r border-border-light flex flex-col h-full shrink-0">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase p-3 border-b border-page-bg">
            SOP ARTICLES LIST
          </span>

          <div className="flex-1 divide-y divide-page-bg overflow-y-auto">
            {sops.map(s => (
              <div 
                key={s.id} 
                onClick={() => {
                  setActiveSopId(s.id);
                  setIsEditing(false);
                }}
                className={`p-3 cursor-pointer hover:bg-page-bg/40 transition-colors flex items-center gap-2 text-xs font-semibold ${
                  s.id === activeSopId ? 'bg-cyan-50/20 border-l-2 border-primary-cyan pl-2.5' : 'text-text-secondary'
                }`}
              >
                <FileText size={14} className="text-text-muted" />
                <span className="truncate">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Markdown preview/editor */}
        <div className="lg:col-span-2 flex flex-col h-full justify-between">
          <div className="p-3 border-b border-page-bg flex items-center justify-between bg-panel-white shrink-0">
            <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">
              {isEditing ? 'EDIT SOP MARKDOWN' : 'SOP READER'}
            </span>

            {isEditing ? (
              <button onClick={handleSaveSop} className="flex items-center gap-1 text-primary-cyan hover:text-primary-cyan-hover font-mono text-[10px] font-bold cursor-pointer">
                <Save size={12} />
                <span>SAVE ARTICLE</span>
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-text-secondary hover:text-text-primary font-mono text-[10px] font-bold cursor-pointer">
                <Edit size={12} />
                <span>EDIT CODE</span>
              </button>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {isEditing ? (
              <textarea 
                value={activeSop.body}
                onChange={e => {
                  setSops(prev => prev.map(s => s.id === activeSopId ? { ...s, body: e.target.value } : s));
                }}
                className="w-full h-full bg-transparent font-mono text-xs border-none focus:outline-none resize-none"
              />
            ) : (
              <div className="text-xs leading-relaxed text-text-secondary whitespace-pre-line font-sans prose prose-sm max-w-none">
                {activeSop.body}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// FULL PAGE VIEW: Invite Teammate Form
// ----------------------------------------------------
function InviteTeammateForm() {
  const { agency, clients, forceRefresh } = useApp();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('manager');
  const [formError, setFormError] = useState('');
  const [invitedPassword, setInvitedPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Custom role state
  const [customModules, setCustomModules] = useState({
    seo: false, social: false, content: false, email: false,
    reputation: false, analytics: false, gbp: false, aeo: false, geofencing: false
  });
  const [clientScope, setClientScope] = useState('selected');
  const [assignedClientIds, setAssignedClientIds] = useState([]);
  const [aiAccessEnabled, setAiAccessEnabled] = useState(false);

  const moduleNames = {
    seo: 'SEO', social: 'Social Media', content: 'Content', email: 'Email & CRM',
    reputation: 'Reputation', analytics: 'Analytics', gbp: 'GBP', aeo: 'AEO', geofencing: 'Geo-fencing'
  };

  const getCustomSummary = () => {
    const activeMods = Object.keys(customModules).filter(k => customModules[k]).map(k => moduleNames[k]);
    const modsText = activeMods.length > 0 ? activeMods.join(', ') : 'no modules';
    const clientText = clientScope === 'all' ? 'all clients' : `${assignedClientIds.length} selected client${assignedClientIds.length === 1 ? '' : 's'}`;
    const aiText = aiAccessEnabled ? 'enabled' : 'disabled';
    return `${fullName || 'This member'} will have access to ${modsText} for ${clientText}, with AI features ${aiText}.`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim() || !email.trim()) {
      setFormError('Name and Email are required.');
      return;
    }

    setSaving(true);
    try {
      const tempPassword = 'OS-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '!';
      
      const userData = {
        agency_id: agency?.id || 'age_default_id',
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        status: 'active',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
      };

      if (role === 'custom') {
        userData.custom_permissions = {
          modules: customModules,
          client_scope: clientScope
        };
        userData.assigned_client_ids = clientScope === 'selected' ? assignedClientIds : [];
        userData.ai_access_enabled = aiAccessEnabled;
      }

      const { error } = await supabase.from('users').insert(userData);

      if (!error) {
        // Increment onboarding step
        const onboardingSteps = JSON.parse(localStorage.getItem('db_onboarding_progress') || '[]');
        const updatedOnboarding = onboardingSteps.map(step => 
          step.step_key === 'invite_member' ? { ...step, is_completed: true, completed_at: new Date().toISOString() } : step
        );
        localStorage.setItem('db_onboarding_progress', JSON.stringify(updatedOnboarding));

        // Create log trigger
        const log = {
          id: Math.random().toString(),
          agency_id: agency?.id || 'age_default_id',
          action: 'teammate-invite',
          module: 'team',
          tokens_used: 0,
          description: `Invited Teammate: ${fullName} (${role})`,
          created_at: new Date().toISOString()
        };


        window.dispatchEvent(new Event('local_db_change'));
        forceRefresh();
        setInvitedPassword(tempPassword);
      } else {
        setFormError(error.message || 'Failed to invite teammate.');
      }
    } catch (err) {
      setFormError('Failed to invite teammate.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 font-sans py-8 animate-fade-in select-none">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div>
          <Link to="/team" className="text-xs font-mono text-text-muted hover:text-primary-cyan uppercase">
            &larr; Back to team directory
          </Link>
          <h2 className="text-xl font-bold text-text-primary mt-1">Invite Teammate</h2>
        </div>
      </div>

      <div className="bg-panel-white border border-border-light rounded-lg shadow-sm p-6 relative">
        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 text-error-red text-xs rounded mb-4">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
              Full Name *
            </label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
              Email Address *
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul@hyperlocal.in"
              className="w-full border border-border-light rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
              Access Role
            </label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-border-light rounded px-3 py-1.5 text-xs bg-panel-white focus:ring-1 focus:ring-primary-cyan outline-none font-semibold text-text-primary"
            >
              <option value="manager">Manager (Read & Write Operations)</option>
              <option value="admin">Administrator (Full Control & Billing)</option>
              <option value="operator">Operator (Assigned Client Tasks Only)</option>
              <option value="custom">Custom (Restricted Access)</option>
            </select>
          </div>

          {role === 'custom' && (
            <div className="pt-4 mt-4 border-t border-border-light space-y-6">
               {/* Sub-section A */}
               <div>
                 <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase mb-1">MODULE ACCESS</label>
                 <p className="text-[10px] text-text-muted mb-3">Choose which modules this member can access. Everything is off by default — turn on only what they need.</p>
                 <div className="grid grid-cols-2 gap-3">
                   {Object.entries(moduleNames).map(([key, label]) => (
                     <label key={key} className="flex items-center gap-2 cursor-pointer select-none text-xs text-text-primary">
                       <div className={`w-8 h-4 rounded-full relative transition-colors ${customModules[key] ? 'bg-primary-cyan' : 'bg-gray-300'}`}>
                         <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${customModules[key] ? 'translate-x-4' : ''}`} />
                       </div>
                       <input type="checkbox" className="hidden" checked={customModules[key]} onChange={(e) => setCustomModules({...customModules, [key]: e.target.checked})} />
                       {label}
                     </label>
                   ))}
                 </div>
               </div>

               {/* Sub-section B */}
               <div>
                 <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase mb-1">CLIENT SCOPE</label>
                 <div className="flex gap-4 mb-3">
                   <label className="flex items-center gap-2 text-xs cursor-pointer text-text-primary">
                     <input type="radio" checked={clientScope === 'selected'} onChange={() => setClientScope('selected')} className="accent-primary-cyan" />
                     Selected clients only
                   </label>
                   <label className="flex items-center gap-2 text-xs cursor-pointer text-text-primary">
                     <input type="radio" checked={clientScope === 'all'} onChange={() => setClientScope('all')} className="accent-primary-cyan" />
                     All clients
                   </label>
                 </div>
                 {clientScope === 'selected' && (
                   <div className="space-y-2 border border-border-light rounded p-3 max-h-40 overflow-y-auto bg-page-bg">
                     <p className="text-[10px] text-text-muted mb-2">This member will only see and work on the clients you select.</p>
                     {clients.map(c => (
                       <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer text-text-primary">
                         <input type="checkbox" checked={assignedClientIds.includes(c.id)} onChange={(e) => {
                           if (e.target.checked) setAssignedClientIds([...assignedClientIds, c.id]);
                           else setAssignedClientIds(assignedClientIds.filter(id => id !== c.id));
                         }} className="accent-primary-cyan rounded border-border-medium" />
                         {c.name}
                       </label>
                     ))}
                   </div>
                 )}
               </div>

               {/* Sub-section C */}
               <div>
                 <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase mb-1">AI ACCESS</label>
                 <p className="text-[10px] text-text-muted mb-2">When off, this member cannot use any AI-powered features.</p>
                 <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-text-primary">
                   <div className={`w-8 h-4 rounded-full relative transition-colors ${aiAccessEnabled ? 'bg-primary-cyan' : 'bg-gray-300'}`}>
                     <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${aiAccessEnabled ? 'translate-x-4' : ''}`} />
                   </div>
                   <input type="checkbox" className="hidden" checked={aiAccessEnabled} onChange={(e) => setAiAccessEnabled(e.target.checked)} />
                   Allow AI features
                 </label>
               </div>

               {/* Sub-section D */}
               <div className="bg-gray-50 border border-gray-200 p-3 rounded">
                 <label className="block font-mono text-[10px] font-bold text-gray-500 uppercase mb-1">LOCKED PERMISSIONS</label>
                 <p className="text-[10px] text-gray-500 leading-relaxed">Custom members never have access to: Billing, Team Management, White-label Settings, or Account Settings. These are restricted to Administrators only.</p>
               </div>

               <div className="text-[13px] text-text-secondary font-sans border-l-2 border-primary-cyan pl-3 py-1 bg-cyan-50/30 rounded-r">
                 {getCustomSummary()}
               </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border-light pt-4 mt-6">
            <button 
              type="button" 
              onClick={() => navigate('/team')}
              className="px-4 py-2 border border-border-light rounded text-xs text-text-secondary hover:bg-page-bg cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Inviting...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>

      {/* Temporary Password Modal */}
      {invitedPassword && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-panel-white border border-border-light rounded-lg shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-50 border border-success-green/10 flex items-center justify-center text-success-green mx-auto">
              <CheckCircle2 size={24} />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-text-primary uppercase">Teammate Invited!</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                An invitation profile has been created for <span className="font-semibold text-text-primary">{fullName}</span>. Give them their temporary credentials to sign in:
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-3 font-mono text-sm font-bold flex items-center justify-between text-slate-800 select-all">
              <span>{invitedPassword}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${email}\nPassword: ${invitedPassword}`);
                  alert('Copied to clipboard.');
                }}
                className="text-[10px] text-primary-cyan uppercase hover:underline font-sans cursor-pointer"
              >
                Copy
              </button>
            </div>

            <button 
              onClick={() => navigate('/team')}
              className="w-full py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white text-xs font-semibold rounded cursor-pointer transition-colors"
            >
              Go to directory
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
