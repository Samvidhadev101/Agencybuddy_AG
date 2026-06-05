import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import AiWarningBanner from '../../components/AiWarningBanner';
import AiOutputBadge from '../../components/AiOutputBadge';
import { 
  Sparkles, Save, FileText, CheckCircle2, ChevronRight,
  Plus, Calendar, FolderKanban, Upload, Search, Check, X,
  ThumbsUp, ThumbsDown, Copy, Edit, Trash2, ArrowUpRight
} from 'lucide-react';

export default function Content() {
  const location = useLocation();
  const currentPath = location.pathname;

  let content;
  if (currentPath === '/content/writer') {
    content = <AIWriter />;
  } else if (currentPath === '/content/assets') {
    content = <AssetLibrary />;
  } else if (currentPath === '/content/approvals') {
    content = <ApprovalQueue />;
  } else if (currentPath === '/content/briefs') {
    content = <SEOBriefs />;
  } else {
    content = <ContentCalendar />;
  }

  return (
    <div className="space-y-4">
      <AiWarningBanner />
      {content}
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 1: Content Calendar
// ----------------------------------------------------
function ContentCalendar() {
  const navigate = useNavigate();
  return (
    <div className="p-8 text-center bg-panel-white border border-border-light rounded font-sans">
      <p className="text-xs text-text-secondary mb-3">To view schedules posts calendars and publish social grids, open the social calendar.</p>
      <Link to="/social/calendar" className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold inline-block">Open Social Calendar</Link>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 2: AI Writer IDE
// ----------------------------------------------------
function AIWriter() {
  const { agency, activeClient, selectedClientId, forceRefresh, isAiEnabled } = useApp();
  const navigate = useNavigate();

  const [type, setType] = useState('blog');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');

  const [output, setOutput] = useState('');
  const [usedModel, setUsedModel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const tokenCost = length === 'long' ? 2 : 1;

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setOutput('');
    setUsedModel('');

    if (!isAiEnabled()) {
      alert("AI access not enabled for your account.");
      return;
    }

    if (!topic) {
      setError('Please specify a topic or title.');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error: apiError } = await supabase.functions.invoke('ai-generate', {
        body: {
          action: 'blog-draft',
          input: { clientName: activeClient?.name || 'Client', topic: `${type} about ${topic} with keywords [${keywords}] in ${tone} tone` },
          agency_id: agency.id
        }
      });

      if (apiError) {
        throw new Error(apiError.message || apiError.text || apiError || 'Failed compiling AI generated draft.');
      }

      setOutput(data.output);
      if (data.model_name) setUsedModel(data.model_name);
      
      // Update onboarding progress for 'write_ai_content'
      const onboardingSteps = JSON.parse(localStorage.getItem('db_onboarding_progress') || '[]');
      const updatedOnboarding = onboardingSteps.map(step => 
        step.step_key === 'write_ai_content' ? { ...step, is_completed: true, completed_at: new Date().toISOString() } : step
      );
      localStorage.setItem('db_onboarding_progress', JSON.stringify(updatedOnboarding));

      window.dispatchEvent(new Event('local_db_change'));
      forceRefresh();
    } catch (e) {
      setError(e.message || 'Failed compiling AI generated draft.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!output) return;
    try {
      await supabase.from('content_items').insert({
        agency_id: agency.id,
        client_id: selectedClientId || 'cli_kovai_id',
        type,
        title: topic,
        body: output,
        platform: 'Website Blog',
        status: 'draft',
        ai_generated: true,
        tokens_used: tokenCost
      });
      window.dispatchEvent(new Event('local_db_change'));
      alert('Draft saved to Asset Library catalog.');
      navigate('/content/assets');
    } catch (e) {
      alert('Failed saving draft.');
    }
  };

  const handleSendApproval = async () => {
    if (!output) return;
    try {
      await supabase.from('content_items').insert({
        agency_id: agency.id,
        client_id: selectedClientId || 'cli_kovai_id',
        type,
        title: topic,
        body: output,
        platform: 'Client Approvals Channel',
        status: 'client_review',
        ai_generated: true,
        tokens_used: tokenCost
      });
      window.dispatchEvent(new Event('local_db_change'));
      alert('Sent to client approval queue.');
      navigate('/content/approvals');
    } catch (e) {
      alert('Failed sending to approvals queue.');
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      
      {/* IDE Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[440px] bg-panel-white border border-border-light rounded shadow-sm overflow-hidden">
        
        {/* Left Inspector: Input variables */}
        <div className="border-r border-border-light p-4 space-y-4 overflow-y-auto flex flex-col justify-between h-full bg-page-bg/10 shrink-0">
          <div className="space-y-3">
            <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-1.5">
              PROPERTY INSPECTOR
            </span>

            {error && (
              <div className="p-2 bg-red-50 text-error-red text-[10px] rounded">{error}</div>
            )}

            <div className="space-y-1">
              <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-border-light bg-panel-white rounded px-2 py-1 text-xs">
                <option value="blog">Blog Post</option>
                <option value="social_post">Social Post</option>
                <option value="email">Email Copy</option>
                <option value="ad_copy">Search Ad Copy</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Topic / Title</label>
              <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic details..." className="w-full border border-border-light rounded p-2 text-xs h-16" />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Target Keywords</label>
              <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="e.g. traditional samba biryani" className="w-full border border-border-light rounded px-2 py-1 text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Tone</label>
                <select value={tone} onChange={e => setTone(e.target.value)} className="w-full border border-border-light bg-panel-white rounded px-2 py-1 text-xs">
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="witty">Witty</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Length</label>
                <select value={length} onChange={e => setLength(e.target.value)} className="w-full border border-border-light bg-panel-white rounded px-2 py-1 text-xs">
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !isAiEnabled()}
            title={!isAiEnabled() ? 'AI access not enabled for your account' : ''}
            className="w-full py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={12} />
            <span>{isGenerating ? 'GENERATING CODES...' : 'GENERATE DRAFT'}</span>
          </button>
        </div>

        {/* Right Pane: Markdown Output Editor */}
        <div className="lg:col-span-2 flex flex-col h-full justify-between">
          <div className="p-3 border-b border-page-bg flex items-center justify-between shrink-0">
            <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">
              GENERATED MARKDOWN OUTPUT
            </span>

            {output && (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(output);
                    alert('Copied to clipboard.');
                  }}
                  className="p-1 hover:bg-page-bg text-text-secondary hover:text-text-primary rounded cursor-pointer"
                >
                  <Copy size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Textarea output */}
          <div className="flex-1 p-4 bg-page-bg/10 overflow-y-auto">
            {isGenerating ? (
              <div className="py-24 text-center text-xs font-mono text-text-muted animate-pulse">
                INVOKING GEMINI AI CRAWL SYSTEMS...
              </div>
            ) : (
              <textarea 
                value={output} 
                onChange={e => setOutput(e.target.value)}
                placeholder="AI output text copy will generate here. You can edit, format, or export details directly."
                className="w-full h-full bg-transparent text-xs font-mono border-none focus:outline-none resize-none leading-relaxed"
              />
            )}
          </div>
            
          {usedModel && output && !isGenerating && (
            <div className="px-4 py-2 border-t border-border-light bg-slate-50">
              <AiOutputBadge modelName={usedModel} />
            </div>
          )}

          {/* Actions toolbar */}
          {output && (
            <div className="p-3 border-t border-border-light bg-panel-white flex justify-end gap-2 shrink-0">
              <button 
                onClick={handleSaveDraft}
                className="px-3 py-1.5 border border-border-light rounded text-xs text-text-secondary hover:bg-page-bg cursor-pointer font-medium"
              >
                Save as Draft
              </button>
              <button 
                onClick={handleSendApproval}
                className="px-3 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer transition-colors"
              >
                Send to Client Approvals Queue
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 3: Asset Library
// ----------------------------------------------------
function AssetLibrary() {
  const { selectedClientId } = useApp();
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    if (selectedClientId) {
      supabase.from('content_items').eq('client_id', selectedClientId).then(({ data }) => {
        setAssets(data || []);
      });
    }
  }, [selectedClientId]);

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div>
        <h2 className="text-sm font-mono uppercase font-bold text-text-primary">Content Asset Library</h2>
        <p className="text-xs text-text-secondary">Explore saved drafts and publishing catalogs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {assets.length === 0 ? (
          <div className="md:col-span-3 py-12 text-center text-xs text-text-secondary bg-panel-white border border-border-light rounded">
            No drafts stored. Use AI Writer to draft copy.
          </div>
        ) : (
          assets.map(item => (
            <div key={item.id} className="bg-panel-white border border-border-light rounded p-4 shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <span className="bg-blue-50 text-blue-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  {item.type}
                </span>
                <span className="text-[10px] text-text-muted font-mono">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-text-primary truncate">{item.title}</h4>
              <p className="text-[11px] text-text-secondary line-clamp-3 leading-relaxed">{item.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 4: Approval Queue
// ----------------------------------------------------
function ApprovalQueue() {
  const { selectedClientId, forceRefresh } = useApp();
  const [items, setItems] = useState([]);
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    if (selectedClientId) {
      loadApprovals(selectedClientId);
    }
  }, [selectedClientId]);

  const loadApprovals = async (clientId) => {
    const { data } = await supabase.from('content_items').eq('client_id', clientId).eq('status', 'client_review');
    setItems(data || []);
  };

  const handleAction = async (itemId, action) => {
    const list = JSON.parse(localStorage.getItem('db_content_items') || '[]');
    const updated = list.map(item => 
      item.id === itemId ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' } : item
    );
    localStorage.setItem('db_content_items', JSON.stringify(updated));
    window.dispatchEvent(new Event('local_db_change'));
    
    loadApprovals(selectedClientId);
    setActiveItem(null);
    forceRefresh();
    alert(`Content draft ${action}d successfully.`);
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      
      <div>
        <h2 className="text-sm font-mono uppercase font-bold text-text-primary">Approvals Queue</h2>
        <p className="text-xs text-text-secondary">Approve, reject, or comment on marketing content drafts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table list */}
        <div className="lg:col-span-2 bg-panel-white border border-border-light rounded shadow-sm overflow-hidden h-[340px] flex flex-col">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-page-bg/40 border-b border-border-light text-[10px] font-mono text-text-secondary uppercase">
                <th className="py-2.5 px-4 font-semibold">Title</th>
                <th className="py-2.5 px-4 font-semibold">Type</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-page-bg text-xs">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-text-secondary">
                    No drafts pending client approval.
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr 
                    key={item.id} 
                    onClick={() => setActiveItem(item)}
                    className={`hover:bg-[#F0FDFA] transition-colors cursor-pointer ${
                      activeItem?.id === item.id ? 'bg-cyan-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-text-primary truncate max-w-xs">{item.title}</td>
                    <td className="py-3 px-4 text-text-secondary font-mono text-[10px] uppercase">{item.type}</td>
                    <td className="py-3 px-4">
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase">
                        PENDING
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-primary-cyan hover:underline font-semibold">Review →</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Inspector drawer */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-4 flex flex-col justify-between h-[340px]">
          {activeItem ? (
            <div className="flex flex-col justify-between h-full">
              <div className="space-y-3 overflow-y-auto max-h-[220px] scrollbar-thin">
                <div className="flex justify-between items-start border-b border-page-bg pb-2">
                  <span className="font-mono text-[9px] font-bold text-text-secondary uppercase bg-page-bg px-1.5 py-0.5 rounded">
                    {activeItem.type}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    {new Date(activeItem.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-text-primary leading-tight">{activeItem.title}</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed bg-page-bg/30 p-2 border border-page-bg rounded whitespace-pre-line font-sans">
                  {activeItem.body}
                </p>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border-light shrink-0">
                <button 
                  onClick={() => handleAction(activeItem.id, 'reject')}
                  className="flex-1 py-1.5 border border-error-red/20 text-error-red hover:bg-red-50 text-xs font-medium rounded transition-colors cursor-pointer"
                >
                  Reject Draft
                </button>
                <button 
                  onClick={() => handleAction(activeItem.id, 'approve')}
                  className="flex-1 py-1.5 bg-success-green hover:bg-emerald-600 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                >
                  Approve Draft
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-xs text-text-muted p-6">
              Select a draft item from the approval table to review copy details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 5: SEO Content Briefs
// ----------------------------------------------------
function SEOBriefs() {
  const navigate = useNavigate();
  return (
    <div className="p-8 text-center bg-panel-white border border-border-light rounded font-sans">
      <p className="text-xs text-text-secondary mb-3">To write optimized content brief drafts, use the AI Writer.</p>
      <Link to="/content/writer" className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold inline-block">Open AI Writer</Link>
    </div>
  );
}
