import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { 
  Sparkles, Plus, Search, Grid, CheckCircle2, UserPlus,
  ArrowRight, Mail, Phone, Calendar, Clock, Play, Send,
  ChevronRight, ChevronDown, Check, X, ShieldAlert
} from 'lucide-react';

export default function EmailCRM() {
  const location = useLocation();
  const currentPath = location.pathname;

  if (currentPath === '/email/contacts') {
    return <ContactsList />;
  } else if (currentPath === '/email/pipeline') {
    return <DealsPipeline />;
  } else if (currentPath === '/email/campaigns') {
    return <CampaignComposer />;
  } else {
    return <EmailDashboard />;
  }
}

// ----------------------------------------------------
// Sub-Page 1: Email Dashboard
// ----------------------------------------------------
function EmailDashboard() {
  const navigate = useNavigate();
  return (
    <div className="p-8 text-center bg-panel-white border border-border-light rounded font-sans">
      <p className="text-xs text-text-secondary mb-3">To manage contacts folders and track pipeline stages, open the CRM Contacts.</p>
      <Link to="/email/contacts" className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold inline-block">Open CRM Dashboard</Link>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 2: Contacts List & Detail Side Panel
// ----------------------------------------------------
function ContactsList() {
  const { selectedClientId, forceRefresh } = useApp();
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    if (selectedClientId) {
      loadContacts(selectedClientId);
    }
  }, [selectedClientId]);

  const loadContacts = async (clientId) => {
    const { data } = await supabase.from('contacts').eq('client_id', clientId);
    setContacts(data || []);
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div>
          <h2 className="text-sm font-mono uppercase font-bold text-text-primary">CRM Contact Profiles</h2>
          <p className="text-xs text-text-secondary">Capture leads and customer pipeline coordinates.</p>
        </div>

        <button 
          onClick={() => {
            const name = prompt('Enter contact full name:');
            if (name) {
              supabase.from('contacts').insert({
                client_id: selectedClientId || 'cli_kovai_id',
                agency_id: 'age_default_id',
                name,
                email: `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
                phone: '+91 99999 00000',
                pipeline_stage: 'lead',
                lead_score: 50,
                tags: ['web_lead']
              }).then(() => {
                loadContacts(selectedClientId);
                window.dispatchEvent(new Event('local_db_change'));
              });
            }
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer"
        >
          <UserPlus size={13} />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-panel-white border border-border-light rounded p-4 flex gap-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-2.5 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Query contact list by name or email..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border border-border-light rounded pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary-cyan"
          />
        </div>
      </div>

      {/* Two Columns Table & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table grid */}
        <div className="lg:col-span-2 bg-panel-white border border-border-light rounded shadow-sm overflow-hidden h-[340px] flex flex-col">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-page-bg/40 border-b border-border-light text-[10px] font-mono text-text-secondary uppercase">
                <th className="py-2.5 px-4 font-semibold">Name</th>
                <th className="py-2.5 px-4 font-semibold">Email</th>
                <th className="py-2.5 px-4 font-semibold text-center">Score</th>
                <th className="py-2.5 px-4 font-semibold">Pipeline Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-page-bg text-xs">
              {filteredContacts.map(c => (
                <tr 
                  key={c.id} 
                  onClick={() => setSelectedContact(c)}
                  className={`hover:bg-[#F0FDFA] transition-colors cursor-pointer ${
                    selectedContact?.id === c.id ? 'bg-cyan-50/25 border-l-2 border-primary-cyan pl-3.5' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-text-primary">{c.name}</td>
                  <td className="py-3 px-4 text-text-secondary font-mono">{c.email}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      c.lead_score >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {c.lead_score}
                    </span>
                  </td>
                  <td className="py-3 px-4 uppercase font-mono text-[10px] font-semibold text-text-secondary">
                    {c.pipeline_stage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-4 flex flex-col justify-between h-[340px]">
          {selectedContact ? (
            <div className="flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-page-bg pb-2">
                  <span className="font-mono text-[9px] font-bold text-text-secondary uppercase bg-page-bg px-2 py-0.5 rounded">
                    STAGE: {selectedContact.pipeline_stage.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    ID: {selectedContact.id.slice(0, 6)}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-text-primary text-sm">{selectedContact.name}</h4>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Mail size={12} />
                    <span>{selectedContact.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Phone size={12} />
                    <span>{selectedContact.phone || 'No phone recorded'}</span>
                  </div>
                </div>

                <div className="border-t border-page-bg pt-3">
                  <span className="font-mono text-[9px] font-bold text-text-muted uppercase block mb-1.5">
                    Contact Activities
                  </span>
                  <div className="space-y-2 text-[10px] text-text-secondary leading-relaxed">
                    <div className="flex items-start gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success-green mt-1 shrink-0"></span>
                      <span>Form inquiry received from landing page sitemaps (Lead Score: {selectedContact.lead_score})</span>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  const newStage = prompt('Enter new stage (lead, qualified, proposal, won, lost):');
                  if (newStage) {
                    supabase.from('contacts').eq('id', selectedContact.id).update({
                      pipeline_stage: newStage.toLowerCase()
                    }).then(() => {
                      loadContacts(selectedClientId);
                      setSelectedContact(null);
                      window.dispatchEvent(new Event('local_db_change'));
                    });
                  }
                }}
                className="w-full py-1.5 bg-[#ECFEFF] border border-[#06B6D41A] text-primary-cyan rounded text-xs font-semibold cursor-pointer"
              >
                Modify Deal Stage
              </button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-xs text-text-muted p-6">
              Select a contact row from the database spreadsheet to inspect timeline details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 3: Deals Pipeline Kanban
// ----------------------------------------------------
function DealsPipeline() {
  const navigate = useNavigate();
  return (
    <div className="p-8 text-center bg-panel-white border border-border-light rounded font-sans">
      <p className="text-xs text-text-secondary mb-3">To drag-and-drop or update stages, manage contact sheets directly.</p>
      <Link to="/email/contacts" className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold inline-block">Open Contact Profiles</Link>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 4: Campaigns composer step wizard
// ----------------------------------------------------
function CampaignComposer() {
  const { agency, activeClient, forceRefresh } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isWriting, setIsWriting] = useState(false);

  const handleCreate = async () => {
    if (!name || !subject || !body) return;


    try {
      await supabase.from('email_campaigns').insert({
        agency_id: agency.id,
        client_id: activeClient.id,
        name,
        subject,
        body_html: body,
        status: 'scheduled',
        recipients_count: 140,
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      });
      window.dispatchEvent(new Event('local_db_change'));
      forceRefresh();
      alert('Email campaign scheduled.');
      navigate('/email/contacts');
    } catch (e) {
      alert('Failed saving campaign.');
    }
  };

  const generateSubject = async () => {
    setIsWriting(true);
    await new Promise(r => setTimeout(r, 1000));
    setSubject(`Steaming Kovai Biryani packs waiting for you! 🏏🍗`);
    setIsWriting(false);
  };

  const generateBody = async () => {
    setIsWriting(true);
    await new Promise(r => setTimeout(r, 1200));
    setBody(`Dear customer,\n\nSundays are meant for steaming Kongu-style Biryani buckets prepared with fragrant Samba grains!\n\nUse coupon KONGU15 to save flat 15% off delivery orders this weekend.\n\nWarm regards,\nKovai Biryani Indiranagar`);
    setIsWriting(false);
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <h2 className="text-sm font-mono uppercase font-bold text-text-primary">Email Campaign Builder Wizard</h2>
        <span className="font-mono text-xs text-text-secondary">STEP {step} OF 4</span>
      </div>

      <div className="bg-panel-white border border-border-light rounded shadow p-6 space-y-6">
        
        {/* Step progress bar */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-sm ${s === step ? 'bg-primary-cyan' : s < step ? 'bg-primary-cyan/40' : 'bg-page-bg'}`} />
          ))}
        </div>

        {/* STEP 1: Name and Subject */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">Campaign Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="IPL Final Sunday Special" className="w-full border border-border-light rounded px-3 py-1.5 text-xs" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">Email Subject Line</label>
                <button type="button" onClick={generateSubject} className="font-mono text-[9px] font-bold text-primary-cyan flex items-center gap-0.5 cursor-pointer">
                  <Sparkles size={11} />
                  <span>AI DRAFT SUBJECT</span>
                </button>
              </div>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Steaming Biryani awaits..." className="w-full border border-border-light rounded px-3 py-1.5 text-xs" />
            </div>
          </div>
        )}

        {/* STEP 2: Body text */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">Email Body Copy</label>
              <button type="button" onClick={generateBody} className="font-mono text-[9px] font-bold text-primary-cyan flex items-center gap-0.5 cursor-pointer">
                <Sparkles size={11} />
                <span>AI DRAFT BODY</span>
              </button>
            </div>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Type newsletter body copy..." className="w-full border border-border-light rounded p-3 text-xs h-36 font-sans" />
          </div>
        )}

        {/* STEP 3: Recipients tags */}
        {step === 3 && (
          <div className="space-y-4">
            <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-1.5">
              Select target segmentation tag
            </span>
            <div className="flex gap-2">
              {['vip_customer', 'bulk_buyer', 'all_contacts'].map(t => (
                <button key={t} type="button" className="px-3 py-1.5 border border-primary-cyan bg-cyan-50/20 text-primary-cyan text-xs font-semibold rounded uppercase">
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Launch */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="p-4 bg-page-bg/40 border border-border-light rounded space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subject:</span>
                <span className="font-semibold text-text-primary">{subject}</span>
              </div>
              <div className="flex justify-between border-t border-page-bg pt-2 mt-2">
                <span className="text-text-secondary">Target Recipients:</span>
                <span className="font-mono text-text-primary font-bold">140 contacts</span>
              </div>
            </div>

            <button onClick={handleCreate} className="w-full py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white text-xs font-semibold rounded cursor-pointer transition-colors">
              SCHEDULE & SEND CAMPAIGN
            </button>
          </div>
        )}

        {/* Nav actions */}
        <div className="flex justify-between border-t border-border-light pt-4 mt-6">
          <button 
            type="button" 
            disabled={step === 1}
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            className="px-3.5 py-1.5 border border-border-light rounded text-xs text-text-secondary hover:bg-page-bg disabled:opacity-40 cursor-pointer"
          >
            Back
          </button>
          {step < 4 ? (
            <button 
              type="button"
              onClick={() => setStep(prev => Math.min(4, prev + 1))}
              className="px-3.5 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer"
            >
              Next Step
            </button>
          ) : null}
        </div>

      </div>
    </div>
  );
}


