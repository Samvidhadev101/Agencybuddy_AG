import React from 'react';
import { useLocation } from 'react-router-dom';

export default function BrowserChrome({ children }) {
  const location = useLocation();
  const currentPath = location.pathname === '/' ? '/dashboard' : location.pathname;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Browser Chrome Header (Fixed at top) */}
      <div className="fixed top-0 left-0 right-0 h-10 bg-panel-white border-b border-border-light z-50 flex items-center justify-between px-4 select-none">
        
        {/* Left: macOS traffic lights */}
        <div className="flex items-center gap-2 w-1/4">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57] inline-block border border-red-600/10"></span>
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E] inline-block border border-yellow-600/10"></span>
          <span className="w-3 h-3 rounded-full bg-[#28C840] inline-block border border-green-600/10"></span>
        </div>

        {/* Center: Tab Bar */}
        <div className="flex items-end h-full">
          <div className="flex items-center gap-2 bg-panel-white px-6 py-1.5 h-8 border-t border-x border-border-light rounded-t-md text-[13px] font-medium text-text-primary">
            <span className="w-3 h-3 rounded-full bg-primary-cyan flex items-center justify-center text-[8px] text-white font-bold select-none">⚡</span>
            <span>Agency OS</span>
            <span className="text-[10px] text-text-muted ml-2 font-mono hover:text-text-primary cursor-pointer">×</span>
          </div>
        </div>

        {/* Right: Address Bar & Extension */}
        <div className="flex items-center gap-3 w-1/3 justify-end">
          <div className="bg-page-bg border border-border-light rounded-md px-3 py-1 flex items-center justify-between w-64 h-7 text-xs font-mono text-text-secondary select-text overflow-hidden whitespace-nowrap">
            <span className="text-text-muted select-none">https://</span>
            <span className="flex-1 text-left overflow-x-auto overflow-y-hidden scrollbar-none ml-0.5">
              app.agencyos.io{currentPath}
            </span>
          </div>
          
          {/* Extension icon button */}
          <button className="w-7 h-7 flex items-center justify-center rounded-md bg-[#06B6D41A] text-primary-cyan border border-[#06B6D433] hover:bg-primary-cyan hover:text-white transition-colors duration-150">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </button>
        </div>
      </div>

      {/* Main viewport (below Chrome bar) */}
      <div className="flex-1 pt-10 h-full overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
