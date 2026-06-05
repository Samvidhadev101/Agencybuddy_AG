import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AiConnectionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleShow = () => setIsOpen(true);
    window.addEventListener('show_ai_key_modal', handleShow);
    return () => window.removeEventListener('show_ai_key_modal', handleShow);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-panel-white border border-border-light rounded-xl shadow-2xl p-6 relative animate-fade-in font-sans">
        <h3 className="text-[18px] font-semibold text-text-primary mb-2">AI Not Connected</h3>
        <p className="text-[14px] text-text-secondary mb-6 leading-relaxed">
          Add your OpenRouter API key in Settings to use AI features.
        </p>
        
        <div className="flex items-center justify-end gap-3">
          <button 
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-slate-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              setIsOpen(false);
              navigate('/settings');
            }}
            className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-[13px] font-semibold shadow-sm transition-colors"
          >
            Go to Settings
          </button>
        </div>
      </div>
    </div>
  );
}
