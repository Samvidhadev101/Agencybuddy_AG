import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import AiWarningBanner from '../../components/AiWarningBanner';
import { 
  Globe, Plus, Sparkles, ChevronDown, ChevronRight, 
  ArrowUpRight, ArrowDownRight, FileText, CheckCircle2, 
  AlertTriangle, Play, Download, Search, AlertCircle 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SEO() {
  const location = useLocation();
  const navigate = useNavigate();
  const { agency, activeClient, selectedClientId, forceRefresh } = useApp();

  const currentPath = location.pathname;

  let content;
  if (currentPath === '/seo/audit') {
    content = <SEOAuditRunner />;
  } else if (currentPath.startsWith('/seo/audit/')) {
    content = <SEOAuditResults />;
  } else if (currentPath === '/seo/keywords') {
    content = <KeywordTracker />;
  } else if (currentPath === '/seo/ads') {
    content = <SearchAds />;
  } else {
    content = <SEODashboard />;
  }

  return (
    <div className="space-y-4">
      <AiWarningBanner />
      {content}
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 1: SEO Dashboard
// ----------------------------------------------------
function SEODashboard() {
  const { agency, activeClient, selectedClientId } = useApp();
  const navigate = useNavigate();

  const [audits, setAudits] = useState([]);
  
  useEffect(() => {
    if (selectedClientId) {
      supabase.from('seo_audits').eq('client_id', selectedClientId).then(({ data }) => {
        setAudits(data || []);
      });
    }
  }, [selectedClientId]);

  // Mock charts data
  const chartData = [
    { date: '05-10', rank: 14 },
    { date: '05-13', rank: 12 },
    { date: '05-16', rank: 8 },
    { date: '05-19', rank: 9 },
    { date: '05-22', rank: 6 },
    { date: '05-25', rank: 4 },
    { date: '05-27', rank: 3 }
  ];

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Domain Authority', val: '42 / 100', trend: '+2 vs last month', isUp: true },
          { label: 'Organic Keywords', val: '1,840', trend: '+142 vs last month', isUp: true },
          { label: 'Total Backlinks', val: '4,280', trend: '-18 dead links', isUp: false },
          { label: 'Page Speed Index', val: '94 / 100', trend: '+4 vs last month', isUp: true }
        ].map((met, i) => (
          <div key={i} className="bg-panel-white border border-border-light rounded p-4 flex flex-col justify-between h-24 shadow-sm">
            <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">{met.label}</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-xl font-bold text-text-primary">{met.val}</span>
              <span className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${met.isUp ? 'text-success-green' : 'text-error-red'}`}>
                {met.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {met.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Grid: Keyword rankings chart & Recent audits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Keywords ranks history */}
        <div className="lg:col-span-2 bg-panel-white border border-border-light rounded shadow-sm p-4 flex flex-col h-80">
          <div className="flex items-center justify-between border-b border-page-bg pb-3 mb-4">
            <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">
              Average Keyword Rank (Top 5 Queries)
            </span>
            <span className="text-[10px] font-mono text-text-muted uppercase">Inverted (Lower is better)</span>
          </div>

          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <YAxis reversed tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderRadius: '4px', border: 'none', color: '#FFF', fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                <Line type="monotone" dataKey="rank" stroke="#06B6D4" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ fill: '#06B6D4', strokeWidth: 1 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Audits List */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-4 flex flex-col justify-between h-80">
          <div className="space-y-4">
            <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-2">
              Recent SEO Reports
            </span>

            <div className="divide-y divide-page-bg text-xs overflow-y-auto max-h-[180px]">
              {audits.map(aud => (
                <div key={aud.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-[11px] font-semibold text-text-primary">{aud.url}</span>
                    <span className="text-[10px] text-text-muted font-mono">
                      {new Date(aud.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button 
                    onClick={() => navigate(`/seo/audit/${aud.id}`)}
                    className="flex items-center gap-1 bg-[#ECFEFF] border border-[#06B6D41A] text-primary-cyan px-2 py-1 rounded text-[10px] font-bold uppercase cursor-pointer"
                  >
                    <span>View {aud.overall_score}%</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => navigate('/seo/audit')}
            className="w-full py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold mt-4 transition-colors cursor-pointer"
          >
            Launch New Audit Analyzer
          </button>
        </div>
      </div>

      {/* Quick suggestions panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Keywords Tracker', cost: '1 token', path: '/seo/keywords', desc: 'Add search queries to monitor daily local ranks.' },
          { title: 'Search Ads campaigns', cost: 'Free monitoring', path: '/seo/ads', desc: 'Track organic keyword conversion budgets.' },
          { title: 'AEO Visibility Checker', cost: '3 tokens', path: '/aeo', desc: 'Scan AI citations across ChatGPT and Gemini.' }
        ].map((item, idx) => (
          <div 
            key={idx}
            onClick={() => navigate(item.path)}
            className="bg-panel-white border border-border-light hover:border-primary-cyan p-4 rounded shadow-sm cursor-pointer transition-all duration-150 flex flex-col justify-between h-28"
          >
            <div className="flex justify-between items-start">
              <span className="font-semibold text-text-primary text-xs">{item.title}</span>
              <span className="text-[10px] font-mono text-primary-cyan font-bold bg-[#06B6D412] px-1.5 py-0.5 rounded">
                {item.cost}
              </span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed mt-2">{item.desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 2: SEO Audit Runner input
// ----------------------------------------------------
function SEOAuditRunner() {
  const { agency, activeClient, forceRefresh } = useApp();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRunAudit = async (e) => {
    e.preventDefault();
    setError('');

    if (!url) {
      setError('Please provide a target site URL to audit.');
      return;
    }


    setLoading(true);
    try {
      // Fetch real website data to give to the AI
      let scrapedText = '';
      try {
        let fetchUrl = url;
        if (!fetchUrl.startsWith('http')) fetchUrl = 'https://' + fetchUrl;
        
        // 1. Fetch HTML Metadata via proxy
        const htmlPromise = fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(fetchUrl)}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null);

        // 2. Fetch PageSpeed Insights Data (Mobile)
        const psiPromise = fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(fetchUrl)}&category=performance&category=seo&strategy=mobile`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null);

        const [proxyData, psiData] = await Promise.all([htmlPromise, psiPromise]);

        let metaText = 'Title: No title tag found\nMeta Description: No meta description found\nH1 Tag: No H1 tag found\nHTML Snippet: None';
        if (proxyData && proxyData.contents) {
          const html = proxyData.contents;
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
          const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
          
          const title = titleMatch ? titleMatch[1] : 'No title tag found';
          const description = descMatch ? descMatch[1] : 'No meta description found';
          const h1 = h1Match ? h1Match[1] : 'No H1 tag found';
          
          metaText = `Title: ${title}\nMeta Description: ${description}\nH1 Tag: ${h1}\nHTML Snippet: ${html.replace(/<[^>]*>?/gm, '').substring(0, 800)}`;
        }

        let psiText = 'Core Web Vitals: Not Available\nPerformance Score: Not Available\nSEO Score: Not Available';
        if (psiData && psiData.lighthouseResult) {
          const lr = psiData.lighthouseResult;
          const audits = lr.audits;
          const lcp = audits['largest-contentful-paint']?.displayValue || 'N/A';
          const cls = audits['cumulative-layout-shift']?.displayValue || 'N/A';
          const fcp = audits['first-contentful-paint']?.displayValue || 'N/A';
          
          const perfScore = lr.categories.performance?.score ? Math.round(lr.categories.performance.score * 100) : 'N/A';
          const seoScore = lr.categories.seo?.score ? Math.round(lr.categories.seo.score * 100) : 'N/A';

          psiText = `Real Google PageSpeed Data:\nCore Web Vitals -> LCP: ${lcp}, CLS: ${cls}, FCP: ${fcp}\nLighthouse Mobile Performance Score: ${perfScore}/100\nLighthouse SEO Score: ${seoScore}/100`;
        }

        scrapedText = `${metaText}\n\n${psiText}`;

      } catch (scrapeErr) {
        console.warn('Scraping failed, falling back to simulation', scrapeErr);
      }

      // Invoke simulated AI generation but pass the real scraped data
      const { data, error: aiError } = await supabase.functions.invoke('ai-generate', {
        body: {
          action: 'seo-audit',
          input: { clientName: activeClient?.name || 'Client', url, scrapedText },
          agency_id: agency.id
        }
      });

      if (aiError) {
        setError(aiError);
      } else {
        const auditResult = JSON.parse(data.output);
        
        // Save audit results to table
        const { data: savedAudit } = await supabase.from('seo_audits').insert({
          agency_id: agency.id,
          client_id: activeClient?.id || 'cli_kovai_id',
          url,
          overall_score: auditResult.score,
          onpage_score: auditResult.onpage,
          technical_score: auditResult.technical,
          content_score: auditResult.content,
          mobile_score: auditResult.mobile,
          findings: auditResult.findings,
          recommendations: auditResult.recommendations,
          tokens_used: 2
        });

        // Trigger onboarding completion for 'run_seo_audit'
        const onboardingSteps = JSON.parse(localStorage.getItem('db_onboarding_progress') || '[]');
        const updatedOnboarding = onboardingSteps.map(step => 
          step.step_key === 'run_seo_audit' ? { ...step, is_completed: true, completed_at: new Date().toISOString() } : step
        );
        localStorage.setItem('db_onboarding_progress', JSON.stringify(updatedOnboarding));

        window.dispatchEvent(new Event('local_db_change'));
        forceRefresh();
        navigate(`/seo/audit/${savedAudit.id}`);
      }
    } catch (e) {
      setError('Failed running organic crawling simulation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans py-8 animate-fade-in">
      <div className="bg-panel-white border border-border-light rounded-lg shadow p-6 space-y-5">
        
        <div className="border-b border-page-bg pb-3 text-center">
          <h2 className="text-sm font-mono uppercase font-bold text-text-primary tracking-wider">
            SEO Audit Crawler
          </h2>
          <p className="text-xs text-text-secondary mt-1">Crawls website pages to score technical performance, on-page optimization, and core web vitals.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-error-red text-xs rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleRunAudit} className="space-y-4">
          <div className="space-y-1">
            <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
              Target Website URL
            </label>
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. kovaibiryani.in"
              className="w-full border border-border-light rounded px-3 h-10 text-xs focus:outline-none focus:border-primary-cyan focus:ring-1 focus:ring-primary-cyan/20"
              disabled={loading}
            />
          </div>


          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-10 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>CRAWLING META HEADERS...</span>
              </span>
            ) : (
              <>
                <Play size={14} />
                <span>RUN AUDIT</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 3: SEO Audit Results details
// ----------------------------------------------------
function SEOAuditResults() {
  const location = useLocation();
  const auditId = location.pathname.split('/').pop();
  const navigate = useNavigate();
  const [audit, setAudit] = useState(null);

  useEffect(() => {
    if (auditId) {
      supabase.from('seo_audits').eq('id', auditId).single().then(({ data }) => {
        setAudit(data);
      });
    }
  }, [auditId]);

  if (!audit) {
    return (
      <div className="py-12 text-center text-xs font-mono text-text-muted animate-pulse">
        GENERATING VISUAL AUDIT SCORES...
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'stroke-success-green text-success-green';
    if (score >= 60) return 'stroke-warning-amber text-warning-amber';
    return 'stroke-error-red text-error-red';
  };

  const getGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // Convert SVG Circular Gauge parameters
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (audit.overall_score / 100) * circumference;

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/seo')}
            className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer"
          >
            ← BACK TO LIST
          </button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="font-mono text-xs font-bold text-text-primary uppercase truncate max-w-xs">
            {audit.url} REPORT CARD
          </span>
        </div>

        <div className="flex items-center gap-2 select-none">
          <button 
            onClick={() => alert('PDF export generated. Check output artifact downloads.')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border-light hover:border-border-medium rounded text-xs font-medium text-text-secondary hover:text-text-primary bg-panel-white transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Overall Score Circle Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core radial score */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase mb-4">
            Overall organic health
          </span>

          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG circle meter */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle className="stroke-page-bg fill-none" cx="60" cy="60" r={radius} strokeWidth={strokeWidth} />
              <circle 
                className={`fill-none transition-all duration-500 ${getScoreColor(audit.overall_score)}`} 
                cx="60" 
                cy="60" 
                r={radius} 
                strokeWidth={strokeWidth} 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-3xl font-extrabold text-text-primary font-mono">
              {audit.overall_score}%
            </span>
          </div>

          <p className="text-[11px] text-text-secondary mt-3 leading-relaxed">
            Crawling completed on {new Date(audit.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Breakdown bar cards */}
        <div className="md:col-span-2 bg-panel-white border border-border-light rounded shadow-sm p-6 space-y-4">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-2 mb-2">
            Performance Breakdown Matrix
          </span>

          {[
            { label: 'On-Page Optimization', score: audit.onpage_score },
            { label: 'Technical Infrastructure', score: audit.technical_score },
            { label: 'Content Quality score', score: audit.content_score },
            { label: 'Mobile Compatibility speed', score: audit.mobile_score }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-xs">
              <span className="w-40 font-medium text-text-primary truncate">{item.label}</span>
              <div className="flex-1 bg-page-bg h-2.5 rounded overflow-hidden">
                <div 
                  className={`h-full rounded transition-all duration-300 ${
                    item.score >= 80 ? 'bg-success-green' : item.score >= 60 ? 'bg-warning-amber' : 'bg-error-red'
                  }`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
              <div className="flex items-center gap-2 w-14 justify-end">
                <span className="font-mono font-bold text-text-primary">{item.score}%</span>
                <span className={`w-5 h-5 rounded font-mono font-bold text-[10px] flex items-center justify-center ${
                  item.score >= 80 ? 'bg-emerald-50 text-emerald-700' : item.score >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                }`}>
                  {getGrade(item.score)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accordion Findings */}
      <div className="bg-panel-white border border-border-light rounded shadow-sm p-6">
        <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-2 mb-4">
          SEO Audit Crawl Findings & Recommendations
        </span>

        <div className="space-y-3">
          {/* New Format (Array of objects) */}
          {Array.isArray(audit.findings) && audit.findings.map((finding, i) => (
            <div key={`find-${i}`} className={`border rounded p-4 space-y-1.5 ${
              finding.severity === 'critical' ? 'border-red-100 bg-red-50/20' :
              finding.severity === 'warning' ? 'border-amber-100 bg-amber-50/20' :
              'border-emerald-100 bg-emerald-50/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">{finding.parameter || 'Analysis'}</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                  finding.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  finding.severity === 'warning' ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {finding.severity || 'good'}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-text-primary font-sans">{finding.title}</h4>
              <p className="text-[11px] text-text-secondary leading-relaxed mb-1">
                {finding.description}
              </p>
              {finding.recommendation && (
                <div className="bg-panel-white border border-border-light rounded p-2.5 mt-2">
                  <p className="text-[10px] text-text-primary font-mono"><span className="text-primary-cyan font-bold">Recommendation:</span> {finding.recommendation}</p>
                </div>
              )}
            </div>
          ))}

          {/* Fallback for Old Format (Object with critical/warnings arrays) */}
          {!Array.isArray(audit.findings) && Array.isArray(audit.findings?.critical) && audit.findings.critical.map((title, i) => (
            <div key={`crit-${i}`} className="border border-red-100 rounded bg-red-50/20 p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-red-100 text-red-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  Critical
                </span>
                <h4 className="text-xs font-semibold text-text-primary font-sans">{title}</h4>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Recommendation: Prioritize fixing this issue to prevent search engines from index dropping your organic links.
              </p>
            </div>
          ))}

          {!Array.isArray(audit.findings) && Array.isArray(audit.findings?.warnings) && audit.findings.warnings.map((title, i) => (
            <div key={`warn-${i}`} className="border border-amber-100 rounded bg-amber-50/20 p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  Warning
                </span>
                <h4 className="text-xs font-semibold text-text-primary font-sans">{title}</h4>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Recommendation: Enhance this structural config to boost search engine discoverability.
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 4: Keyword Tracker page
// ----------------------------------------------------
function KeywordTracker() {
  const { activeClient, selectedClientId, agency, forceRefresh } = useApp();
  const [keywords, setKeywords] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  
  // Expanded keyword rows for sparkline
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (selectedClientId) {
      loadKeywords(selectedClientId);
    }
  }, [selectedClientId]);

  const loadKeywords = async (clientId) => {
    const { data } = await supabase.from('keyword_trackers').eq('client_id', clientId);
    setKeywords(data || []);
  };

  const handleAddKeywords = async (e) => {
    e.preventDefault();
    if (!keywordInput.trim()) return;

    const list = keywordInput.split('\n').map(k => k.trim()).filter(k => k.length > 0);
    const newRows = list.map(keyword => ({
      client_id: selectedClientId,
      keyword,
      current_rank: Math.floor(Math.random() * 80) + 10,
      previous_rank: Math.floor(Math.random() * 80) + 12,
      search_volume: Math.floor(Math.random() * 150) * 10 + 200,
      difficulty: Math.floor(Math.random() * 80) + 15,
      cpc: Number((Math.random() * 5).toFixed(2)),
      last_checked: new Date().toISOString()
    }));

    await supabase.from('keyword_trackers').insert(newRows);
    loadKeywords(selectedClientId);
    setKeywordInput('');
    setShowAddModal(false);
    window.dispatchEvent(new Event('local_db_change'));
  };

  const runAiSuggestions = async () => {
    // Call AI Suggestions
    try {
      const { data } = await supabase.functions.invoke('ai-generate', {
        body: {
          action: 'keyword-research',
          input: { topic: activeClient?.industry || 'marketing', clientName: activeClient?.name },
          agency_id: agency.id
        }
      });
      
      const list = JSON.parse(data.output);
      const newRows = list.map(item => ({
        client_id: selectedClientId,
        keyword: item.keyword,
        current_rank: Math.floor(Math.random() * 40) + 5,
        previous_rank: Math.floor(Math.random() * 40) + 8,
        search_volume: item.volume,
        difficulty: item.difficulty,
        cpc: item.cpc,
        last_checked: new Date().toISOString()
      }));

      await supabase.from('keyword_trackers').insert(newRows);
      loadKeywords(selectedClientId);
      window.dispatchEvent(new Event('local_db_change'));
      forceRefresh();
      alert('AI Keyword suggestions loaded & inserted.');
    } catch (e) {
      alert('Failed running AI recommendations.');
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      
      {/* Title / Action bar */}
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div>
          <h2 className="text-sm font-mono uppercase font-bold text-text-primary">Keyword Rank Tracker</h2>
          <p className="text-xs text-text-secondary">Monitor localized queries rankings on Google SERPs.</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={runAiSuggestions}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-panel-white border border-[#06B6D433] hover:border-primary-cyan text-primary-cyan rounded text-xs font-semibold hover:bg-cyan-50/20 transition-all duration-150 cursor-pointer"
          >
            <Sparkles size={13} />
            <span>AI Suggestions</span>
          </button>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>Add Keywords</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-panel-white border border-border-light rounded shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-page-bg/40 border-b border-border-light text-[10px] font-mono text-text-secondary uppercase">
              <th className="py-2.5 px-4 font-semibold">Search query</th>
              <th className="py-2.5 px-4 font-semibold text-center">Ranks</th>
              <th className="py-2.5 px-4 font-semibold">Search Volume</th>
              <th className="py-2.5 px-4 font-semibold">Difficulty</th>
              <th className="py-2.5 px-4 font-semibold">Avg CPC</th>
              <th className="py-2.5 px-4 font-semibold">Last Checked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-page-bg text-xs">
            {keywords.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-text-secondary">
                  No keywords tracked yet. Click "Add Keywords" or generate with AI.
                </td>
              </tr>
            ) : (
              keywords.map(kw => {
                const rankChange = kw.previous_rank - kw.current_rank;
                const isExpanded = expandedId === kw.id;
                return (
                  <React.Fragment key={kw.id}>
                    <tr 
                      onClick={() => setExpandedId(isExpanded ? null : kw.id)}
                      className="hover:bg-[#F0FDFA] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-semibold text-text-primary">
                        <div className="flex items-center gap-1">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span>{kw.keyword}</span>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-bold text-text-primary text-sm">{kw.current_rank}</span>
                          {rankChange > 0 ? (
                            <span className="text-success-green flex items-center font-mono text-[10px] font-bold">
                              ▲{rankChange}
                            </span>
                          ) : rankChange < 0 ? (
                            <span className="text-error-red flex items-center font-mono text-[10px] font-bold">
                              ▼{Math.abs(rankChange)}
                            </span>
                          ) : (
                            <span className="text-text-muted font-mono text-[10px] font-bold">-</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-text-secondary">
                        {kw.search_volume.toLocaleString()} / mo
                      </td>

                      <td className="py-3 px-4 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-page-bg h-2 rounded overflow-hidden">
                            <div 
                              className={`h-full rounded ${
                                kw.difficulty >= 60 ? 'bg-error-red' : kw.difficulty >= 35 ? 'bg-warning-amber' : 'bg-success-green'
                              }`}
                              style={{ width: `${kw.difficulty}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold text-text-secondary w-6 text-right">
                            {kw.difficulty}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-text-secondary">
                        ${kw.cpc.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 font-mono text-text-muted">
                        {new Date(kw.last_checked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>

                    {/* Sparkline historical detail drawer */}
                    {isExpanded && (
                      <tr className="bg-[#ECFEFF]/20">
                        <td colSpan="6" className="py-4 px-12 border-b border-border-light">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5 text-xs">
                              <span className="font-bold text-text-primary"> Ranks history (Last 30 Days)</span>
                              <span className="text-text-secondary">Keyword shows positive signals on local business search intents.</span>
                            </div>
                            
                            {/* SVG historical sparkline */}
                            <svg className="w-56 h-12 text-primary-cyan" viewBox="0 0 100 30" fill="none">
                              <path 
                                d={`M0,${Math.max(5, kw.previous_rank % 25)} L25,18 L50,22 L75,${Math.max(5, (kw.current_rank + 3) % 25)} L100,${Math.max(2, kw.current_rank % 25)}`} 
                                stroke="currentColor" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                              />
                            </svg>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Keywords Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-panel-white border border-border-light rounded-lg shadow-2xl p-6">
            <h3 className="text-sm font-semibold text-text-primary border-b border-page-bg pb-3 mb-4 uppercase">
              Add Keywords to Track
            </h3>
            <form onSubmit={handleAddKeywords} className="space-y-4">
              <div className="space-y-1">
                <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">
                  Search keywords (one per line)
                </label>
                <textarea 
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="best dentist bangalore&#10;dental implant price indiranagar&#10;painless root canal clinic near me"
                  className="w-full border border-border-light rounded p-3 text-xs h-36 focus:outline-none focus:border-primary-cyan font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border-light pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-border-light rounded text-xs text-text-secondary hover:bg-page-bg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-3.5 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Track Keywords
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 5: Search Ads Manager
// ----------------------------------------------------
function SearchAds() {
  const { activeClient } = useApp();
  
  // Mock Ads list
  const adCampaigns = [
    { id: 'ad_1', name: `Local ${activeClient?.name || 'Client'} Search Ads`, budget: 50.00, spend: 320.00, clicks: 140, impressions: 2800, ctr: 5.0, conversions: 18, cpa: 17.77, status: 'active' },
    { id: 'ad_2', name: 'Competitor Conquest Brand Ads', budget: 35.00, spend: 180.00, clicks: 65, impressions: 1900, ctr: 3.42, conversions: 4, cpa: 45.00, status: 'active' },
    { id: 'ad_3', name: 'Weekend Promotion Banner Ads', budget: 20.00, spend: 150.00, clicks: 90, impressions: 4500, ctr: 2.0, conversions: 12, cpa: 12.50, status: 'paused' }
  ];

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Title */}
      <div>
        <h2 className="text-sm font-mono uppercase font-bold text-text-primary">Search Campaigns Manager</h2>
        <p className="text-xs text-text-secondary">Monitors active keyword bidding campaigns for Google Search Ads.</p>
      </div>

      {/* Ads List Table */}
      <div className="bg-panel-white border border-border-light rounded shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-page-bg/40 border-b border-border-light text-[10px] font-mono text-text-secondary uppercase">
              <th className="py-2.5 px-4 font-semibold">Campaign Name</th>
              <th className="py-2.5 px-4 font-semibold text-center">Status</th>
              <th className="py-2.5 px-4 font-semibold">Daily Budget</th>
              <th className="py-2.5 px-4 font-semibold">Spend</th>
              <th className="py-2.5 px-4 font-semibold">Clicks</th>
              <th className="py-2.5 px-4 font-semibold">Impressions</th>
              <th className="py-2.5 px-4 font-semibold">CTR</th>
              <th className="py-2.5 px-4 font-semibold">Conversions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-page-bg text-xs">
            {adCampaigns.map(ad => (
              <tr key={ad.id} className="hover:bg-[#F0FDFA] transition-colors">
                <td className="py-3 px-4 font-semibold text-text-primary">{ad.name}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    ad.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-page-bg text-text-secondary'
                  }`}>
                    {ad.status}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-text-secondary">${ad.budget.toFixed(2)}/day</td>
                <td className="py-3 px-4 font-mono text-text-secondary">${ad.spend.toFixed(2)}</td>
                <td className="py-3 px-4 font-mono text-text-primary">{ad.clicks}</td>
                <td className="py-3 px-4 font-mono text-text-secondary">{ad.impressions.toLocaleString()}</td>
                <td className="py-3 px-4 font-mono text-text-secondary">{ad.ctr.toFixed(2)}%</td>
                <td className="py-3 px-4 font-mono font-bold text-success-green">{ad.conversions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
