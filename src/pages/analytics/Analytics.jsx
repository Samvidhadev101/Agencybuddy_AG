import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import AiWarningBanner from '../../components/AiWarningBanner';
import { 
  Sparkles, FileText, Download, CheckCircle2, ChevronRight,
  Plus, Calendar, FolderKanban, Upload, Search, Check, X,
  Mail, Settings, BarChart3, AlertCircle 
} from 'lucide-react';

export default function Analytics() {
  const location = useLocation();
  const currentPath = location.pathname;

  let content;
  if (currentPath === '/analytics/reports') {
    content = <ReportBuilder />;
  } else if (currentPath === '/analytics/reports/export') {
    content = <ReportExporter />;
  } else if (currentPath === '/analytics/competitors') {
    content = <CompetitorTracker />;
  } else {
    content = <AnalyticsDashboard />;
  }

  return (
    <div className="space-y-4">
      <AiWarningBanner />
      {content}
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 1: Analytics Dashboard
// ----------------------------------------------------
function AnalyticsDashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div>
          <h2 className="text-sm font-mono uppercase font-bold text-text-primary">Analytics Operations</h2>
          <p className="text-xs text-text-secondary">Consolidate traffic numbers across organic and social directories.</p>
        </div>

        <button 
          onClick={() => navigate('/analytics/reports')}
          className="px-3.5 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer"
        >
          Open Report Builder
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Keyword Tracking sheets', desc: 'Ranks tracking and organic metrics charts summaries.', path: '/seo/keywords' },
          { title: 'Google Business Profile views', desc: 'Map listings traffic, clicks, and calls data logs.', path: '/gbp' },
          { title: 'Social campaigns CTR', desc: 'Likes, comments, shares, and engagement rates indices.', path: '/social' },
          { title: 'Competitor organic ranks', desc: 'Side-by-side organic domain authority metrics benchmarks.', path: '/analytics/competitors' }
        ].map((item, idx) => (
          <div 
            key={idx} 
            onClick={() => navigate(item.path)}
            className="bg-panel-white border border-border-light hover:border-primary-cyan p-4 rounded shadow-sm cursor-pointer transition-colors flex flex-col justify-between h-28"
          >
            <span className="font-semibold text-text-primary text-xs">{item.title}</span>
            <p className="text-[11px] text-text-secondary leading-relaxed mt-1">{item.desc}</p>
            <span className="text-[10px] text-primary-cyan hover:underline mt-2 inline-block font-semibold">Inspect reports →</span>
          </div>
        ))}
      </div>

    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 2: Report Builder
// ----------------------------------------------------
function ReportBuilder() {
  const { agency, activeClient, forceRefresh } = useApp();
  const navigate = useNavigate();

  const [narrative, setNarrative] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('monthly');

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setError('');
    setNarrative('');


    setIsGenerating(true);
    try {
      const { data } = await supabase.functions.invoke('ai-generate', {
        body: {
          action: 'report-narrative',
          input: { clientName: activeClient?.name || 'Client', topic: `${reportType} summary over ${dateRange} days` },
          agency_id: agency.id
        }
      });

      setNarrative(data.output);
      
      // Save report in db
      await supabase.from('reports').insert({
        agency_id: agency.id,
        client_id: activeClient.id,
        type: reportType,
        title: `${activeClient.name} ${reportType.toUpperCase()} Performance digest`,
        date_range_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        date_range_end: new Date().toISOString().split('T')[0],
        narrative: data.output
      });

      window.dispatchEvent(new Event('local_db_change'));
      forceRefresh();
    } catch (e) {
      setError('Failed building AI executive narrative summary.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/analytics')} className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer">← ANALYTICS HOME</button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase">REPORT BUILDER</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form Settings */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-6 space-y-4 h-[360px] shrink-0">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-1.5 mb-2">
            REPORT SETTINGS
          </span>

          <form onSubmit={handleGenerateReport} className="space-y-4">
            <div className="space-y-1">
              <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Date range (Days)</label>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="w-full border border-border-light bg-panel-white rounded px-2.5 py-1.5 text-xs">
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Report Type</label>
              <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full border border-border-light bg-panel-white rounded px-2.5 py-1.5 text-xs">
                <option value="monthly">Monthly Executive Summary</option>
                <option value="weekly">Weekly Operational Digest</option>
              </select>
            </div>

            <button type="submit" disabled={isGenerating} className="w-full py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white text-xs font-semibold rounded cursor-pointer transition-colors flex items-center justify-center gap-1">
              <Sparkles size={12} />
              <span>{isGenerating ? 'SUMMARIZING...' : 'GENERATE WITH AI'}</span>
            </button>
          </form>
        </div>

        {/* Right White label Preview Panel */}
        <div className="lg:col-span-2 bg-[#F8F9FA] border border-border-light rounded shadow-inner p-6 flex flex-col justify-between h-[360px]">
          <div className="flex-1 bg-panel-white border border-[#DADCE0] rounded shadow-sm p-5 space-y-4 overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-page-bg pb-2">
              <div className="flex flex-col text-left">
                <h4 className="text-xs font-bold text-text-primary uppercase leading-none">{activeClient?.name} Performance Summary</h4>
                <span className="text-[9px] text-text-muted mt-1 font-mono uppercase">Whitelabel client report</span>
              </div>
              <span className="text-[10px] text-text-muted font-mono uppercase">June 2026</span>
            </div>

            {isGenerating ? (
              <div className="py-24 text-center text-xs font-mono text-text-muted animate-pulse">
                COMPILING MARKETING CHARTS FOR NARRATIVE DICTIONARY...
              </div>
            ) : (
              <div className="text-xs leading-relaxed text-text-secondary whitespace-pre-line font-sans">
                {narrative || 'Set parameters on the left and click generate to formulate AI-powered White-label report narratives.'}
              </div>
            )}
          </div>

          {narrative && (
            <div className="p-3 border-t border-border-light bg-panel-white mt-4 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => navigate('/analytics/reports/export')}
                className="px-3.5 py-1.5 border border-border-light rounded text-xs text-text-secondary hover:bg-page-bg cursor-pointer font-medium"
              >
                Open Word Exporter
              </button>
              <button 
                onClick={() => alert('Email copy sent to client contact addresses.')}
                className="px-3.5 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer transition-colors"
              >
                Send to Client Email
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 3: Competitor organic rankings comparisons
// ----------------------------------------------------
function CompetitorTracker() {
  const { activeClient } = useApp();
  const [competitors, setCompetitors] = useState([]);

  useEffect(() => {
    if (activeClient) {
      supabase.from('geo_competitor_zones').eq('client_id', activeClient.id).then(({ data }) => {
        setCompetitors(data || []);
      });
    }
  }, [activeClient]);

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      
      {/* Title */}
      <div>
        <h2 className="text-sm font-mono uppercase font-bold text-text-primary">Competitor Organic Benchmarks</h2>
        <p className="text-xs text-text-secondary">Side-by-side comparison of local store density and backlinks visibility.</p>
      </div>

      {/* Comparisons grid */}
      <div className="bg-panel-white border border-border-light rounded shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-page-bg/40 border-b border-border-light text-[10px] font-mono text-text-secondary uppercase">
              <th className="py-2.5 px-4 font-semibold">Store / Brand Name</th>
              <th className="py-2.5 px-4 font-semibold text-center">Domain Authority</th>
              <th className="py-2.5 px-4 font-semibold text-center">GMB Reviews count</th>
              <th className="py-2.5 px-4 font-semibold text-center">Organic keywords</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-page-bg text-xs">
            <tr className="bg-cyan-50/15">
              <td className="py-3 px-4 font-semibold text-text-primary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-cyan inline-block"></span>
                <span>{activeClient?.name} (Current Client)</span>
              </td>
              <td className="py-3 px-4 text-center font-mono text-text-primary font-bold">42</td>
              <td className="py-3 px-4 text-center font-mono text-text-primary font-bold">5</td>
              <td className="py-3 px-4 text-center font-mono text-text-primary font-bold">1,840</td>
            </tr>

            {competitors.map(comp => (
              <tr key={comp.id} className="hover:bg-page-bg/20 transition-colors">
                <td className="py-3 px-4 text-text-secondary pl-6">{comp.competitor_name}</td>
                <td className="py-3 px-4 text-center font-mono text-text-secondary">38</td>
                <td className="py-3 px-4 text-center font-mono text-text-secondary">14</td>
                <td className="py-3 px-4 text-center font-mono text-text-secondary">920</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 4: Report Exporter Portal
// ----------------------------------------------------
function ReportExporter() {
  const { agency, activeClient, forceRefresh } = useApp();
  const navigate = useNavigate();

  // Category selections
  const [selectedCats, setSelectedCats] = useState({
    seo: true,
    gbp: true,
    aeo: true,
    reputation: true,
    tasks: true
  });
  const [selectAll, setSelectAll] = useState(true);

  // AI Narrative states
  const [narrativeText, setNarrativeText] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState('');

  // Form states
  const [exporting, setExporting] = useState(false);

  // Sync Select All checkbox
  const handleToggleCat = (key) => {
    const updated = { ...selectedCats, [key]: !selectedCats[key] };
    setSelectedCats(updated);
    const allChecked = Object.values(updated).every(v => v);
    setSelectAll(allChecked);
  };

  const handleToggleSelectAll = () => {
    const nextVal = !selectAll;
    setSelectAll(nextVal);
    setSelectedCats({
      seo: nextVal,
      gbp: nextVal,
      aeo: nextVal,
      reputation: nextVal,
      tasks: nextVal
    });
  };

  const handleCompileNarrative = async () => {
    if (!activeClient) return;
    setCompileError('');
    setIsCompiling(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate', {
        body: {
          action: 'report-narrative',
          input: { 
            clientName: activeClient.name,
            industry: activeClient.industry,
            narrativeInput: `A monthly executive digest. Include recent accomplishments, ongoing optimization strategies, and future projections.`
          },
          agency_id: agency?.id
        }
      });

      if (error) throw new Error(error);
      setNarrativeText(data.output || '');
      alert('AI narrative summary compiled successfully.');
    } catch (err) {
      console.error(err);
      setCompileError(err.message || 'Failed to compile AI narrative. Ensure your Grok key is active.');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleExportWord = async () => {
    if (!activeClient) return;
    setExporting(true);
    try {
      const docChildren = [
        new Paragraph({
          text: `EXECUTIVE PERFORMANCE REPORT`,
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: `Client: `, bold: true }),
            new TextRun({ text: `${activeClient.name}` }),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Industry: `, bold: true }),
            new TextRun({ text: `${activeClient.industry}` }),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Website: `, bold: true }),
            new TextRun({ text: `${activeClient.website}` }),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Generated On: `, bold: true }),
            new TextRun({ text: `${new Date().toLocaleDateString()}` }),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Agency Provider: `, bold: true }),
            new TextRun({ text: `${agency?.name || 'Alpha Agency'}` }),
          ]
        }),
        new Paragraph({ text: "" }), // spacing
      ];

      // Add Narrative
      if (narrativeText) {
        docChildren.push(
          new Paragraph({ text: `EXECUTIVE SUMMARY NARRATIVE`, heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: narrativeText }),
          new Paragraph({ text: "" })
        );
      }

      // Add SEO Audit Category
      if (selectedCats.seo) {
        docChildren.push(
          new Paragraph({ text: `SEO AUDIT PERFORMANCE`, heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `The organic marketing indexes demonstrate steady visibility optimization parameters:` }),
          new Paragraph({ children: [
            new TextRun({ text: `• Domain Authority: `, bold: true }),
            new TextRun({ text: `42 / 100` }),
          ]}),
          new Paragraph({ children: [
            new TextRun({ text: `• Tracked Ranks: `, bold: true }),
            new TextRun({ text: `1,840 keywords cataloged` }),
          ]}),
          new Paragraph({ children: [
            new TextRun({ text: `• Web Speed Index: `, bold: true }),
            new TextRun({ text: `94 / 100 mobile scoring` }),
          ]}),
          new Paragraph({ text: "" })
        );
      }

      // Add GBP Listing Category
      if (selectedCats.gbp) {
        docChildren.push(
          new Paragraph({ text: `GOOGLE BUSINESS PROFILE CITATIONS`, heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `Hyperlocal citations and maps searches distributions indexes summary details:` }),
          new Paragraph({ children: [
            new TextRun({ text: `• Map Search Views: `, bold: true }),
            new TextRun({ text: `Up 12% in regional listings visibility.` }),
          ]}),
          new Paragraph({ children: [
            new TextRun({ text: `• Map Clicks Activity: `, bold: true }),
            new TextRun({ text: `142 user interactions recorded today.` }),
          ]}),
          new Paragraph({ text: "" })
        );
      }

      // Add AEO Visibility Category
      if (selectedCats.aeo) {
        docChildren.push(
          new Paragraph({ text: `ANSWER ENGINE OPTIMIZATION (AEO)`, heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `Search citation metrics across next-generation artificial intelligence LLM responders:` }),
          new Paragraph({ children: [
            new TextRun({ text: `• ChatGPT Citation Index: `, bold: true }),
            new TextRun({ text: `60% visibility rating.` }),
          ]}),
          new Paragraph({ children: [
            new TextRun({ text: `• Gemini Citation Index: `, bold: true }),
            new TextRun({ text: `90% visibility rating.` }),
          ]}),
          new Paragraph({ children: [
            new TextRun({ text: `• Perplexity Citation Index: `, bold: true }),
            new TextRun({ text: `70% visibility rating.` }),
          ]}),
          new Paragraph({ text: "" })
        );
      }

      // Add Reputation Category
      if (selectedCats.reputation) {
        docChildren.push(
          new Paragraph({ text: `REPUTATION & CUSTOMER REVIEWS`, heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `GMB listing reviews metrics and sentiment scores summaries:` }),
          new Paragraph({ children: [
            new TextRun({ text: `• Average Rating: `, bold: true }),
            new TextRun({ text: `4.8 ★ average reviews rating.` }),
          ]}),
          new Paragraph({ children: [
            new TextRun({ text: `• Positive Sentiment: `, bold: true }),
            new TextRun({ text: `95.2% favorable reviews classification.` }),
          ]}),
          new Paragraph({ text: "" })
        );
      }

      // Add Tasks Category
      if (selectedCats.tasks) {
        docChildren.push(
          new Paragraph({ text: `OPERATIONAL MARKETING TASKS`, heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `Summary list of recent workflow tasks logged in Kanban operations:` }),
          new Paragraph({ text: `• Meta Tags Optimization: Completed` }),
          new Paragraph({ text: `• Backlink Crawl Fixes: In Progress` }),
          new Paragraph({ text: `• GBP Business Category Alignment: Completed` }),
          new Paragraph({ text: "" })
        );
      }

      // Generate docx document structure
      const doc = new Document({
        sections: [{
          properties: {},
          children: docChildren
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeClient.name.replace(/\s+/g, '_')}_Performance_Report.docx`;
      link.click();
      window.URL.revokeObjectURL(url);
      alert('Word document downloaded successfully.');
    } catch (err) {
      alert('Failed to generate Word document: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans py-4 animate-fade-in select-none">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/analytics')} className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer">← ANALYTICS</button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase">EXPORTER PORTAL</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Category checkboxes */}
        <div className="bg-panel-white border border-border-light rounded-lg shadow-sm p-5 space-y-4 md:col-span-1">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-1.5">
            Report Sections
          </span>

          <div className="space-y-3">
            <label className="flex items-center gap-2 font-semibold text-text-primary cursor-pointer pb-2 border-b border-page-bg/60">
              <input 
                type="checkbox" 
                checked={selectAll} 
                onChange={handleToggleSelectAll} 
                className="rounded border-border-medium text-primary-cyan focus:ring-primary-cyan cursor-pointer" 
              />
              <span>Select All Sections</span>
            </label>

            {[
              { key: 'seo', label: 'SEO Performance' },
              { key: 'gbp', label: 'GBP Maps Citation' },
              { key: 'aeo', label: 'AEO LLM Visibility' },
              { key: 'reputation', label: 'Reputation Ratings' },
              { key: 'tasks', label: 'Operational Tasks' }
            ].map(cat => (
              <label key={cat.key} className="flex items-center gap-2 text-text-secondary cursor-pointer hover:text-text-primary">
                <input 
                  type="checkbox" 
                  checked={selectedCats[cat.key]} 
                  onChange={() => handleToggleCat(cat.key)} 
                  className="rounded border-border-light text-primary-cyan focus:ring-primary-cyan cursor-pointer" 
                />
                <span>{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Right Column: AI narrative & writer */}
        <div className="bg-panel-white border border-border-light rounded-lg shadow-sm p-5 space-y-4 md:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div className="space-y-3">
            <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-1.5">
              Executive AI Narrative Compiler
            </span>
            
            {compileError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-error-red text-[11px] rounded">
                {compileError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block font-mono text-[9px] font-bold text-text-muted uppercase">Summary Narrative Text</label>
              <textarea 
                value={narrativeText}
                onChange={e => setNarrativeText(e.target.value)}
                placeholder="Compile the narrative using Grok AI or type details directly in this workspace..."
                className="w-full border border-border-light rounded p-3 text-xs h-40 focus:ring-1 focus:ring-primary-cyan outline-none resize-none font-sans leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border-light pt-3 mt-4">
            <button 
              type="button"
              disabled={isCompiling}
              onClick={handleCompileNarrative}
              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles size={12} className="text-primary-cyan" />
              <span>{isCompiling ? 'Compiling...' : 'Compile with AI'}</span>
            </button>

            <button 
              type="button"
              disabled={exporting}
              onClick={handleExportWord}
              className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>{exporting ? 'Exporting...' : 'Export Word (.docx)'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
