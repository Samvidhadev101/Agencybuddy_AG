import React from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function AiWarningBanner() {
  const { agency } = useApp();

  if (agency && agency.openrouter_api_key) {
    return null;
  }

  return (
    <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-3 mb-6 flex items-start gap-3 shadow-sm animate-fade-in">
      <AlertTriangle className="text-[#92400E] shrink-0 mt-0.5" size={18} />
      <div className="flex-1">
        <p className="text-[14px] text-[#92400E] font-sans leading-snug font-medium">
          AI features are disabled. Add your OpenRouter API key in Settings to get started.
        </p>
        <Link to="/settings" className="text-[#06B6D4] text-[13px] font-semibold hover:underline mt-1 inline-block">
          Go to Settings →
        </Link>
      </div>
    </div>
  );
}
