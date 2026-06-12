import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { seedDatabase } from '../lib/seedData';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [agency, setAgency] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [onboarding, setOnboarding] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [theme, setTheme] = useState('light');

  // Apply theme to document when it changes
  useEffect(() => {
    const applyTheme = () => {
      let activeTheme = theme;
      if (theme === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', activeTheme);
    };
    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // Initialize Auth & Seed Data
  useEffect(() => {
    // Populate seed data on first mount
    seedDatabase();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        loadAgencyAndUserData(session.user);
      } else {
        setAgency(null);
        setClients([]);
        setNotifications([]);
        setOnboarding([]);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshTrigger]);

  // Sync state whenever local storage changes
  useEffect(() => {
    const handleDbChange = () => {
      if (user) {
        loadAgencyAndUserData(user);
      }
    };
    window.addEventListener('local_db_change', handleDbChange);
    return () => {
      window.removeEventListener('local_db_change', handleDbChange);
    };
  }, [user]);

  const loadAgencyAndUserData = async (currentUser) => {
    try {
      // Get user profiles from table
      const { data: userProfileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (userProfileData) {
        setUserProfile(userProfileData);
        setTheme(userProfileData.theme_preference || 'light');
        // Fetch agency
        const { data: agencyProfile } = await supabase
          .from('agencies')
          .select('*')
          .eq('id', userProfileData.agency_id)
          .single();

        if (agencyProfile) {
          setAgency(agencyProfile);
        }

        // Fetch clients
        let { data: clientList } = await supabase
          .from('clients')
          .select('*')
          .eq('agency_id', userProfileData.agency_id);

        if (clientList) {
          if (userProfileData.role === 'executive') {
            const assignedIds = userProfileData.assigned_client_ids || [];
            clientList = clientList.filter(c => assignedIds.includes(c.id));
          } else if (userProfileData.role === 'custom' && userProfileData.custom_permissions?.client_scope === 'selected') {
            const assignedIds = userProfileData.assigned_client_ids || [];
            clientList = clientList.filter(c => assignedIds.includes(c.id));
          }
        }

        setClients(clientList || []);
        
        // Auto-select first client if none selected
        if (clientList && clientList.length > 0 && !selectedClientId) {
          // Check if previously selected client still exists
          const savedClient = localStorage.getItem('agencyos_selected_client');
          const exists = clientList.some(c => c.id === savedClient);
          if (exists) {
            setSelectedClientId(savedClient);
          } else {
            setSelectedClientId(clientList[0].id);
            localStorage.setItem('agencyos_selected_client', clientList[0].id);
          }
        }

        // Fetch notifications
        const { data: userNotifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        setNotifications(userNotifs || []);

        // Fetch onboarding checklist
        const { data: progress } = await supabase
          .from('onboarding_progress')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('id', { ascending: true });

        setOnboarding(progress || []);
      }
    } catch (e) {
      console.error('Failed loading agency context:', e);
    } finally {
      setLoading(false);
    }
  };

  // Helper to change selected client
  const changeSelectedClient = (clientId) => {
    setSelectedClientId(clientId);
    localStorage.setItem('agencyos_selected_client', clientId);
  };

  const forceRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const updateTheme = async (newTheme) => {
    setTheme(newTheme);
    if (user) {
      await supabase.from('users').update({ theme_preference: newTheme }).eq('id', user.id);
      window.dispatchEvent(new Event('local_db_change'));
    }
  };

  const activeClient = clients.find(c => c.id === selectedClientId) || null;

  const isAiEnabled = () => {
    if (!userProfile) return false;
    if (userProfile.role === 'custom' && userProfile.ai_access_enabled === false) return false;
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        userProfile,
        session,
        agency,
        clients,
        selectedClientId,
        activeClient,
        notifications,
        onboarding,
        loading,
        changeSelectedClient,
        forceRefresh,
        setUser,
        theme,
        updateTheme,
        isAiEnabled
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
