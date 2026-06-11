import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  ChevronDown, ChevronRight, LayoutDashboard, Globe, 
  Share2, FileText, Mail, Star, BarChart3, 
  MapPin, CheckSquare, Users, FolderKanban, 
  HelpCircle, Settings, CreditCard, ShieldAlert 
} from 'lucide-react';

export default function Sidebar() {
  const { agency, user, userProfile } = useApp();
  const location = useLocation();

  const hasModule = (modName) => {
    if (!userProfile) return true;
    if (userProfile.role !== 'custom') return true;
    if (!userProfile.custom_permissions?.modules) return false;
    return userProfile.custom_permissions.modules[modName] === true;
  };
  
  // Track open directories like a file manager
  const [expandedFolders, setExpandedFolders] = useState({
    seo: true,
    social: false,
    content: false,
    crm: false,
    reputation: false,
    analytics: false,
    geofencing: false,
    operations: true,
    support: false,
    account: false
  });

  const toggleFolder = (folder) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folder]: !prev[folder]
    }));
  };

  const navItemClass = ({ isActive }) => 
    `flex items-center gap-2 py-1.5 px-3 rounded text-sm transition-all duration-150 ${
      isActive 
        ? 'bg-[#ECFEFF] text-primary-cyan border-l-2 border-primary-cyan font-medium' 
        : 'text-text-secondary hover:bg-page-bg hover:text-text-primary'
    }`;

  const subNavItemClass = ({ isActive }) => 
    `flex items-center gap-1.5 py-1 px-3 ml-4 border-l border-border-light text-[13px] font-mono transition-all duration-150 ${
      isActive 
        ? 'text-primary-cyan font-medium border-primary-cyan bg-cyan-50/50' 
        : 'text-text-secondary hover:text-text-primary hover:border-border-medium'
    }`;

  // Helper for folder parent tags
  const folderHeaderClass = (folder) =>
    `flex items-center justify-between w-full py-1.5 px-3 rounded text-sm text-text-secondary hover:bg-page-bg hover:text-text-primary cursor-pointer select-none transition-colors duration-150`;

  return (
    <div className="w-64 bg-panel-white border-r border-border-light h-full flex flex-col z-20 shrink-0">
      
      {/* Brand Header */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border-light bg-panel-white">
        <span className="sidebar-logo-text font-sans">Agency Buddy</span>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 select-none scrollbar-thin">
        
        {/* SECTION: OVERVIEW */}
        <div>
          <div className="font-mono text-[10px] uppercase font-semibold text-text-muted px-3 tracking-wider mb-1">
            Overview
          </div>
          <NavLink to="/dashboard" className={navItemClass}>
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </NavLink>
        </div>

        {/* SECTION: MODULES */}
        <div>
          <div className="font-mono text-[10px] uppercase font-semibold text-text-muted px-3 tracking-wider mb-1">
            Modules
          </div>

          <div className="space-y-1">
            {/* SEO Directory */}
            {(hasModule('seo') || hasModule('gbp') || hasModule('aeo')) && (
              <div>
                <div className={folderHeaderClass('seo')} onClick={() => toggleFolder('seo')}>
                  <div className="flex items-center gap-2">
                    <Globe size={16} />
                    <span>SEO Engine</span>
                  </div>
                  {expandedFolders.seo ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {expandedFolders.seo && (
                  <div className="mt-0.5 space-y-0.5 animate-fade-in">
                    {hasModule('seo') && (
                      <>
                        <NavLink to="/seo/audit" className={subNavItemClass}>
                          <span>├─ Audits</span>
                        </NavLink>
                        <NavLink to="/seo/keywords" className={subNavItemClass}>
                          <span>├─ Keywords</span>
                        </NavLink>
                      </>
                    )}
                    {hasModule('gbp') && (
                      <NavLink to="/gbp" className={subNavItemClass}>
                        <span>├─ GBP Listing</span>
                      </NavLink>
                    )}
                    {hasModule('aeo') && (
                      <NavLink to="/aeo" className={subNavItemClass}>
                        <span>├─ AEO Engine</span>
                      </NavLink>
                    )}
                    {hasModule('seo') && (
                      <NavLink to="/seo/ads" className={subNavItemClass}>
                        <span>└─ Search Ads</span>
                      </NavLink>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Social Media Directory */}
            {hasModule('social') && (
              <div>
                <div className={folderHeaderClass('social')} onClick={() => toggleFolder('social')}>
                  <div className="flex items-center gap-2">
                    <Share2 size={16} />
                    <span>Social Media</span>
                  </div>
                  {expandedFolders.social ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {expandedFolders.social && (
                  <div className="mt-0.5 space-y-0.5">
                    <NavLink to="/social/calendar" className={subNavItemClass}>
                      <span>├─ Calendar</span>
                    </NavLink>
                    <NavLink to="/social/compose" className={subNavItemClass}>
                      <span>├─ Compose</span>
                    </NavLink>
                    <NavLink to="/social/ads" className={subNavItemClass}>
                      <span>├─ Ads Manager</span>
                    </NavLink>
                    <NavLink to="/social/inbox" className={subNavItemClass}>
                      <span>├─ Inbox Chat</span>
                    </NavLink>
                    <NavLink to="/social/listening" className={subNavItemClass}>
                      <span>├─ Listening</span>
                    </NavLink>
                    <NavLink to="/social/influencers" className={subNavItemClass}>
                      <span>└─ Influencers</span>
                    </NavLink>
                  </div>
                )}
              </div>
            )}

            {/* Content Directory */}
            {hasModule('content') && (
              <div>
                <div className={folderHeaderClass('content')} onClick={() => toggleFolder('content')}>
                  <div className="flex items-center gap-2">
                    <FileText size={16} />
                    <span>Content Hub</span>
                  </div>
                  {expandedFolders.content ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {expandedFolders.content && (
                  <div className="mt-0.5 space-y-0.5">
                    <NavLink to="/content/calendar" className={subNavItemClass}>
                      <span>├─ Calendar</span>
                    </NavLink>
                    <NavLink to="/content/writer" className={subNavItemClass}>
                      <span>├─ AI Writer</span>
                    </NavLink>
                    <NavLink to="/content/briefs" className={subNavItemClass}>
                      <span>├─ SEO Briefs</span>
                    </NavLink>
                    <NavLink to="/content/assets" className={subNavItemClass}>
                      <span>├─ Assets</span>
                    </NavLink>
                    <NavLink to="/content/approvals" className={subNavItemClass}>
                      <span>└─ Approvals</span>
                    </NavLink>
                  </div>
                )}
              </div>
            )}

            {/* Email & CRM Directory */}
            {hasModule('email') && (
              <div>
                <div className={folderHeaderClass('crm')} onClick={() => toggleFolder('crm')}>
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    <span>Email & CRM</span>
                  </div>
                  {expandedFolders.crm ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {expandedFolders.crm && (
                  <div className="mt-0.5 space-y-0.5">
                    <NavLink to="/email/contacts" className={subNavItemClass}>
                      <span>├─ Contacts</span>
                    </NavLink>
                    <NavLink to="/email/pipeline" className={subNavItemClass}>
                      <span>├─ Pipeline</span>
                    </NavLink>
                    <NavLink to="/email/campaigns" className={subNavItemClass}>
                      <span>└─ Campaigns</span>
                    </NavLink>
                  </div>
                )}
              </div>
            )}

            {/* Reputation Directory */}
            {hasModule('reputation') && (
              <div>
                <div className={folderHeaderClass('reputation')} onClick={() => toggleFolder('reputation')}>
                  <div className="flex items-center gap-2">
                    <Star size={16} />
                    <span>Reputation</span>
                  </div>
                  {expandedFolders.reputation ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {expandedFolders.reputation && (
                  <div className="mt-0.5 space-y-0.5">
                    <NavLink to="/reputation" className={subNavItemClass}>
                      <span>├─ Reviews</span>
                    </NavLink>
                    <NavLink to="/reputation/respond" className={subNavItemClass}>
                      <span>├─ Auto Reply</span>
                    </NavLink>
                    <NavLink to="/reputation/generate" className={subNavItemClass}>
                      <span>├─ Generate</span>
                    </NavLink>
                    <NavLink to="/reputation/mentions" className={subNavItemClass}>
                      <span>├─ Mentions</span>
                    </NavLink>
                    <NavLink to="/reputation/crisis" className={subNavItemClass}>
                      <span>└─ Crisis Alert</span>
                    </NavLink>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Directory */}
            {hasModule('analytics') && (
              <div>
                <div className={folderHeaderClass('analytics')} onClick={() => toggleFolder('analytics')}>
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} />
                    <span>Analytics</span>
                  </div>
                  {expandedFolders.analytics ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {expandedFolders.analytics && (
                  <div className="mt-0.5 space-y-0.5">
                    <NavLink to="/analytics" className={subNavItemClass}>
                      <span>├─ Dashboard</span>
                    </NavLink>
                    <NavLink to="/analytics/reports" className={subNavItemClass}>
                      <span>├─ Report Builder</span>
                    </NavLink>
                    <NavLink to="/analytics/competitors" className={subNavItemClass}>
                      <span>└─ Competitors</span>
                    </NavLink>
                  </div>
                )}
              </div>
            )}

            {/* Geo-fencing Directory */}
            {hasModule('geofencing') && (
              <div>
                <div className={folderHeaderClass('geofencing')} onClick={() => toggleFolder('geofencing')}>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>Geo-fencing</span>
                  </div>
                  {expandedFolders.geofencing ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {expandedFolders.geofencing && (
                  <div className="mt-0.5 space-y-0.5">
                    <NavLink to="/geofencing" className={subNavItemClass}>
                      <span>├─ Zones</span>
                    </NavLink>
                    <NavLink to="/geofencing/campaigns" className={subNavItemClass}>
                      <span>├─ Campaigns</span>
                    </NavLink>
                    <NavLink to="/geofencing/competitors" className={subNavItemClass}>
                      <span>└─ Conquest</span>
                    </NavLink>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION: OPERATIONS */}
        <div>
          <div className="font-mono text-[10px] uppercase font-semibold text-text-muted px-3 tracking-wider mb-1">
            Operations
          </div>
          <div className="space-y-1">
            <NavLink to="/tasks" className={navItemClass}>
              <CheckSquare size={16} />
              <span>Tasks</span>
            </NavLink>
            <NavLink to="/team" className={navItemClass}>
              <Users size={16} />
              <span>Team Directory</span>
            </NavLink>
            <NavLink to="/clients" className={navItemClass}>
              <FolderKanban size={16} />
              <span>Clients List</span>
            </NavLink>
          </div>
        </div>

        {/* SECTION: SUPPORT */}
        <div>
          <div className="font-mono text-[10px] uppercase font-semibold text-text-muted px-3 tracking-wider mb-1">
            Support
          </div>
          <div className="space-y-1">
            <NavLink to="/support" className={navItemClass}>
              <HelpCircle size={16} />
              <span>Help Center</span>
            </NavLink>
            <NavLink to="/support/videos" className={navItemClass}>
              <BarChart3 size={16} className="rotate-90" />
              <span>Tutorial Videos</span>
            </NavLink>
            <NavLink to="/support/tickets" className={navItemClass}>
              <ShieldAlert size={16} />
              <span>Support Tickets</span>
            </NavLink>
          </div>
        </div>

        {/* SECTION: ACCOUNT */}
        {userProfile?.role !== 'custom' && (
          <div>
            <div className="font-mono text-[10px] uppercase font-semibold text-text-muted px-3 tracking-wider mb-1">
              Account
            </div>
            <div className="space-y-1">
              <NavLink to="/billing" className={navItemClass}>
                <CreditCard size={16} />
                <span>Billing & Plans</span>
              </NavLink>
              <NavLink to="/settings" className={navItemClass}>
                <Settings size={16} />
                <span>Settings</span>
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border-light bg-panel-white">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-text-primary truncate max-w-[140px]">
              {agency?.name || 'Local Workspace'}
            </span>
            <span className="text-[10px] text-text-muted font-mono truncate max-w-[140px]">
              {user?.email || 'admin@agencyos.io'}
            </span>
          </div>
          
          {/* Plan badge */}
          <span className="bg-[#ECFEFF] text-primary-cyan border border-[#06B6D433] text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider select-none">
            {agency?.plan === 'premium' ? 'PREMIUM' : 'TRIAL'}
          </span>
        </div>
      </div>
    </div>
  );
}
