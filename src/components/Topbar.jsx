import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Bell, Search, LogOut, Settings, CreditCard, ShieldAlert, Check, KeyRound, X, Eye, EyeOff, Zap, Sun, Moon } from 'lucide-react';

export default function Topbar() {
  const { 
    agency, 
    clients, 
    selectedClientId, 
    changeSelectedClient, 
    notifications, 
    user,
    theme,
    updateTheme
  } = useApp();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Compute dynamic page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/seo/audit')) return 'SEO Audit Analyzer';
    if (path.startsWith('/seo/keywords')) return 'SEO Keyword Tracker';
    if (path.startsWith('/seo/ads')) return 'Search Ads Manager';
    if (path.startsWith('/seo')) return 'SEO Engine Dashboard';
    if (path.startsWith('/gbp/posts/new')) return 'Create Google Business Post';
    if (path.startsWith('/gbp/edit')) return 'Edit GBP Listing';
    if (path.startsWith('/gbp/photos')) return 'GBP Photo Manager';
    if (path.startsWith('/gbp/qa')) return 'GBP Q&A Manager';
    if (path.startsWith('/gbp/audit')) return 'GBP Listing Auditor';
    if (path.startsWith('/gbp/locations')) return 'GBP Locations Matrix';
    if (path.startsWith('/gbp')) return 'Google Business Profile';
    if (path.startsWith('/aeo')) return 'AEO Visibility Checker';
    if (path.startsWith('/social/calendar')) return 'Social Posting Calendar';
    if (path.startsWith('/social/compose')) return 'Social Content Composer';
    if (path.startsWith('/social/ads')) return 'Social Ads Center';
    if (path.startsWith('/social/inbox')) return 'Social Unified Inbox';
    if (path.startsWith('/social/listening')) return 'Social Brand Listening';
    if (path.startsWith('/social/influencers')) return 'Influencer Campaigns';
    if (path.startsWith('/social')) return 'Social Media Suite';
    if (path.startsWith('/content/calendar')) return 'Content Scheduler';
    if (path.startsWith('/content/writer')) return 'AI Content Writer';
    if (path.startsWith('/content/assets')) return 'Asset Catalog';
    if (path.startsWith('/content/approvals')) return 'Approval Queue';
    if (path.startsWith('/content/briefs')) return 'SEO Content Briefs';
    if (path.startsWith('/email/contacts')) return 'CRM Contacts Database';
    if (path.startsWith('/email/pipeline')) return 'CRM Deal Pipeline';
    if (path.startsWith('/email/campaigns')) return 'Email Marketing Campaigns';
    if (path.startsWith('/email/automation')) return 'Email Automation Flows';
    if (path.startsWith('/email/whatsapp')) return 'SMS & WhatsApp Broadcasts';
    if (path.startsWith('/reputation/respond')) return 'AI Review Responder';
    if (path.startsWith('/reputation/generate')) return 'Review Invitation Center';
    if (path.startsWith('/reputation/mentions')) return 'Brand Web Mentions';
    if (path.startsWith('/reputation/crisis')) return 'Crisis Response Center';
    if (path.startsWith('/reputation')) return 'Reputation Manager';
    if (path.startsWith('/analytics/reports')) return 'White-label PDF Report Builder';
    if (path.startsWith('/analytics/competitors')) return 'Competitor Benchmarks';
    if (path.startsWith('/analytics')) return 'Analytics Operations';
    if (path.startsWith('/geofencing/campaigns')) return 'Geo-fenced SMS Campaigns';
    if (path.startsWith('/geofencing/competitors')) return 'Geo Conquest Maps';
    if (path.startsWith('/geofencing')) return 'Geo-fencing Zones';
    if (path.startsWith('/tasks')) return 'Team Task Board';
    if (path.startsWith('/team/time')) return 'Time Tracker Sheets';
    if (path.startsWith('/team/workload')) return 'Member Workloads';
    if (path.startsWith('/team/sops')) return 'Agency SOP Library';
    if (path.startsWith('/team')) return 'Team Operations';
    if (path.startsWith('/clients')) return 'Clients Index';
    if (path.startsWith('/billing')) return 'Billing & Tokens';
    if (path.startsWith('/settings')) return 'Agency workspace settings';
    if (path.startsWith('/support/videos')) return 'Video Academy';
    if (path.startsWith('/support/tickets')) return 'Support Tickets';
    if (path.startsWith('/support')) return 'Knowledge Base';
    return 'Agency Buddy Dashboard';
  };

  const unreadNotifs = notifications.filter(n => !n.is_read);

  const markAllAsRead = () => {
    const list = JSON.parse(localStorage.getItem('db_notifications') || '[]');
    const updated = list.map(n => ({ ...n, is_read: true }));
    localStorage.setItem('db_notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('local_db_change'));
  };

  return (
    <>
    <div className="h-14 bg-panel-white border-b border-border-light flex items-center justify-between px-6 select-none shrink-0 z-10">
      
      {/* Left: Page Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-[17px] font-semibold text-text-primary font-sans leading-none tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Center: Search & Client Selector */}
      <div className="flex items-center gap-4 flex-1 max-w-xl justify-center">
        {/* Client Inspector Dropdown */}
        {clients.length > 0 && (
          <div className="flex items-center gap-1.5 border border-border-light bg-page-bg rounded px-2 py-1 h-8 shrink-0">
            <span className="font-mono text-[10px] uppercase font-bold text-text-muted">
              CLIENT:
            </span>
            <select 
              value={selectedClientId} 
              onChange={(e) => changeSelectedClient(e.target.value)}
              className="bg-transparent text-xs font-semibold text-text-primary focus:outline-none cursor-pointer pr-1"
            >
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Global Search Bar */}
        <div className="relative w-64 h-8 flex-1">
          <Search size={14} className="absolute left-2.5 top-2 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search... ⌘K" 
            className="w-full h-full bg-panel-white border border-border-light rounded pl-8 pr-3 text-xs font-mono focus:outline-none focus:border-primary-cyan focus:ring-1 focus:ring-primary-cyan/20 placeholder-text-muted text-text-primary"
          />
        </div>
      </div>

      {/* Right: Metrics & Actions */}
      <div className="flex items-center gap-4">
        

        {/* Theme Toggle */}
        <button
          onClick={() => updateTheme(theme === 'dark' ? 'light' : 'dark')}
          className="relative p-1.5 text-text-secondary hover:text-text-primary rounded hover:bg-bg-elevated transition-colors duration-150 h-8 w-8 flex items-center justify-center"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 text-text-secondary hover:text-text-primary rounded hover:bg-page-bg transition-colors duration-150 h-8 w-8 flex items-center justify-center"
          >
            <Bell size={16} />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary-cyan rounded-full border border-white ring-1 ring-primary-cyan/20"></span>
            )}
          </button>

          {/* Notifications Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-panel-white border border-border-light rounded-md shadow-lg py-1 z-30 font-sans">
              <div className="px-4 py-2 border-b border-border-light flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary">Notifications</span>
                {unreadNotifs.length > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] text-primary-cyan hover:underline flex items-center gap-0.5 font-semibold"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-text-muted">
                    No notifications
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => {
                        // Mark as read and navigate
                        const list = JSON.parse(localStorage.getItem('db_notifications') || '[]');
                        const updated = list.map(n => n.id === notif.id ? { ...n, is_read: true } : n);
                        localStorage.setItem('db_notifications', JSON.stringify(updated));
                        window.dispatchEvent(new Event('local_db_change'));
                        setShowNotifications(false);
                        if (notif.link) navigate(notif.link);
                      }}
                      className={`px-4 py-2.5 border-b border-page-bg cursor-pointer hover:bg-page-bg transition-colors flex flex-col gap-0.5 ${
                        !notif.is_read ? 'bg-[#ECFEFF]/40 border-l-2 border-primary-cyan pl-3.5' : ''
                      }`}
                    >
                      <span className="text-xs font-medium text-text-primary">{notif.title}</span>
                      <span className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">{notif.message}</span>
                      <span className="text-[9px] text-text-muted font-mono mt-1">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 focus:outline-none cursor-pointer"
          >
            <img 
              src={user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} 
              alt="Avatar" 
              className="w-8 h-8 rounded border border-border-medium object-cover"
            />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-panel-white border border-border-light rounded-md shadow-lg py-1 z-30 font-sans">
              <div className="px-4 py-2 border-b border-border-light flex flex-col">
                <span className="text-xs font-semibold text-text-primary truncate">
                  {user?.user_metadata?.full_name || 'Administrator'}
                </span>
                <span className="text-[10px] text-text-muted truncate">
                  {user?.email}
                </span>
              </div>
              <Link 
                to="/settings" 
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-text-secondary hover:bg-page-bg hover:text-text-primary transition-colors"
              >
                <Settings size={14} />
                <span>Agency Settings</span>
              </Link>
              <Link 
                to="/billing" 
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-text-secondary hover:bg-page-bg hover:text-text-primary transition-colors"
              >
                <CreditCard size={14} />
                <span>Billing & Tokens</span>
              </Link>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full text-left px-4 py-2 border-t border-border-light text-xs text-error-red hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  </>);
}
