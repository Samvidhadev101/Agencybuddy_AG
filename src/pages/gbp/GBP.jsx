import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { 
  Sparkles, Save, Eye, Check, ChevronDown, ChevronRight,
  Upload, MessageSquare, Plus, ArrowUpRight, Award,
  Trash2, Globe, Star, MapPin, EyeOff, Edit, ShieldAlert
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GBP() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  if (currentPath === '/gbp/edit') {
    return <GBPListingEditor />;
  } else if (currentPath === '/gbp/posts/new') {
    return <GBPPostCreator />;
  } else if (currentPath === '/gbp/photos') {
    return <GBPPhotoManager />;
  } else if (currentPath === '/gbp/qa') {
    return <GBPQAManager />;
  } else if (currentPath === '/gbp/audit') {
    return <GBPAuditor />;
  } else if (currentPath === '/gbp/locations') {
    return <GBPMultiLocation />;
  } else {
    return <GBPDashboard />;
  }
}

// ----------------------------------------------------
// Sub-Page 1: GBP Dashboard
// ----------------------------------------------------
function GBPDashboard() {
  const { selectedClientId, activeClient, navigate } = useApp();
  const nav = useNavigate();
  const [listing, setListing] = useState(null);
  const [insights, setInsights] = useState([]);
  const [posts, setPosts] = useState([]);
  const [qas, setQas] = useState([]);

  useEffect(() => {
    if (selectedClientId) {
      loadData(selectedClientId);
    }
  }, [selectedClientId]);

  const loadData = async (clientId) => {
    // Fetch listing
    const { data: list } = await supabase.from('gbp_listings').eq('client_id', clientId).maybeSingle();
    setListing(list);

    if (list) {
      // Fetch insights
      const { data: ins } = await supabase.from('gbp_insights').eq('listing_id', list.id).order('recorded_at', { ascending: true }).limit(30);
      setInsights(ins || []);

      // Fetch posts
      const { data: pts } = await supabase.from('gbp_posts').eq('listing_id', list.id).order('created_at', { ascending: false });
      setPosts(pts || []);

      // Fetch Q&A
      const { data: qaList } = await supabase.from('gbp_qa').eq('listing_id', list.id).order('created_at', { ascending: false });
      setQas(qaList || []);
    }
  };

  // Compile aggregate metrics
  const totalSearches = insights.reduce((acc, curr) => acc + curr.searches_direct + curr.searches_discovery, 0);
  const totalViews = insights.reduce((acc, curr) => acc + curr.views_maps + curr.views_search, 0);
  const totalClicks = insights.reduce((acc, curr) => acc + curr.actions_website, 0);
  const totalCalls = insights.reduce((acc, curr) => acc + curr.actions_calls, 0);

  // Format Recharts data (last 7 entries)
  const barChartData = insights.slice(-7).map(item => ({
    date: item.recorded_at.split('T')[0].split('-').slice(1).join('/'),
    Searches: item.searches_direct + item.searches_discovery,
    Views: item.views_maps + item.views_search
  }));

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'GBP Searches', val: totalSearches.toLocaleString(), sub: 'Direct & Discovery' },
          { label: 'Maps & Search Views', val: totalViews.toLocaleString(), sub: 'Google Maps listings' },
          { label: 'Website Clicks', val: totalClicks.toLocaleString(), sub: 'Redirect from profile' },
          { label: 'Phone Calls', val: totalCalls.toLocaleString(), sub: 'Direct clicks to call' }
        ].map((stat, i) => (
          <div key={i} className="bg-panel-white border border-border-light rounded p-4 shadow-sm flex flex-col justify-between h-24">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">{stat.label}</span>
              <span className="text-[10px] text-text-muted">{stat.sub}</span>
            </div>
            <span className="text-xl font-bold text-text-primary mt-1">{stat.val}</span>
          </div>
        ))}
      </div>

      {/* Grid: 30 days Actions bar chart & Quick actions sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Actions bar chart */}
        <div className="lg:col-span-2 bg-panel-white border border-border-light rounded shadow-sm p-4 flex flex-col h-80">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase border-b border-page-bg pb-2 mb-4">
            GMB Traffic breakdown (Last 7 Days)
          </span>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderRadius: '4px', border: 'none', color: '#FFF', fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                <Bar dataKey="Searches" fill="#06B6D4" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Views" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Operations panel */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-4 space-y-3">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-2">
            GBP Profile Controls
          </span>

          <div className="grid grid-cols-1 gap-2 pt-2">
            <button onClick={() => nav('/gbp/edit')} className="w-full text-left py-2 px-3 border border-border-light hover:border-primary-cyan rounded text-xs flex justify-between items-center bg-panel-white transition-colors cursor-pointer font-medium">
              <span>Listing profile fields editor</span>
              <span className="font-mono text-[10px] text-text-muted">Edit profile</span>
            </button>
            <button onClick={() => nav('/gbp/posts')} className="w-full text-left py-2 px-3 border border-border-light hover:border-primary-cyan rounded text-xs flex justify-between items-center bg-panel-white transition-colors cursor-pointer font-medium">
              <span>Schedule GMB posts</span>
            </button>
            <button onClick={() => nav('/gbp/photos')} className="w-full text-left py-2 px-3 border border-border-light hover:border-primary-cyan rounded text-xs flex justify-between items-center bg-panel-white transition-colors cursor-pointer font-medium">
              <span>Manage gallery photos</span>
              <span className="font-mono text-[10px] text-text-muted">Upload gallery</span>
            </button>
            <button onClick={() => nav('/gbp/qa')} className="w-full text-left py-2 px-3 border border-border-light hover:border-primary-cyan rounded text-xs flex justify-between items-center bg-panel-white transition-colors cursor-pointer font-medium">
              <span>Manage Q&A discussions</span>
              <span className="font-mono text-[10px] text-text-secondary">
                {qas.filter(q => q.status === 'unanswered').length} unanswered
              </span>
            </button>
            <button onClick={() => nav('/gbp/audit')} className="w-full text-left py-2 px-3 border border-border-light hover:border-primary-cyan rounded text-xs flex justify-between items-center bg-panel-white transition-colors cursor-pointer font-medium">
              <span>Audit Listing profile completeness</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row: Recent Posts & Q&A */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GMB posts */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-4">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-2 mb-3">
            Recent GMB post campaigns
          </span>
          <div className="divide-y divide-page-bg text-xs max-h-[200px] overflow-y-auto">
            {posts.length === 0 ? (
              <div className="py-8 text-center text-text-muted">No posts found.</div>
            ) : (
              posts.map(p => (
                <div key={p.id} className="py-2 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5 max-w-[70%]">
                    <span className="font-medium text-text-primary truncate">{p.body}</span>
                    <span className="text-[10px] text-text-muted font-mono">{p.type?.toUpperCase()}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    p.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Q&A section */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-4">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-2 mb-3">
            Recent Client Questions (Q&A)
          </span>
          <div className="divide-y divide-page-bg text-xs max-h-[200px] overflow-y-auto">
            {qas.length === 0 ? (
              <div className="py-8 text-center text-text-muted">No questions found.</div>
            ) : (
              qas.map(q => (
                <div key={q.id} className="py-2 flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-text-primary">{q.question}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      q.status === 'answered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {q.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted leading-relaxed">
                    {q.answer ? `Reply: "${q.answer}"` : 'Awaiting team reply...'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 2: GBP Listing Editor
// ----------------------------------------------------
function GBPListingEditor() {
  const { agency, activeClient, forceRefresh } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [desc, setDesc] = useState('');
  const [website, setWebsite] = useState('');
  const [category, setCategory] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    if (activeClient) {
      supabase.from('gbp_listings').eq('client_id', activeClient.id).maybeSingle().then(({ data }) => {
        if (data) {
          setName(data.business_name || '');
          setPhone(data.phone || '');
          setDesc(data.description || '');
          setWebsite(data.website || '');
          setCategory(data.category_primary || '');
        }
      });
    }
  }, [activeClient]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (activeClient) {
      await supabase.from('gbp_listings').eq('client_id', activeClient.id).update({
        business_name: name,
        phone,
        description: desc,
        website,
        category_primary: category
      });
      window.dispatchEvent(new Event('local_db_change'));
      alert('GBP Listing fields updated.');
      navigate('/gbp');
    }
  };

  const optimizeDescription = async () => {
    setIsOptimizing(true);
    try {
      const { data } = await supabase.functions.invoke('ai-generate', {
        body: {
          action: 'gbp-desc-opt',
          input: { clientName: activeClient?.name || 'Client', topic: category },
          agency_id: agency.id
        }
      });

      setDesc(data.output);
      forceRefresh();
      alert('AI Description optimized.');
    } catch (e) {
      alert('Failed optimizing description.');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/gbp')} className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer">← GBP HOME</button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase">EDIT PROFILE FIELDS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form fields */}
        <div className="lg:col-span-2 bg-panel-white border border-border-light rounded shadow-sm p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">Google Business Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">Primary Category</label>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">Profile Phone</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">Business Description ({desc.length} chars)</label>
                <button 
                  type="button" 
                  onClick={optimizeDescription}
                  disabled={isOptimizing}
                  className="flex items-center gap-1 text-primary-cyan hover:text-primary-cyan-hover font-mono text-[10px] font-bold cursor-pointer"
                >
                  <Sparkles size={11} />
                  <span>{isOptimizing ? 'OPTIMIZING...' : 'AI OPTIMIZE'}</span>
                </button>
              </div>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full border border-border-light rounded p-2.5 text-xs h-28 font-sans" />
            </div>

            <button type="submit" className="w-full py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1 cursor-pointer">
              <Save size={13} />
              <span>SAVE GBP LISTING FIELDS</span>
            </button>
          </form>
        </div>

        {/* Profile Completeness card */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-6 space-y-4">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-2">
            Completeness Checklist
          </span>

          <div className="space-y-3 text-xs leading-relaxed text-text-secondary">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">✓</span>
              <span>Primary Category specified</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">✓</span>
              <span>Contact Phone listed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">✓</span>
              <span>Website link connected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold">!</span>
              <span>Description needs optimization (750 max chars)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 3: GBP Post Creator
// ----------------------------------------------------
function GBPPostCreator() {
  const { agency, activeClient, forceRefresh } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('update');
  const [body, setBody] = useState('');
  const [ctaType, setCtaType] = useState('ORDER');
  const [ctaUrl, setCtaUrl] = useState('');
  const [isWriting, setIsWriting] = useState(false);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!body) return;

    // Create post row in gbp_posts
    const { data: listing } = await supabase.from('gbp_listings').eq('client_id', activeClient.id).maybeSingle();
    
    if (listing) {
      await supabase.from('gbp_posts').insert({
        listing_id: listing.id,
        agency_id: agency.id,
        type: activeTab,
        body,
        cta_type: ctaType,
        cta_url: ctaUrl,
        status: 'published',
        published_at: new Date().toISOString()
      });
      window.dispatchEvent(new Event('local_db_change'));
      alert('Post published directly to Google Business Profile.');
      navigate('/gbp');
    }
  };

  const runAiWriter = async () => {
    setIsWriting(true);
    try {
      const { data } = await supabase.functions.invoke('ai-generate', {
        body: {
          action: 'gbp-post',
          input: { clientName: activeClient?.name || 'Client', topic: activeTab },
          agency_id: agency.id
        }
      });
      setBody(data.output);
      forceRefresh();
      alert('AI GMB post drafted.');
    } catch (e) {
      alert('Failed drafting post.');
    } finally {
      setIsWriting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/gbp')} className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer">← GBP HOME</button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase">CREATE NEW GBP POST</span>
        </div>
      </div>

      {/* Post Type Tabs */}
      <div className="border-b border-border-light flex gap-4 text-xs font-mono select-none">
        {['update', 'offer', 'event', 'product'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`py-1.5 px-3 rounded-t border-t border-x transition-colors cursor-pointer ${
              activeTab === tab 
                ? 'bg-panel-white border-border-light text-primary-cyan font-bold -mb-[1px]' 
                : 'bg-page-bg/50 border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Split Composer / Google SERP Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Form Composer */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">
              POST COPY BODY
            </span>
            <button 
              type="button" 
              onClick={runAiWriter}
              disabled={isWriting}
              className="flex items-center gap-1 text-primary-cyan hover:text-primary-cyan-hover font-mono text-[10px] font-bold cursor-pointer"
            >
              <Sparkles size={11} />
              <span>{isWriting ? 'WRITING...' : 'AI WRITE POST'}</span>
            </button>
          </div>

          <form onSubmit={handlePublish} className="space-y-4">
            <textarea 
              value={body} 
              onChange={e => setBody(e.target.value)} 
              placeholder="Tell your local customers about what's new at your store..." 
              className="w-full border border-border-light rounded p-3 text-xs h-32 focus:outline-none focus:border-primary-cyan font-sans"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">CTA Button Type</label>
                <select value={ctaType} onChange={e => setCtaType(e.target.value)} className="w-full border border-border-light bg-panel-white rounded px-2.5 py-1.5 text-xs">
                  <option value="ORDER">Order Online</option>
                  <option value="BOOK">Book Appointment</option>
                  <option value="LEARN">Learn More</option>
                  <option value="CALL">Call Now</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">CTA Button URL</label>
                <input type="text" value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} placeholder="https://site.com/menu" className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs" />
              </div>
            </div>

            <button type="submit" className="w-full py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1 cursor-pointer">
              <Check size={13} />
              <span>PUBLISH TO GOOGLE NOW</span>
            </button>
          </form>
        </div>

        {/* Live Google Preview Card */}
        <div className="bg-[#F8F9FA] border border-border-light rounded shadow-inner p-6 flex items-center justify-center">
          <div className="w-full max-w-sm bg-panel-white rounded border border-[#DADCE0] shadow-sm p-4 space-y-3 font-sans">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-page-bg text-text-secondary text-xs flex items-center justify-center font-bold">G</span>
              <div className="flex flex-col text-xs leading-none">
                <span className="font-semibold text-text-primary">{activeClient?.name || 'Local Listing'}</span>
                <span className="text-[10px] text-text-muted mt-1">Google Maps post</span>
              </div>
            </div>

            {/* Post Media placeholder */}
            <div className="w-full h-32 bg-page-bg rounded flex items-center justify-center border border-border-light">
              <span className="font-mono text-[10px] text-text-muted uppercase">GMB post photo banner</span>
            </div>

            <p className="text-xs text-text-primary leading-relaxed whitespace-pre-line">
              {body || 'Start writing post copy on the left to preview simulated Google Search result card.'}
            </p>

            {ctaUrl && (
              <a href={ctaUrl} target="_blank" rel="noreferrer" className="w-full py-1.5 border border-[#1A73E8] text-[#1A73E8] rounded text-center text-xs font-semibold block uppercase hover:bg-blue-50/20">
                {ctaType.replace('_', ' ')}
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 4: GBP Photo Manager
// ----------------------------------------------------
function GBPPhotoManager() {
  const navigate = useNavigate();
  return (
    <div className="p-8 text-center bg-panel-white border border-border-light rounded">
      <p className="text-xs text-text-secondary mb-3">To edit cover banners or import interior dental/restaurant photos, visit support assets folder.</p>
      <Link to="/content/assets" className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold inline-block">Upload Photos Gallery</Link>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 5: GBP Q&A Manager
// ----------------------------------------------------
function GBPQAManager() {
  const navigate = useNavigate();
  return (
    <div className="p-8 text-center bg-panel-white border border-border-light rounded">
      <p className="text-xs text-text-secondary mb-3">Customer reviews, answers suggestions drafts, and ticket seeding guides can be managed in Reputation panel.</p>
      <Link to="/reputation" className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold inline-block">Manage Q&A & Reviews</Link>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 6: GBP Auditor results
// ----------------------------------------------------
function GBPAuditor() {
  const navigate = useNavigate();
  return (
    <div className="p-8 text-center bg-panel-white border border-border-light rounded">
      <p className="text-xs text-text-secondary mb-3">To benchmark competitor location densities, run local audit crawler engines.</p>
      <Link to="/geofencing" className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold inline-block">Audit Maps Densities</Link>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 7: GBP Multi-location matrix
// ----------------------------------------------------
function GBPMultiLocation() {
  const navigate = useNavigate();
  return (
    <div className="p-8 text-center bg-panel-white border border-border-light rounded">
      <p className="text-xs text-text-secondary mb-3">Compare local store coordinates overlays inside active geofencing dashboards.</p>
      <Link to="/geofencing" className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold inline-block">View Multi-locations Matrix</Link>
    </div>
  );
}
