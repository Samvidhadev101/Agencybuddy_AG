import ClientAvatar from '../ClientAvatar';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, Share2, FileText, Mail, Star, CheckSquare, Zap, Eye, BarChart3,
  ArrowUp, ArrowDown, AlertTriangle, ArrowRight
} from 'lucide-react';

const getHealthColors = (health) => {
  switch (health) {
    case 'URGENT':
      return { dot: 'bg-error-red', text: 'text-error-red' };
    case 'NEEDS ATTENTION':
      return { dot: 'bg-warning-amber', text: 'text-warning-amber' };
    default:
      return { dot: 'bg-success-green', text: 'text-success-green' };
  }
};

const getSignalColorClass = (type) => {
  switch (type) {
    case 'green': return 'text-success-green';
    case 'amber': return 'text-warning-amber';
    case 'red': return 'text-error-red';
    default: return 'text-text-muted';
  }
};

const getSignalBgClass = (type) => {
  switch (type) {
    case 'green': return 'bg-success-green/10';
    case 'amber': return 'bg-warning-amber/10';
    case 'red': return 'bg-error-red/10';
    default: return 'bg-page-bg';
  }
};

export default function ClientCard({ client, health, signals, lastUpdated }) {
  const navigate = useNavigate();
  const { dot, text } = getHealthColors(health);

  const topSignals = signals.slice(0, 5);
  const remainingCount = Math.max(0, signals.length - 5);

  const handleCardClick = (e) => {
    // Prevent navigation if a button was clicked
    if (e.target.closest('button')) return;
    navigate(`/clients/${client.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-panel-white border border-border-light rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-5 cursor-pointer transition-all duration-200 hover:border-[#06B6D4] hover:-translate-y-0.5 flex flex-col group h-full"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {client.logo_url ? (
            <img src={client.logo_url} alt={client.name} className="w-10 h-10 rounded-full object-cover border border-border-light" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-cyan/10 text-primary-cyan flex items-center justify-center font-bold text-lg border border-primary-cyan/20">
              {client.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-sans font-semibold text-[16px] text-text-primary leading-tight group-hover:text-primary-cyan transition-colors">
              {client.name}
            </h3>
            <p className="font-mono text-[11px] text-text-muted mt-0.5 uppercase tracking-wider">
              {client.industry || 'General'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${text}`}>
            {health}
          </span>
          <div className={`w-3 h-3 rounded-full ${dot} shadow-sm`} />
        </div>
      </div>

      {/* Card Body - Signal Rows */}
      <div className="flex-1 space-y-2.5">
        {topSignals.length > 0 ? (
          topSignals.map((signal, idx) => (
            <div key={idx} className="flex items-center justify-between group/row hover:bg-page-bg/30 p-1 -mx-1 rounded transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">{signal.icon}</span>
                <span className="font-sans text-[13px] text-text-primary">{signal.text}</span>
              </div>
              <div className="flex items-center justify-end min-w-[24px]">
                {signal.indicator}
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full min-h-[100px] text-[13px] text-text-muted font-sans italic bg-page-bg/20 rounded border border-dashed border-border-light">
            No active signals
          </div>
        )}

        {remainingCount > 0 && (
          <div className="text-[12px] text-primary-cyan hover:underline font-medium mt-2 pt-1">
            +{remainingCount} more update{remainingCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-5 pt-4 border-t border-border-light flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}
            className="w-8 h-8 rounded bg-page-bg text-text-secondary hover:bg-primary-cyan hover:text-white flex items-center justify-center transition-colors"
            title="View Details"
          >
            <ArrowRight size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/seo/audit`); }}
            className="w-8 h-8 rounded bg-page-bg text-text-secondary hover:bg-primary-cyan hover:text-white flex items-center justify-center transition-colors"
            title="Run Audit"
          >
            <Zap size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/social/compose`); }}
            className="w-8 h-8 rounded bg-page-bg text-text-secondary hover:bg-primary-cyan hover:text-white flex items-center justify-center transition-colors"
            title="Create Post"
          >
            <Share2 size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/analytics/reports`); }}
            className="w-8 h-8 rounded bg-page-bg text-text-secondary hover:bg-primary-cyan hover:text-white flex items-center justify-center transition-colors"
            title="Generate Report"
          >
            <BarChart3 size={14} />
          </button>
        </div>
        <span className="font-mono text-[10px] text-text-muted">
          Last updated: {lastUpdated}
        </span>
      </div>
    </div>
  );
}
