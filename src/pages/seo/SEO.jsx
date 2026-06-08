import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import AiWarningBanner from '../../components/AiWarningBanner';
import { 
  Globe, Plus, Sparkles, ChevronDown, ChevronRight, 
  ArrowUpRight, ArrowDownRight, FileText, CheckCircle2, 
  AlertTriangle, Play, Download, Search, AlertCircle, Loader2,
  X, ExternalLink, RefreshCw, Lightbulb, BarChart2
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
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef();

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

  const handleExportPDF = async () => {
    if (!audit || !printRef.current) return;
    try {
      setIsExporting(true);
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `seo-audit-${audit.url.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(printRef.current).save();
    } catch (e) {
      console.error('PDF generation failed', e);
      alert('Failed to generate PDF.');
    } finally {
      setIsExporting(false);
    }
  };

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
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`flex items-center gap-1.5 px-3 py-1.5 border border-border-light hover:border-border-medium rounded text-xs font-medium text-text-secondary hover:text-text-primary bg-panel-white transition-colors ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      <div ref={printRef} className="space-y-6 pb-6">
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
              finding.severity === 'critical' ? 'border-red-100 bg-red-50' :
              finding.severity === 'warning' ? 'border-amber-100 bg-amber-50' :
              'border-emerald-100 bg-emerald-50'
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
            <div key={`crit-${i}`} className="border border-red-100 rounded bg-red-50 p-4 space-y-1.5">
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
            <div key={`warn-${i}`} className="border border-amber-100 rounded bg-amber-50 p-4 space-y-1.5">
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

    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 4: Keyword Tracker page
// ----------------------------------------------------
function KeywordTracker() {
  const { activeClient, selectedClientId, agency, forceRefresh } = useApp();
  
  // Tabs: 'research' | 'tracked'
  const [activeTab, setActiveTab] = useState('research');
  
  // Research State
  const [seedKeyword, setSeedKeyword] = useState('');
  const [researchResults, setResearchResults] = useState(null); // { type: 'raw'|'clusters', data: [] }
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  
  // Tracked State
  const [trackedKeywords, setTrackedKeywords] = useState([]);
  const [expandedId, setExpandedId] = useState(null); // For sparkline
  
  // SERP Split-Screen State
  const [selectedKeywordForSerp, setSelectedKeywordForSerp] = useState(null);
  const [serpData, setSerpData] = useState(null);
  const [isSerpLoading, setIsSerpLoading] = useState(false);

  useEffect(() => {
    if (selectedClientId) {
      loadTrackedKeywords(selectedClientId);
      loadLatestResearch(selectedClientId);
    }
  }, [selectedClientId]);

  const loadTrackedKeywords = async (clientId) => {
    const { data } = await supabase.from('keyword_trackers').eq('client_id', clientId).order('created_at', { ascending: false });
    setTrackedKeywords(data || []);
  };

  const loadLatestResearch = async (clientId) => {
    const { data } = await supabase.from('keyword_research_results').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1);
    if (data && data.length > 0) {
      const dbRes = data[0];
      setSeedKeyword(dbRes.seed_keyword || '');
      if (dbRes.keywords_json && dbRes.keywords_json.clusters) {
        setResearchResults({ type: 'clusters', data: dbRes.keywords_json.clusters });
      } else if (dbRes.keywords_json && Array.isArray(dbRes.keywords_json)) {
        setResearchResults({ type: 'raw', data: dbRes.keywords_json });
      }
    } else {
      setResearchResults(null);
      setSeedKeyword('');
    }
  };

  const handleDiscover = async () => {
    if (!seedKeyword.trim()) return;
    setIsDiscovering(true);
    try {
      const res = await fetch('/api/edge/keyword-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: seedKeyword.trim() })
      });
      const json = await res.json();
      if (json.success) {
        setResearchResults({ type: 'raw', data: json.data });
        // Save to DB
        await supabase.from('keyword_research_results').insert([{
          agency_id: agency.id,
          client_id: selectedClientId,
          seed_keyword: seedKeyword.trim(),
          keywords_json: json.data
        }]);
      } else {
        alert('Failed to discover keywords: ' + json.error);
      }
    } catch (e) {
      alert('Error fetching keywords.');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleEnrich = async () => {
    if (!researchResults || researchResults.type !== 'raw') return;
    setIsEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('keyword-enrich', {
        body: {
          action: 'keyword-enrich',
          input: { industry: activeClient?.industry || 'local business', keywords: researchResults.data.slice(0, 50).join(', ') },
          agency_id: agency.id
        }
      });
      if (error) throw error;
      
      let parsed = typeof data.output === 'string' ? JSON.parse(data.output) : data.output;
      
      // Unwrapping logic
      if (parsed && typeof parsed.clusters === 'undefined') {
        const keys = Object.keys(parsed);
        if (keys.length === 1 && typeof parsed[keys[0]] === 'object') {
          parsed = parsed[keys[0]];
        }
      }

      if (parsed.clusters) {
        setResearchResults({ type: 'clusters', data: parsed.clusters });
        // Update DB
        await supabase.from('keyword_research_results').insert([{
          agency_id: agency.id,
          client_id: selectedClientId,
          seed_keyword: seedKeyword,
          keywords_json: parsed
        }]);
      }
    } catch (e) {
      alert('Failed to analyze keywords with AI.');
    } finally {
      setIsEnriching(false);
    }
  };

  const openSerp = async (keyword) => {
    setSelectedKeywordForSerp(keyword);
    setSerpData(null);
    setIsSerpLoading(true);
    try {
      const { getSERP } = await import('../../lib/supabase');
      const location = 'India'; // Default or from client
      const res = await getSERP(keyword, location, agency.id);
      if (res.success) {
        setSerpData({ ...res.text, cached: res.cached, fetched_at: res.fetched_at });
      } else {
        alert('SERP check failed: ' + res.text);
        setSelectedKeywordForSerp(null);
      }
    } catch (e) {
      alert('Error fetching SERP.');
      setSelectedKeywordForSerp(null);
    } finally {
      setIsSerpLoading(false);
    }
  };

  const closeSerp = () => {
    setSelectedKeywordForSerp(null);
    setSerpData(null);
  };

  const addToTracker = async (keyword) => {
    const newRow = {
      client_id: selectedClientId,
      keyword,
      current_rank: Math.floor(Math.random() * 80) + 10,
      previous_rank: Math.floor(Math.random() * 80) + 12,
      search_volume: Math.floor(Math.random() * 150) * 10 + 200,
      difficulty: Math.floor(Math.random() * 80) + 15,
      cpc: Number((Math.random() * 5).toFixed(2)),
      last_checked: new Date().toISOString()
    };
    await supabase.from('keyword_trackers').insert([newRow]);
    loadTrackedKeywords(selectedClientId);
    alert(`Added "${keyword}" to tracker!`);
  };

  const renderResearchTable = () => {
    if (!researchResults) {
      return (
        <div className="py-12 text-center text-text-secondary border border-border-light rounded bg-panel-white">
          Enter a seed keyword above and click Discover to find keywords.
        </div>
      );
    }

    if (researchResults.type === 'raw') {
      return (
        <div className="bg-panel-white border border-border-light rounded shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border-light flex justify-between items-center bg-page-bg/40">
            <span className="text-sm font-semibold">Found {researchResults.data.length} raw keywords</span>
            <button 
              onClick={handleEnrich} 
              disabled={isEnriching}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold disabled:opacity-50"
            >
              <Sparkles size={13} />
              {isEnriching ? 'Analyzing...' : 'Analyze with AI'}
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-page-bg text-xs">
                {researchResults.data.map((kw, idx) => (
                  <tr key={idx} className="hover:bg-[#F0FDFA]">
                    <td className="py-3 px-4 text-text-primary">{kw}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => openSerp(kw)} className="text-primary-cyan hover:underline mr-4 text-[11px] font-semibold">Check SERP</button>
                      <button onClick={() => addToTracker(kw)} className="text-text-secondary hover:text-text-primary text-[11px] font-semibold">Track</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (researchResults.type === 'clusters') {
      return (
        <div className="space-y-4">
          {researchResults.data.map((cluster, cidx) => (
            <div key={cidx} className="bg-panel-white border border-border-light rounded shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-page-bg/60 border-b border-border-light font-bold text-sm text-text-primary flex items-center gap-2">
                <ChevronDown size={16} className="text-text-secondary" />
                {cluster.cluster_name}
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-page-bg/20 border-b border-border-light text-[10px] font-mono text-text-secondary uppercase">
                    <th className="py-2.5 px-4 font-semibold">Search query</th>
                    <th className="py-2.5 px-4 font-semibold">Intent</th>
                    <th className="py-2.5 px-4 font-semibold">Competition</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Priority</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-page-bg text-xs">
                  {cluster.keywords.map((kw, kidx) => {
                    const compColor = kw.competition?.toLowerCase() === 'high' ? 'bg-error-red text-white' : kw.competition?.toLowerCase() === 'medium' ? 'bg-warning-amber text-black' : 'bg-success-green text-white';
                    const intentColor = kw.intent?.toLowerCase().includes('transactional') || kw.intent?.toLowerCase().includes('commercial') ? 'text-primary-cyan border-primary-cyan bg-cyan-50' : 'text-text-secondary border-border-light bg-page-bg';
                    return (
                      <tr key={kidx} className={`hover:bg-[#F0FDFA] transition-colors ${selectedKeywordForSerp === kw.keyword ? 'bg-[#F0FDFA] border-l-2 border-l-primary-cyan' : ''}`}>
                        <td className="py-3 px-4 font-semibold text-text-primary cursor-pointer" onClick={() => openSerp(kw.keyword)}>{kw.keyword}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${intentColor} uppercase`}>{kw.intent}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${compColor}`}>{kw.competition}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-text-primary">{kw.priority}/10</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => openSerp(kw.keyword)} className="text-primary-cyan hover:underline mr-3 text-[11px] font-semibold">SERP</button>
                          <button onClick={() => addToTracker(kw.keyword)} className="text-text-secondary hover:text-text-primary text-[11px] font-semibold">Track</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      );
    }
  };

  const renderTrackedTable = () => {
    const isSplit = !!selectedKeywordForSerp;
    return (
      <div className="bg-panel-white border border-border-light rounded shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-page-bg/40 border-b border-border-light text-[10px] font-mono text-text-secondary uppercase">
              <th className="py-2.5 px-4 font-semibold">Search query</th>
              <th className="py-2.5 px-4 font-semibold text-center">Ranks</th>
              <th className="py-2.5 px-4 font-semibold">Last Checked</th>
              {!isSplit && (
                <>
                  <th className="py-2.5 px-4 font-semibold">Search Volume</th>
                  <th className="py-2.5 px-4 font-semibold">Difficulty</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-page-bg text-xs">
            {trackedKeywords.length === 0 ? (
              <tr>
                <td colSpan={isSplit ? 3 : 6} className="py-12 text-center text-text-secondary">
                  No keywords tracked yet. Add from Research.
                </td>
              </tr>
            ) : (
              trackedKeywords.map(kw => {
                const rankChange = kw.previous_rank - kw.current_rank;
                const isExpanded = expandedId === kw.id && !isSplit;
                const isSelected = selectedKeywordForSerp === kw.keyword;
                return (
                  <React.Fragment key={kw.id}>
                    <tr 
                      className={`hover:bg-[#F0FDFA] transition-colors ${isSelected ? 'bg-[#F0FDFA] border-l-2 border-l-primary-cyan' : ''}`}
                    >
                      <td className="py-3 px-4 font-semibold text-text-primary cursor-pointer" onClick={() => !isSplit ? setExpandedId(isExpanded ? null : kw.id) : openSerp(kw.keyword)}>
                        <div className="flex items-center gap-1">
                          {!isSplit && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                          <span>{kw.keyword}</span>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-bold text-text-primary text-sm">{kw.current_rank}</span>
                          {rankChange > 0 ? (
                            <span className="text-success-green flex items-center font-mono text-[10px] font-bold">▲{rankChange}</span>
                          ) : rankChange < 0 ? (
                            <span className="text-error-red flex items-center font-mono text-[10px] font-bold">▼{Math.abs(rankChange)}</span>
                          ) : (
                            <span className="text-text-muted font-mono text-[10px] font-bold">-</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-text-muted">
                        {new Date(kw.last_checked).toLocaleDateString()}
                      </td>

                      {!isSplit && (
                        <>
                          <td className="py-3 px-4 font-mono text-text-secondary">{kw.search_volume.toLocaleString()} / mo</td>
                          <td className="py-3 px-4 w-32">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-page-bg h-2 rounded overflow-hidden">
                                <div 
                                  className={`h-full rounded ${kw.difficulty >= 60 ? 'bg-error-red' : kw.difficulty >= 35 ? 'bg-warning-amber' : 'bg-success-green'}`}
                                  style={{ width: `${kw.difficulty}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button onClick={(e) => { e.stopPropagation(); openSerp(kw.keyword); }} className="text-primary-cyan hover:underline mr-2 text-[11px] font-semibold">SERP</button>
                          </td>
                        </>
                      )}
                    </tr>

                    {/* Sparkline historical detail drawer */}
                    {isExpanded && !isSplit && (
                      <tr className="bg-[#ECFEFF]/20">
                        <td colSpan="6" className="py-4 px-12 border-b border-border-light">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5 text-xs">
                              <span className="font-bold text-text-primary"> Ranks history (Last 30 Days)</span>
                              <span className="text-text-secondary">Historical trend for "{kw.keyword}"</span>
                            </div>
                            <svg className="w-56 h-12 text-primary-cyan" viewBox="0 0 100 30" fill="none">
                              <path d={`M0,${Math.max(5, kw.previous_rank % 25)} L25,18 L50,22 L75,${Math.max(5, (kw.current_rank + 3) % 25)} L100,${Math.max(2, kw.current_rank % 25)}`} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
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
    );
  };

  const renderSerpPane = () => {
    if (!selectedKeywordForSerp) return null;

    return (
      <div className="w-full h-full bg-panel-white border border-border-light rounded shadow-lg overflow-hidden flex flex-col animate-slide-left">
        {/* SERP Header */}
        <div className="px-5 py-4 border-b border-border-light bg-page-bg/30 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
              <Search size={14} className="text-text-secondary" />
              "{selectedKeywordForSerp}"
            </h3>
            {serpData && serpData.cached && (
              <p className="text-[10px] text-text-muted mt-1">Cached • updated {Math.floor((new Date() - new Date(serpData.fetched_at)) / (1000 * 60 * 60 * 24))} days ago</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => openSerp(selectedKeywordForSerp)} 
              title="Force Refresh (Uses Sonar credits)"
              className="p-1.5 text-text-secondary hover:bg-page-bg rounded transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={isSerpLoading ? 'animate-spin text-primary-cyan' : ''} />
            </button>
            <button onClick={closeSerp} className="p-1.5 text-text-secondary hover:bg-page-bg rounded transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* SERP Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#F9FAFB]">
          {isSerpLoading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
              <RefreshCw size={24} className="animate-spin text-primary-cyan" />
              <p className="text-xs text-text-secondary font-mono">Running live Sonar SERP check...</p>
            </div>
          ) : serpData ? (
            <div className="space-y-6">
              {/* Rankings */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono text-text-secondary uppercase mb-3">Top 10 Rankings</h4>
                {serpData.results && serpData.results.map((res, i) => {
                  const url = res.url || (res.domain ? `https://${res.domain}` : `https://www.google.com/search?q=${res.domain}`);
                  return (
                    <div key={i} className="group bg-white border border-border-light hover:border-primary-cyan rounded p-3 shadow-sm transition-all flex gap-3">
                      <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${res.position <= 3 ? 'bg-primary-cyan text-white shadow-md' : 'bg-page-bg text-text-secondary'}`}>
                        {res.position}
                      </div>
                      <div className="flex-1 min-w-0">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1.5 truncate">
                          {res.page_title || res.domain}
                          <ExternalLink size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-700 font-mono truncate block mt-0.5 hover:underline">
                          {res.domain || url}
                        </a>
                        <p className="text-xs text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">
                          {res.summary}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Content Gaps */}
              {serpData.content_gaps && serpData.content_gaps.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-xs font-bold font-mono text-text-secondary uppercase mb-3 flex items-center gap-1.5">
                    <Lightbulb size={14} className="text-warning-amber" />
                    Content Gap Opportunities
                  </h4>
                  <div className="space-y-2">
                    {serpData.content_gaps.map((gap, i) => (
                      <div key={i} className="bg-amber-50 border border-amber-100 text-amber-900 text-xs p-3 rounded leading-relaxed">
                        {gap}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-sm text-text-secondary">Failed to load SERP data.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 font-sans animate-fade-in select-none">
      
      {/* Title / Action bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-border-light pb-4">
        <div>
          <h2 className="text-sm font-mono uppercase font-bold text-text-primary">Keyword Engine</h2>
          <p className="text-xs text-text-secondary">Discover, analyze, and track keywords with live SERP insights.</p>
        </div>

        <div className="flex items-center gap-2 bg-panel-white p-1 rounded-lg border border-border-light">
          <button 
            onClick={() => setActiveTab('research')}
            className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${activeTab === 'research' ? 'bg-primary-cyan text-white shadow' : 'text-text-secondary hover:text-text-primary hover:bg-page-bg'} cursor-pointer`}
          >
            Research
          </button>
          <button 
            onClick={() => setActiveTab('tracked')}
            className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${activeTab === 'tracked' ? 'bg-primary-cyan text-white shadow' : 'text-text-secondary hover:text-text-primary hover:bg-page-bg'} cursor-pointer`}
          >
            Tracked ({trackedKeywords.length})
          </button>
        </div>
      </div>

      {activeTab === 'research' && (
        <div className="bg-panel-white border border-border-light rounded-lg p-4 flex gap-3 shadow-sm mb-4">
          <input 
            type="text" 
            placeholder="Enter seed keyword (e.g. 'plumber austin')"
            value={seedKeyword}
            onChange={e => setSeedKeyword(e.target.value)}
            className="flex-1 border border-border-light rounded px-3 text-sm focus:outline-none focus:border-primary-cyan"
            onKeyDown={e => e.key === 'Enter' && handleDiscover()}
          />
          <button 
            onClick={handleDiscover}
            disabled={isDiscovering || !seedKeyword.trim()}
            className="px-5 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            {isDiscovering ? 'Discovering...' : 'Discover Keywords'}
          </button>
        </div>
      )}

      {/* Split Screen Layout Container */}
      <div className="flex flex-col lg:flex-row gap-4 h-[750px]">
        {/* Left Pane (Table) */}
        <div className={`transition-all duration-300 ease-in-out h-full overflow-y-auto ${selectedKeywordForSerp ? 'lg:w-[55%]' : 'w-full'}`}>
          {activeTab === 'research' ? renderResearchTable() : renderTrackedTable()}
        </div>

        {/* Right Pane (SERP) */}
        {selectedKeywordForSerp && (
          <div className="transition-all duration-300 ease-in-out lg:w-[45%] h-full">
            {renderSerpPane()}
          </div>
        )}
      </div>

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
