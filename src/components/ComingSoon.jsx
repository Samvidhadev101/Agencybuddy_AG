import React from 'react';
import { Hammer } from 'lucide-react'; // Or any icon that represents "striking out"

export default function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center space-y-4 animate-fade-in">
      <div className="w-20 h-20 bg-page-bg border border-border-medium rounded-full flex items-center justify-center shadow-sm mb-4">
        <Hammer size={32} className="text-primary-cyan rotate-[-45deg]" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary tracking-tight">Coming soon to strike your problems out</h2>
      {title && (
        <p className="text-sm font-mono text-text-secondary uppercase tracking-wider bg-panel-white px-3 py-1 rounded border border-border-light shadow-sm">
          Module: {title}
        </p>
      )}
    </div>
  );
}
