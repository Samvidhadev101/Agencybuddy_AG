import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { 
  CreditCard, Sparkles, CheckCircle2, ChevronRight,
  Plus, Calendar, FolderKanban, Upload, Search, Check, X,
  ShieldAlert, RefreshCw, BarChart3, AlertCircle 
} from 'lucide-react';

export default function Billing() {
  const location = useLocation();
  const currentPath = location.pathname;

  return <BillingDashboard />;
}

// ----------------------------------------------------
// Sub-Page 1: Billing Dashboard
// ----------------------------------------------------
function BillingDashboard() {
  const { agency, forceRefresh } = useApp();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    supabase.from('invoices').order('created_at', { ascending: false }).then(({ data }) => {
      setInvoices(data || []);
    });
  }, []);

  const handleAddSlot = async () => {
    if (confirm('Add 1 additional client slot for $50/mo?')) {
      alert('Slot added! Your monthly bill is updated and client slot limit incremented.');
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Plan card */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-5 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] font-bold text-text-secondary uppercase">Active Agency Plan</span>
              <h4 className="font-bold text-text-primary text-base mt-1">Premium Workspace</h4>
            </div>
            <span className="bg-[#ECFEFF] text-primary-cyan border border-[#06B6D433] text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
              ACTIVE
            </span>
          </div>

          <div className="flex justify-between items-baseline pt-4 border-t border-page-bg">
            <span className="text-xl font-bold text-text-primary font-mono">$99 / mo</span>
            <button 
              onClick={() => {
                // Trigger exit questionnaire gate
                window.dispatchEvent(new CustomEvent('trigger_exit_gate', { detail: { type: 'cancel_subscription' } }));
              }}
              className="text-[10px] text-error-red hover:underline font-semibold cursor-pointer"
            >
              Cancel Subscription
            </button>
          </div>
        </div>

        {/* Client Slots */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-5 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] font-bold text-text-secondary uppercase">Client slot usage</span>
              <h4 className="font-bold text-text-primary text-base mt-1">3 / 3 Slots occupied</h4>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-page-bg">
            <div className="w-24 bg-page-bg h-2 rounded overflow-hidden">
              <div className="bg-primary-cyan h-full" style={{ width: '100%' }} />
            </div>
            <button 
              onClick={handleAddSlot}
              className="text-[10px] text-primary-cyan hover:underline font-semibold cursor-pointer"
            >
              + Add Slot (+$50)
            </button>
          </div>
        </div>

        {/* AI Usage Info */}
        <div className="bg-dark-panel border border-dark-surface rounded shadow-lg p-5 flex flex-col justify-between h-36 text-white">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-primary-cyan font-bold uppercase">AI USAGE</span>
              <h4 className="font-bold text-white text-sm font-sans mt-2 leading-tight">
                AI features are unlimited and powered by your own OpenRouter API key.
              </h4>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-dark-surface mt-2">
            <span className="text-[9px] text-text-muted">Billed directly by OpenRouter</span>
            <button 
              onClick={() => navigate('/settings')}
              className="bg-[#06B6D433] border border-[#06B6D466] hover:bg-primary-cyan text-primary-cyan hover:text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
            >
              Manage AI Key →
            </button>
          </div>
        </div>

      </div>

      {/* Payment History Invoices */}
      <div className="bg-panel-white border border-border-light rounded shadow-sm p-6">
        <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-2 mb-4">
          Invoice Payment logs history
        </span>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-page-bg/40 border-b border-border-light text-[9px] font-mono text-text-secondary uppercase">
              <th className="py-2.5 px-4 font-semibold">Description</th>
              <th className="py-2.5 px-4 font-semibold text-center">Status</th>
              <th className="py-2.5 px-4 font-semibold">Date</th>
              <th className="py-2.5 px-4 font-semibold text-right">Amount (USD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-page-bg">
            {invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-page-bg/20 transition-colors">
                <td className="py-3 px-4 font-semibold text-text-primary">
                  <div className="flex flex-col gap-0.5">
                    <span>{inv.description}</span>
                    <span className="text-[10px] text-text-muted font-mono">{inv.razorpay_payment_id || 'N/A'}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                    {inv.status}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-text-secondary">
                  {new Date(inv.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-text-primary">
                  ${Number(inv.amount_usd).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

