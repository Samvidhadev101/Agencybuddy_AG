import ClientAvatar from '../../components/ClientAvatar';
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import AiWarningBanner from '../../components/AiWarningBanner';
import { 
  Sparkles, Calendar, MessageSquare, Send, Upload, Check, X,
  ChevronDown, ChevronRight, Share2, Heart, MessageCircle, BarChart3,
  Search, Grid, Plus, Trash2, ArrowUpRight, CheckCircle2, ShieldAlert
} from 'lucide-react';
import AiOutputBadge from '../../components/AiOutputBadge';
import ComingSoon from '../../components/ComingSoon';

export default function Social() {
  const location = useLocation();
  const currentPath = location.pathname;

  let content;
  if (currentPath === '/social/calendar') {
    content = <SocialCalendar />;
  } else if (currentPath === '/social/compose') {
    content = <PostComposer />;
  } else if (currentPath === '/social/inbox') {
    content = <ComingSoon title="Inbox Chat" />;
  } else if (currentPath === '/social/listening') {
    content = <ComingSoon title="Listening" />;
  } else if (currentPath === '/social/influencers') {
    content = <ComingSoon title="Influencers" />;
  } else if (currentPath === '/social/ads') {
    content = <ComingSoon title="Ads Manager" />;
  } else {
    content = <SocialDashboard />;
  }

  return (
    <div className="space-y-4">
      <AiWarningBanner />
      {content}
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 1: Social Dashboard
// ----------------------------------------------------
function SocialDashboard() {
  const { selectedClientId, activeClient, agency, forceRefresh } = useApp();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [intervalDays, setIntervalDays] = useState('2');
  const [isSchedulingAll, setIsSchedulingAll] = useState(false);

  const loadPosts = () => {
    if (selectedClientId) {
      supabase.from('social_posts').eq('client_id', selectedClientId).then(({ data }) => {
        setPosts(data || []);
      });
    }
  };

  useEffect(() => {
    loadPosts();
  }, [selectedClientId]);

  useEffect(() => {
    window.addEventListener('local_db_change', loadPosts);
    return () => {
      window.removeEventListener('local_db_change', loadPosts);
    };
  }, [selectedClientId]);

  const generateDraftCaption = async (draftId, fileName) => {
    if (!agency?.id) return;
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate', {
        body: {
          action: 'social-captions',
          input: { clientName: activeClient?.name || 'Client', topic: `creative caption for social post ${fileName}` },
          agency_id: agency.id
        }
      });
      if (error) {
        setDrafts(prev => prev.map(d => d.id === draftId ? { ...d, caption: `Failed generating AI caption: ${error}. Please enter manually.`, generating: false } : d));
      } else {
        setDrafts(prev => prev.map(d => d.id === draftId ? { ...d, caption: data.output, generating: false } : d));
      }
    } catch (e) {
      setDrafts(prev => prev.map(d => d.id === draftId ? { ...d, caption: 'Failed to generate AI caption. Please write manually.', generating: false } : d));
    }
  };

  const handleBulkFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result;
        const draftId = 'drf_' + Math.random().toString(36).substring(2, 9);
        
        setDrafts(prev => [...prev, {
          id: draftId,
          fileName: file.name,
          base64: base64Data,
          caption: 'Drafting caption...',
          platforms: { instagram: true, facebook: true, twitter: false },
          generating: true
        }]);

        generateDraftCaption(draftId, file.name);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result;
        const draftId = 'drf_' + Math.random().toString(36).substring(2, 9);
        
        setDrafts(prev => [...prev, {
          id: draftId,
          fileName: file.name,
          base64: base64Data,
          caption: 'Drafting caption...',
          platforms: { instagram: true, facebook: true, twitter: false },
          generating: true
        }]);

        generateDraftCaption(draftId, file.name);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleScheduleAll = async () => {
    if (!drafts.length) return;
    if (isSchedulingAll) return;

    setIsSchedulingAll(true);
    const postsToInsert = [];
    const scheduleIntervalDays = parseInt(intervalDays) || 1;

    let insertCount = 0;
    drafts.forEach((draft, draftIndex) => {
      const selectedPlatforms = Object.keys(draft.platforms).filter(p => draft.platforms[p]);
      if (!selectedPlatforms.length) return;

      selectedPlatforms.forEach(plat => {
        const daysOffset = draftIndex * scheduleIntervalDays;
        const scheduledDate = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
        
        postsToInsert.push({
          agency_id: agency.id,
          client_id: selectedClientId,
          platform: plat,
          content: draft.caption,
          image_url: draft.base64,
          status: 'scheduled',
          scheduled_at: scheduledDate.toISOString(),
          engagement_likes: 0,
          engagement_comments: 0
        });
        insertCount++;
      });
    });

    if (!postsToInsert.length) {
      alert('Please select at least one platform for one draft.');
      setIsSchedulingAll(false);
      return;
    }

    try {
      await supabase.from('social_posts').insert(postsToInsert);

      const onboardingSteps = JSON.parse(localStorage.getItem('db_onboarding_progress') || '[]');
      const updatedOnboarding = onboardingSteps.map(step => 
        step.step_key === 'compose_post' ? { ...step, is_completed: true, completed_at: new Date().toISOString() } : step
      );
      localStorage.setItem('db_onboarding_progress', JSON.stringify(updatedOnboarding));

      window.dispatchEvent(new Event('local_db_change'));
      forceRefresh();
      alert(`Successfully scheduled ${insertCount} posts in your calendar!`);
      setIsImportModalOpen(false);
      setDrafts([]);
    } catch (err) {
      console.error(err);
      alert('Failed to schedule posts.');
    } finally {
      setIsSchedulingAll(false);
    }
  };

  const totalPostsCount = drafts.reduce((acc, draft) => acc + Object.values(draft.platforms).filter(Boolean).length, 0);

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Followers Growth', val: '8,420', sub: '+124 this month' },
          { label: 'Engagement Rate', val: '4.82%', sub: '+0.5% vs avg' },
          { label: 'Posts Published', val: posts.filter(p => p.status === 'published').length.toString(), sub: 'Across 3 networks' },
          { label: 'Scheduled Posts', val: posts.filter(p => p.status === 'scheduled').length.toString(), sub: 'Next post in 2 days' }
        ].map((met, i) => (
          <div key={i} className="bg-panel-white border border-border-light rounded p-4 shadow-sm flex flex-col justify-between h-24">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">{met.label}</span>
              <span className="text-[9px] text-text-muted mt-0.5">{met.sub}</span>
            </div>
            <span className="text-xl font-bold text-text-primary mt-1">{met.val}</span>
          </div>
        ))}
      </div>

      {/* Grid: Actions & Recent posts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Posts Table */}
        <div className="lg:col-span-2 bg-panel-white border border-border-light rounded shadow-sm overflow-hidden flex flex-col h-80">
          <div className="p-4 border-b border-border-light flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">
              Recent Social Campaigns
            </span>
            <Link to="/social/calendar" className="text-xs text-primary-cyan hover:underline">Open Calendar →</Link>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-page-bg text-xs">
            {posts.length === 0 ? (
              <div className="py-12 text-center text-text-secondary">No recent social posts.</div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="p-3 flex items-center justify-between hover:bg-page-bg/20 transition-colors">
                  <div className="flex items-center gap-3 max-w-[70%]">
                    <span className="font-mono text-[10px] text-text-secondary uppercase px-1.5 py-0.5 rounded bg-page-bg font-bold shrink-0">
                      {post.platform}
                    </span>
                    {post.image_url && (
                      <img src={post.image_url} alt="post thumb" className="w-5 h-5 rounded object-cover shrink-0 border border-border-light" />
                    )}
                    <span className="text-text-primary font-medium truncate">{post.content}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-text-secondary flex items-center gap-0.5">
                      <Heart size={10} className="fill-red-400 text-red-400" /> {post.engagement_likes || 0}
                    </span>
                    <span className="font-mono text-[10px] text-text-secondary flex items-center gap-0.5">
                      <MessageCircle size={10} className="fill-purple-400 text-purple-400" /> {post.engagement_comments || 0}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-4 space-y-3">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-2">
            Social Operations Panel
          </span>

          <div className="grid grid-cols-1 gap-2 pt-2">
            <button onClick={() => navigate('/social/compose')} className="w-full text-left py-2 px-3 border border-border-light hover:border-primary-cyan rounded text-xs flex justify-between items-center bg-panel-white transition-colors cursor-pointer font-medium">
              <span>Compose single post campaign</span>
            </button>
            <button onClick={() => setIsImportModalOpen(true)} className="w-full text-left py-2 px-3 border border-border-light hover:border-primary-cyan rounded text-xs flex justify-between items-center bg-panel-white transition-colors cursor-pointer font-medium">
              <span>Bulk IMPORT image posts</span>
            </button>
            <button onClick={() => navigate('/social/inbox')} className="w-full text-left py-2 px-3 border border-border-light hover:border-primary-cyan rounded text-xs flex justify-between items-center bg-panel-white transition-colors cursor-pointer font-medium">
              <span>Unified Inbox Messenger</span>
              <span className="font-mono text-[10px] text-text-muted">Chat logs</span>
            </button>
            <button onClick={() => navigate('/social/listening')} className="w-full text-left py-2 px-3 border border-border-light hover:border-primary-cyan rounded text-xs flex justify-between items-center bg-panel-white transition-colors cursor-pointer font-medium">
              <span>Social Listening web alerts</span>
              <span className="font-mono text-[10px] text-text-secondary">Track keywords</span>
            </button>
            <button onClick={() => navigate('/social/influencers')} className="w-full text-left py-2 px-3 border border-border-light hover:border-primary-cyan rounded text-xs flex justify-between items-center bg-panel-white transition-colors cursor-pointer font-medium">
              <span>Influencer directories matching</span>
              <span className="font-mono text-[10px] text-text-muted">Niche matches</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Importer Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-4xl bg-panel-white border border-border-light rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-slide-up">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-border-light flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary-cyan" />
                <span className="font-mono text-xs font-bold text-text-primary uppercase">
                  Bulk Social Post Importer
                </span>
              </div>
              <button 
                onClick={() => { setIsImportModalOpen(false); setDrafts([]); }}
                className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Drop Zone */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-border-medium hover:border-primary-cyan rounded-lg p-8 text-center bg-page-bg/10 hover:bg-cyan-50/10 transition-colors relative cursor-pointer group"
              >
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleBulkFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload size={28} className="text-text-secondary group-hover:text-primary-cyan transition-colors" />
                  <span className="text-xs font-semibold text-text-primary">
                    Drag & drop post images here, or click to browse
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    JPG, PNG, WEBP supported • AI will auto-draft captions for each
                  </span>
                </div>
              </div>

              {/* Drafts List */}
              {drafts.length > 0 && (
                <div className="space-y-4">
                  <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-2">
                    Import Queue ({drafts.length} items)
                  </span>

                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                    {drafts.map((draft, idx) => (
                      <div key={draft.id} className="bg-page-bg/10 border border-border-light rounded-lg p-4 flex gap-4 hover:border-border-medium transition-colors">
                        
                        {/* Image Preview */}
                        <div className="w-24 h-24 rounded border border-border-light bg-page-bg overflow-hidden shrink-0 relative flex items-center justify-center">
                          <img src={draft.base64} alt="Draft preview" className="w-full h-full object-cover" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-text-primary truncate max-w-[200px]">
                              {draft.fileName}
                            </span>
                            <button 
                              onClick={() => setDrafts(prev => prev.filter(d => d.id !== draft.id))}
                              className="text-text-muted hover:text-error-red transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Caption Box */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-[9px] font-bold text-text-secondary uppercase">
                                Generated Caption
                              </span>
                              {draft.generating && (
                                <span className="font-mono text-[9px] text-primary-cyan flex items-center gap-1">
                                  <span className="animate-spin text-xs">⏳</span> Generating AI draft...
                                </span>
                              )}
                            </div>
                            <textarea 
                              value={draft.caption}
                              onChange={(e) => setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, caption: e.target.value } : d))}
                              disabled={draft.generating}
                              className="w-full border border-border-light rounded p-2 text-xs h-16 focus:outline-none focus:border-primary-cyan bg-panel-white disabled:opacity-50"
                            />
                          </div>

                          {/* Platforms Selector */}
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-[9px] font-bold text-text-secondary uppercase">
                              Publish channels:
                            </span>
                            <div className="flex gap-3">
                              {['instagram', 'facebook', 'twitter'].map(platformKey => (
                                <label key={platformKey} className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary cursor-pointer select-none">
                                  <input 
                                    type="checkbox" 
                                    checked={draft.platforms[platformKey]}
                                    onChange={(e) => setDrafts(prev => prev.map(d => d.id === draft.id ? {
                                      ...d,
                                      platforms: {
                                        ...d.platforms,
                                        [platformKey]: e.target.checked
                                      }
                                    } : d))}
                                    className="rounded border-border-medium text-primary-cyan focus:ring-primary-cyan"
                                  />
                                  <span className="capitalize">{platformKey}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border-light flex items-center justify-between bg-page-bg/10">
              
              {/* Offset Scheduling */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-secondary">Offset posts by:</span>
                <input 
                  type="number" 
                  min="1" 
                  max="14" 
                  value={intervalDays} 
                  onChange={(e) => setIntervalDays(e.target.value)}
                  className="w-12 text-center border border-border-light rounded py-1 px-1.5 focus:outline-none focus:border-primary-cyan font-mono"
                />
                <span className="text-text-secondary">days apart</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setIsImportModalOpen(false); setDrafts([]); }}
                  className="px-4 py-2 border border-border-light hover:bg-page-bg rounded text-xs font-semibold text-text-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleScheduleAll}
                  disabled={drafts.length === 0 || drafts.some(d => d.generating) || isSchedulingAll}
                  className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSchedulingAll ? 'Scheduling...' : `Schedule ${totalPostsCount} Posts`}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 2: Social Calendar
// ----------------------------------------------------
function SocialCalendar() {
  const { selectedClientId } = useApp();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (selectedClientId) {
      supabase.from('social_posts').eq('client_id', selectedClientId).then(({ data }) => {
        setPosts(data || []);
      });
    }
  }, [selectedClientId]);

  // Generate days in June 2026 (Mock month calendar grid)
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  const getPostsForDay = (day) => {
    // Arbitrary mapping for demo: post 1 on day 10, post 2 on day 29, etc.
    if (day === 10) return posts.filter(p => p.status === 'published');
    if (day === 12) return posts.filter(p => p.status === 'scheduled');
    return [];
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/social')} className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer">← SOCIAL HOME</button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase">SCHEDULING CALENDAR</span>
        </div>

        <button 
          onClick={() => navigate('/social/compose')}
          className="px-3.5 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer"
        >
          Compose Post
        </button>
      </div>

      <div className="bg-panel-white border border-border-light rounded shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">June 2026</h3>
          <span className="font-mono text-xs text-text-secondary">MONTHLY SCHEDULES VIEW</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 bg-page-bg p-1 border border-border-light rounded">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => (
            <div key={w} className="text-center font-mono text-[10px] font-bold text-text-secondary py-1 bg-panel-white">
              {w.toUpperCase()}
            </div>
          ))}

          {/* June 2026 starts on Monday (1 index offset) */}
          <div className="bg-panel-white/40 h-20 border border-page-bg"></div>

          {daysInMonth.map(day => {
            const dayPosts = getPostsForDay(day);
            return (
              <div key={day} className="bg-panel-white h-20 border border-page-bg p-1.5 flex flex-col justify-between hover:bg-cyan-50/20 cursor-pointer transition-colors relative">
                <span className="font-mono text-[10px] text-text-secondary font-bold">{day}</span>
                
                <div className="space-y-0.5">
                  {dayPosts.map((dp, idx) => (
                    <div 
                      key={idx} 
                      className={`text-[8px] font-mono px-1 rounded truncate leading-tight border ${
                        dp.status === 'published' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {dp.platform.toUpperCase()}: {dp.content}
                    </div>
                  ))}
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
// Sub-Page 3: Post Composer
// ----------------------------------------------------
function PostComposer() {
  const { agency, activeClient, forceRefresh } = useApp();
  const navigate = useNavigate();

  const [body, setBody] = useState('');
  const [usedModel, setUsedModel] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [isWriting, setIsWriting] = useState(false);
  const [hashtags, setHashtags] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageBase64, setImageBase64] = useState('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result);
      autoGenerateImageCaption(file.name);
    };
    reader.readAsDataURL(file);
  };

  const autoGenerateImageCaption = async (fileName) => {
    if (!agency?.id) return;
    setIsGeneratingCaption(true);
    setBody('Generating AI caption...');
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate', {
        body: {
          action: 'social-captions',
          input: { clientName: activeClient?.name || 'Client', topic: `creative caption for social post ${fileName}` },
          agency_id: agency.id
        }
      });
      if (error) {
        setBody(`Failed to generate caption: ${error}. Please enter manually.`);
      } else {
        setBody(data.output);
        if (data.model_name) setUsedModel(data.model_name);
      }
    } catch (e) {
      setBody('Failed to generate caption. Please enter manually.');
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!body) return;

    try {
      // Save post row
      await supabase.from('social_posts').insert({
        agency_id: agency.id,
        client_id: activeClient.id,
        platform,
        content: body + (hashtags ? ` ${hashtags}` : ''),
        image_url: imageBase64 || null,
        status: 'scheduled',
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Update onboarding progress for 'compose_post'
      const onboardingSteps = JSON.parse(localStorage.getItem('db_onboarding_progress') || '[]');
      const updatedOnboarding = onboardingSteps.map(step => 
        step.step_key === 'compose_post' ? { ...step, is_completed: true, completed_at: new Date().toISOString() } : step
      );
      localStorage.setItem('db_onboarding_progress', JSON.stringify(updatedOnboarding));

      window.dispatchEvent(new Event('local_db_change'));
      forceRefresh();
      alert('Post scheduled in Content calendar.');
      navigate('/social');
    } catch (e) {
      alert('Failed saving scheduled post.');
    }
  };

  const optimizeCaption = async () => {

    setIsWriting(true);
    try {
      const { data } = await supabase.functions.invoke('ai-generate', {
        body: {
          action: 'social-captions',
          input: { clientName: activeClient?.name || 'Client', topic: platform },
          agency_id: agency.id
        }
      });
      setBody(data.output);
      if (data.model_name) setUsedModel(data.model_name);
      forceRefresh();
      alert('AI caption drafted.');
    } catch (e) {
      alert('Failed drafting caption.');
    } finally {
      setIsWriting(false);
    }
  };

  const generateHashtags = () => {
    setHashtags('#KonguCuisine #IndiranagarBiryani #FoodLovers #BangaloreFoodies');
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/social')} className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer">← SOCIAL HOME</button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase">COMPOSE MULTI-PLATFORM POSTS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Form Composer */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-page-bg pb-2 mb-2">
            <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">
              SELECT PLATFORM
            </span>
            <button 
              type="button" 
              onClick={optimizeCaption}
              disabled={isWriting}
              className="flex items-center gap-1 text-primary-cyan hover:text-primary-cyan-hover font-mono text-[10px] font-bold cursor-pointer"
            >
              <Sparkles size={11} />
              <span>{isWriting ? 'COMPOSING...' : 'AI WRITE CAPTION'}</span>
            </button>
          </div>

          <div className="flex gap-2">
            {['instagram', 'facebook', 'twitter'].map(p => (
              <button 
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`py-1.5 px-4 rounded text-xs font-mono uppercase font-bold border transition-colors cursor-pointer ${
                  platform === p 
                    ? 'bg-[#ECFEFF] text-primary-cyan border-primary-cyan' 
                    : 'bg-panel-white text-text-secondary border-border-light hover:bg-page-bg'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <form onSubmit={handlePublish} className="space-y-4">
            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
                Post Text Body ({body.length} chars)
              </label>
              <textarea 
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your captions here..."
                className="w-full border border-border-light rounded p-3 text-xs h-32 focus:outline-none focus:border-primary-cyan font-sans"
              />
              {usedModel && body && <AiOutputBadge modelName={usedModel} />}
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
                Post Media Image
              </label>
              <div className="flex items-center gap-3">
                <label className="px-3 py-1.5 border border-border-light hover:border-primary-cyan rounded text-xs cursor-pointer bg-panel-white transition-colors font-medium flex items-center gap-1.5 select-none text-text-primary">
                  <Upload size={13} />
                  <span>Choose Image</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden" 
                  />
                </label>
                {imageBase64 && (
                  <div className="flex items-center gap-2">
                    <img src={imageBase64} alt="Thumb" className="w-8 h-8 rounded object-cover border border-border-light" />
                    <span className="text-[10px] text-text-muted truncate max-w-[140px]">{imageFile?.name}</span>
                    <button type="button" onClick={() => { setImageFile(null); setImageBase64(''); }} className="text-error-red hover:underline text-[10px] font-bold">Clear</button>
                  </div>
                )}
              </div>
              {isGeneratingCaption && (
                <span className="text-[9px] text-primary-cyan font-mono block animate-pulse">
                  ⏳ Generating AI caption draft for image...
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">Hashtag Block</label>
                <button type="button" onClick={generateHashtags} className="font-mono text-[10px] font-bold text-primary-cyan hover:underline cursor-pointer">
                  LOAD POPULAR HASHTAGS
                </button>
              </div>
              <input type="text" value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#marketing #viral" className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs focus:outline-none" />
            </div>

            <button type="submit" className="w-full py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white text-xs font-semibold rounded cursor-pointer transition-colors">
              SCHEDULE CAMPAIGN NOW
            </button>
          </form>
        </div>

        {/* Right Post Preview Box */}
        <div className="bg-[#F8F9FA] border border-border-light rounded shadow-inner p-6 flex items-center justify-center">
          <div className="w-full max-w-xs bg-panel-white rounded border border-[#DADCE0] shadow-sm p-4 space-y-3 font-sans">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary-cyan/10 text-primary-cyan text-xs flex items-center justify-center font-bold">
                {activeClient?.name.charAt(0) || 'L'}
              </span>
              <div className="flex flex-col text-xs leading-none">
                <span className="font-semibold text-text-primary">{activeClient?.name || 'Local Listing'}</span>
                <span className="text-[10px] text-text-muted mt-1 font-mono uppercase">{platform} post preview</span>
              </div>
            </div>

            {imageBase64 && (
              <div className="aspect-square w-full rounded overflow-hidden border border-border-light bg-page-bg flex items-center justify-center relative group">
                <img src={imageBase64} alt="Post preview" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => { setImageFile(null); setImageBase64(''); }} 
                  className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}

            <p className="text-xs text-text-primary leading-relaxed whitespace-pre-line">
              {body || 'Start writing post captions on the left to preview live mock card layouts.'}
            </p>

            <span className="text-[11px] text-primary-cyan font-mono block">
              {hashtags}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 4: Unified Inbox messenger
// ----------------------------------------------------
function UnifiedInbox() {
  const { activeClient } = useApp();
  const navigate = useNavigate();

  // Mock messaging threads
  const [threads, setThreads] = useState([
    { id: 't_1', name: 'Ananth Subramanian', platform: 'Instagram DM', preview: 'Is your Indiranagar branch open on Sundays?', unread: true, messages: [
      { sender: 'Ananth', text: 'Hi! Is your Indiranagar branch open on Sundays for dining?', time: 'Yesterday 18:20' }
    ]},
    { id: 't_2', name: 'Vijay Kumar', platform: 'WhatsApp', preview: 'Can I reschedule my implant appointment?', unread: false, messages: [
      { sender: 'Vijay', text: 'Hi Dr. Sandeep Rao. Can I reschedule my implant consultation from Thursday to Friday 11 AM?', time: 'Today 10:15' }
    ]}
  ]);

  const [activeThreadId, setActiveThreadId] = useState('t_1');
  const [replyInput, setReplyInput] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleReply = (e) => {
    e.preventDefault();
    if (!replyInput.trim()) return;

    const newMsg = { sender: 'Agency Buddy Team', text: replyInput.trim(), time: 'Just Now' };
    
    setThreads(prev => 
      prev.map(t => t.id === activeThreadId ? { ...t, preview: replyInput.trim(), unread: false, messages: [...t.messages, newMsg] } : t)
    );
    setReplyInput('');
  };

  const handleAiDraft = async () => {
    setIsReplying(true);
    // Simulate AI replying
    await new Promise(r => setTimeout(r, 1000));
    setReplyInput(`Hi! Yes, our Indiranagar branch is fully open on Sundays from 11:00 AM to 11:00 PM for family dining. Let us know if you would like us to book a table for you!`);
    setIsReplying(false);
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/social')} className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer">← SOCIAL HOME</button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase">UNIFIED MESSAGES INBOX</span>
        </div>
      </div>

      {/* Two panel messages layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[420px] bg-panel-white border border-border-light rounded shadow-sm overflow-hidden">
        
        {/* Left Column: Thread list */}
        <div className="border-r border-border-light flex flex-col h-full">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase p-3 border-b border-page-bg">
            ACTIVE THREADS
          </span>
          <div className="flex-1 divide-y divide-page-bg overflow-y-auto">
            {threads.map(t => (
              <div 
                key={t.id} 
                onClick={() => setActiveThreadId(t.id)}
                className={`p-3 cursor-pointer hover:bg-page-bg/40 transition-colors flex flex-col gap-1 ${
                  t.id === activeThreadId ? 'bg-cyan-50/40 border-l-2 border-primary-cyan' : ''
                }`}
              >
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-xs text-text-primary">{t.name}</span>
                  <span className="font-mono text-[9px] text-text-secondary bg-page-bg px-1 rounded font-bold uppercase">{t.platform}</span>
                </div>
                <p className="text-[11px] text-text-secondary truncate leading-relaxed">{t.preview}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active chat thread */}
        <div className="lg:col-span-2 flex flex-col h-full justify-between">
          <div className="p-3 border-b border-page-bg flex items-center justify-between bg-panel-white shrink-0">
            <span className="font-semibold text-xs text-text-primary">{activeThread?.name}</span>
            <button 
              onClick={handleAiDraft}
              disabled={isReplying}
              className="flex items-center gap-1 text-primary-cyan hover:text-primary-cyan-hover font-mono text-[10px] font-bold cursor-pointer"
            >
              <Sparkles size={11} />
              <span>{isReplying ? 'DRAFTING...' : 'AI DRAFT REPLY'}</span>
            </button>
          </div>

          {/* Messages feed */}
          <div className="flex-1 bg-page-bg/10 p-4 space-y-4 overflow-y-auto">
            {activeThread?.messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col max-w-[80%] ${m.sender === 'Agency Buddy Team' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                <div className={`p-2.5 rounded text-xs leading-relaxed ${
                  m.sender === 'Agency Buddy Team' ? 'bg-[#ECFEFF] text-text-primary border border-[#06B6D41A]' : 'bg-panel-white border border-border-light text-text-primary'
                }`}>
                  {m.text}
                </div>
                <span className="text-[9px] text-text-muted mt-1 font-mono">{m.time}</span>
              </div>
            ))}
          </div>

          {/* Reply Form input */}
          <form onSubmit={handleReply} className="p-3 border-t border-border-light bg-panel-white flex items-center gap-2 shrink-0">
            <input 
              type="text" 
              value={replyInput}
              onChange={e => setReplyInput(e.target.value)}
              placeholder="Type reply message..." 
              className="flex-1 border border-border-light rounded px-3 py-1.5 text-xs focus:outline-none"
            />
            <button type="submit" className="w-8 h-8 flex items-center justify-center rounded bg-primary-cyan text-white hover:bg-primary-cyan-hover transition-colors cursor-pointer">
              <Send size={13} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 5: Social Listening alerts
// ----------------------------------------------------
function SocialListening() {
  const navigate = useNavigate();
  return (
    <div className="p-8 text-center bg-panel-white border border-border-light rounded">
      <p className="text-xs text-text-secondary mb-3">To monitor brand mentions alerts across web blogs and forums, configure reputation keywords.</p>
      <Link to="/reputation" className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold inline-block">Manage Brand Listening Alerts</Link>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 6: Influencer Campaigns grid
// ----------------------------------------------------
function InfluencerDirectory() {
  const navigate = useNavigate();
  return (
    <div className="p-8 text-center bg-panel-white border border-border-light rounded">
      <p className="text-xs text-text-secondary mb-3">Compare local store coordinates overlays inside active geofencing dashboards.</p>
      <Link to="/geofencing" className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold inline-block">Find Niche Influencers</Link>
    </div>
  );
}
