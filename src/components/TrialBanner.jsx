import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { X, Clock, AlertTriangle } from 'lucide-react';

export default function TrialBanner() {
  const { agency } = useApp();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('trial_banner_dismissed') === 'true');

  if (!agency) return null;
  if (agency.plan === 'premium') return null;

  const trialEndsAt = new Date(agency.trial_ends_at);
  const now = new Date();
  const daysLeft = Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24));

  // Determine state
  const isExpired = daysLeft <= 0;
  const isUrgent = !isExpired && daysLeft <= 3;
  
  // Non-dismissible if <= 3 days left
  const canDismiss = !isUrgent && !isExpired;

  if (dismissed && canDismiss) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('trial_banner_dismissed', 'true');
    setDismissed(true);
  };

  let bgClass = "bg-primary-cyan/10 border-primary-cyan/20";
  let textClass = "text-primary-cyan";
  let icon = <Clock size={16} className="text-primary-cyan" />;
  let message = <span className="text-sm font-medium text-text-primary">⏳ <span className="font-bold">{daysLeft}</span> days left in your free trial</span>;

  if (isExpired) {
    bgClass = "bg-red-50 border-error-red/20";
    textClass = "text-error-red";
    icon = <AlertTriangle size={16} className="text-error-red" />;
    message = <span className="text-sm font-medium text-error-red">Your free trial has ended</span>;
  } else if (isUrgent) {
    bgClass = "bg-warning-amber/10 border-warning-amber/20";
    textClass = "text-warning-amber";
    icon = <Clock size={16} className="text-warning-amber animate-pulse" />;
    message = <span className="text-sm font-medium text-text-primary">⏳ <span className="font-bold">{daysLeft}</span> days left in your free trial</span>;
  }

  // Use a dark-mode friendly generic class for background if not overridden by the above specific colors
  // Wait, the user specifically mentioned:
  // "cyan-tinted background (#ECFEFF light / dark-friendly tint in dark mode)"
  // Our generic bg-[#ECFEFF] is overridden in dark mode in index.css! So let's use it.
  
  if (!isExpired && !isUrgent) {
    bgClass = "bg-[#ECFEFF] border-[#06B6D41A]";
  }

  return (
    <div className={`flex items-center justify-between p-3 mb-4 border rounded-lg shadow-sm ${bgClass}`}>
      <div className="flex items-center gap-3">
        {icon}
        {message}
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/billing')}
          className={`px-4 py-1.5 rounded text-xs font-bold text-white transition-colors shadow-sm ${isExpired ? 'bg-error-red hover:bg-red-600' : 'bg-primary-cyan hover:bg-primary-cyan-hover'}`}
        >
          Upgrade Now
        </button>
        {canDismiss && (
          <button onClick={handleDismiss} className="text-text-secondary hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
