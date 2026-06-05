import React, { useState, useEffect } from 'react';
import { Star, AlertTriangle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function ExitFeedbackGate() {
  const { agency, user } = useApp();
  const [visible, setVisible] = useState(false);
  const [exitType, setExitType] = useState('cancel_subscription'); // cancel_subscription, trial_expired, trial_cancel
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  // Questionnaire form states
  const [reason, setReason] = useState('too_expensive');
  const [reasonDetail, setReasonDetail] = useState('');
  const [missingFeature, setMissingFeature] = useState('');
  const [competitorName, setCompetitorName] = useState('');
  const [priceWillingToPay, setPriceWillingToPay] = useState('0-20');
  const [satisfactionRating, setSatisfactionRating] = useState(5);
  const [wouldReturn, setWouldReturn] = useState('maybe');
  const [additionalComments, setAdditionalComments] = useState('');

  useEffect(() => {
    const handleTrigger = (e) => {
      if (e.detail?.type) {
        setExitType(e.detail.type);
      }
      setStep(1);
      setSubmitted(false);
      setVisible(true);
    };
    
    window.addEventListener('trigger_exit_gate', handleTrigger);
    return () => window.removeEventListener('trigger_exit_gate', handleTrigger);
  }, []);

  if (!visible) return null;

  const handleSubmit = async () => {
    try {
      // Save feedback in exit_feedback table
      const feedbackRow = {
        agency_id: agency?.id || 'age_default_id',
        user_id: user?.id || 'usr_boss_id',
        exit_type: exitType,
        reason,
        reason_detail: reasonDetail || null,
        missing_feature: missingFeature || null,
        competitor_name: competitorName || null,
        price_willing_to_pay: priceWillingToPay,
        satisfaction_rating: satisfactionRating,
        would_return: wouldReturn,
        additional_comments: additionalComments || null
      };

      await supabase.from('exit_feedback').insert(feedbackRow);
      setSubmitted(true);
    } catch (e) {
      console.error('Failed submitting exit feedback:', e);
      setSubmitted(true); // fall through in mock
    }
  };

  const handleReactivate = () => {
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 bg-[#111827]/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 font-sans select-none animate-fade-in">
      <div className="w-full max-w-[520px] bg-panel-white rounded-lg border border-border-light shadow-2xl p-8 overflow-hidden relative">
        
        {!submitted ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="text-warning-amber" size={20} />
              <h2 className="text-lg font-semibold text-text-primary">
                {exitType === 'trial_expired' ? 'Your trial has expired' : 'Cancel Subscription'}
              </h2>
            </div>

            {/* Step Progress indicators */}
            <div className="flex gap-1.5 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <div 
                  key={s} 
                  className={`h-1.5 flex-1 rounded-sm transition-colors duration-200 ${
                    s === step ? 'bg-primary-cyan' : s < step ? 'bg-primary-cyan/40' : 'bg-page-bg'
                  }`}
                />
              ))}
            </div>

            {/* STEP 1: Why are you leaving? */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-xs font-mono uppercase font-bold text-text-secondary">
                  STEP 1: Why are you leaving?
                </p>
                <div className="space-y-2">
                  {[
                    { val: 'too_expensive', label: 'Too expensive / Budget constraints' },
                    { val: 'missing_features', label: 'Missing critical features' },
                    { val: 'too_complex', label: 'Too complex to set up or use' },
                    { val: 'found_alternative', label: 'Found a better alternative tool' },
                    { val: 'not_needed', label: 'No longer need agency operations dashboard' },
                    { val: 'bad_experience', label: 'Bad support or technical issues' },
                    { val: 'other', label: 'Other reason' }
                  ].map((opt) => (
                    <label key={opt.val} className="flex items-center gap-2 px-3 py-2 border border-border-light hover:border-border-medium rounded cursor-pointer text-xs text-text-primary transition-colors">
                      <input 
                        type="radio" 
                        name="exit_reason" 
                        value={opt.val}
                        checked={reason === opt.val}
                        onChange={(e) => setReason(e.target.value)}
                        className="text-primary-cyan"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                {reason === 'other' && (
                  <textarea 
                    value={reasonDetail}
                    onChange={(e) => setReasonDetail(e.target.value)}
                    placeholder="Tell us more about why you are leaving..."
                    className="w-full border border-border-light rounded p-2 text-xs h-20 focus:outline-none focus:border-primary-cyan font-sans"
                  />
                )}
              </div>
            )}

            {/* STEP 2: Missing Features */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-xs font-mono uppercase font-bold text-text-secondary">
                  STEP 2: Features & Capabilities
                </p>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-text-secondary">
                    What features or workflows would have kept you subscribed?
                  </label>
                  <textarea 
                    value={missingFeature}
                    onChange={(e) => setMissingFeature(e.target.value)}
                    placeholder="Example: More advanced WhatsApp integrations, custom CRM visual cards, automated white-label reports..."
                    className="w-full border border-border-light rounded p-3 text-xs h-32 focus:outline-none focus:border-primary-cyan font-sans resize-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Alternative Switching */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-xs font-mono uppercase font-bold text-text-secondary">
                  STEP 3: Alternative Solutions
                </p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] uppercase font-bold text-text-secondary">
                      Who are you switching to?
                    </label>
                    <input 
                      type="text" 
                      value={competitorName}
                      onChange={(e) => setCompetitorName(e.target.value)}
                      placeholder="Competitor name (e.g. Semrush, Hootsuite, manual sheets)"
                      className="w-full border border-border-light rounded px-3 py-2 text-xs focus:outline-none focus:border-primary-cyan"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[10px] uppercase font-bold text-text-secondary">
                      Monthly price you are willing to pay for Agency Buddy ($)?
                    </label>
                    <select 
                      value={priceWillingToPay}
                      onChange={(e) => setPriceWillingToPay(e.target.value)}
                      className="w-full border border-border-light rounded px-3 py-2 text-xs bg-panel-white focus:outline-none focus:border-primary-cyan"
                    >
                      <option value="0-20">$0 - $20 / month</option>
                      <option value="20-50">$20 - $50 / month</option>
                      <option value="50-100">$50 - $100 / month (Standard)</option>
                      <option value="100+">$100+ / month (Enterprise)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Rate Experience */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-xs font-mono uppercase font-bold text-text-secondary">
                  STEP 4: Rate your experience
                </p>
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-2 py-4 border border-border-light rounded bg-page-bg/30">
                    <span className="text-xs font-medium text-text-secondary">Overall Experience Rating</span>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} 
                          type="button"
                          onClick={() => setSatisfactionRating(star)}
                          className="text-yellow-400 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star 
                            size={32} 
                            fill={star <= satisfactionRating ? 'currentColor' : 'none'} 
                            stroke="currentColor" 
                            strokeWidth={1.5}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase font-bold text-text-secondary block">
                      Would you return to Agency Buddy in the future?
                    </label>
                    <div className="flex gap-2">
                      {[
                        { val: 'yes', label: 'Yes, definitely' },
                        { val: 'maybe', label: 'Maybe, in future' },
                        { val: 'no', label: 'No' }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setWouldReturn(item.val)}
                          className={`flex-1 py-2 text-xs border rounded transition-all duration-150 cursor-pointer ${
                            wouldReturn === item.val
                              ? 'bg-[#ECFEFF] text-primary-cyan border-primary-cyan font-semibold'
                              : 'bg-panel-white text-text-secondary border-border-light hover:bg-page-bg'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Anything Else? */}
            {step === 5 && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-xs font-mono uppercase font-bold text-text-secondary">
                  STEP 5: Additional Remarks
                </p>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-text-secondary">
                    Is there anything else you would like to share with our development team?
                  </label>
                  <textarea 
                    value={additionalComments}
                    onChange={(e) => setAdditionalComments(e.target.value)}
                    placeholder="We read every single comment to improve the product..."
                    className="w-full border border-border-light rounded p-3 text-xs h-32 focus:outline-none focus:border-primary-cyan font-sans resize-none"
                  />
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex items-center justify-between border-t border-border-light mt-8 pt-4">
              <button 
                type="button"
                onClick={() => setStep(prev => Math.max(1, prev - 1))}
                disabled={step === 1}
                className="px-4 py-2 border border-border-light rounded text-xs text-text-secondary hover:bg-page-bg transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer font-medium"
              >
                Back
              </button>

              {step < 5 ? (
                <button 
                  type="button"
                  onClick={() => setStep(prev => Math.min(5, prev + 1))}
                  className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-medium cursor-pointer transition-colors"
                >
                  Next Step
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-error-red hover:bg-red-600 text-white rounded text-xs font-medium cursor-pointer transition-colors"
                >
                  Submit & Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Thank You & Reactivation Offering */
          <div className="text-center py-6 animate-fade-in space-y-6">
            <div className="w-12 h-12 bg-cyan-50 border border-primary-cyan/20 rounded-full flex items-center justify-center mx-auto text-primary-cyan">
              <RefreshCw size={24} className="animate-spin-slow" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-bold text-text-primary">Your cancellation request is pending</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Thank you for the detailed feedback. We have applied a **7-day grace period** to your account. Your dashboard access will remain fully functional until then.
              </p>
            </div>

            <div className="p-4 border border-[#06B6D433] bg-[#ECFEFF] rounded text-left">
              <p className="text-xs text-[#065F46] leading-relaxed font-medium">
                ⚡ **Special Reactivation Offer:** Get **50 free tokens** credited to your account if you choose to reactivate your subscription today!
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4 items-center">
              <button 
                onClick={handleReactivate}
                className="w-full py-2.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer transition-all duration-150"
              >
                Reactivate Subscription (Keep My Workspace)
              </button>
              
              <button 
                onClick={() => setVisible(false)}
                className="text-[10px] text-text-secondary hover:text-text-primary hover:underline font-mono"
              >
                Confirm Exit & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
