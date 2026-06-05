// Agency Buddy — Clean Workspace Initializer
// Runs once on first app load to set up the admin account and blank agency.
// No demo clients, tasks, or fake data is seeded.

const DATA_VERSION = 'v4.0-openrouter';

export function seedDatabase(force = false) {
  // ── Version-based wipe: clear ALL old demo data on upgrade ───────────────
  const storedVersion = localStorage.getItem('agencyos_data_version');
  if (storedVersion !== DATA_VERSION) {
    // Nuke everything from the previous version
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('db_') || key === 'agencyos_seeded' || key === 'auth_user' || key === 'auth_session' || key === 'agencyos_selected_client')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    localStorage.setItem('agencyos_data_version', DATA_VERSION);
    force = true; // force re-seed after wipe
  }

  const isSeeded = localStorage.getItem('agencyos_seeded');
  if (isSeeded && !force) return;

  const agencyId = 'age_default_id';
  const userId   = 'usr_admin_id';

  // ── Agency ──────────────────────────────────────────────────────────────
  const agencies = [
    {
      id: agencyId,
      name: 'My Agency',
      logo_url: null,
      website: '',
      plan: 'trial',
      openrouter_api_key: '',
      preferred_model: 'google/gemini-2.0-flash-exp:free',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      primary_color: '#06B6D4',
      secondary_color: '#111827',
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem('db_agencies', JSON.stringify(agencies));

  // ── Admin user ───────────────────────────────────────────────────────────
  const users = [
    {
      id: userId,
      agency_id: agencyId,
      full_name: 'Admin',
      email: 'admin@agencybuddy.io',
      role: 'admin',
      phone: '',
      avatar_url: null,
      status: 'active',
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem('db_users', JSON.stringify(users));

  // ── Empty tables ─────────────────────────────────────────────────────────
  const EMPTY_TABLES = [
    'db_clients',
    'db_tasks',
    'db_content_items',
    'db_seo_audits',
    'db_keyword_trackers',
    'db_gbp_listings',
    'db_gbp_posts',
    'db_gbp_photos',
    'db_gbp_qa',
    'db_gbp_insights',
    'db_gbp_audit_scores',
    'db_aeo_checks',
    'db_aeo_scores',
    'db_aeo_tracked_queries',
    'db_social_posts',
    'db_contacts',
    'db_email_campaigns',
    'db_automations',
    'db_reviews',
    'db_geo_fence_zones',
    'db_geo_campaigns',
    'db_geo_campaign_analytics',
    'db_geo_competitor_zones',
    'db_invoices',
    'db_notifications',
    'db_knowledge_base_articles',
    'db_video_tutorials',
    'db_announcements',
    'db_exit_feedback',
  ];
  EMPTY_TABLES.forEach(t => localStorage.setItem(t, JSON.stringify([])));

  // ── Onboarding checklist (all unchecked) ─────────────────────────────────
  const onboardingProgress = [
    { id: 'op_1',  agency_id: agencyId, user_id: userId, step_key: 'setup_agency',   step_title: 'Set Up Agency Profile',         is_completed: false },
    { id: 'op_2',  agency_id: agencyId, user_id: userId, step_key: 'set_ai_key',     step_title: 'Configure AI Backend',           is_completed: true },
    { id: 'op_3',  agency_id: agencyId, user_id: userId, step_key: 'add_client',     step_title: 'Add First Client',               is_completed: false },
    { id: 'op_4',  agency_id: agencyId, user_id: userId, step_key: 'run_seo_audit',  step_title: 'Run First SEO Audit',            is_completed: false },
    { id: 'op_5',  agency_id: agencyId, user_id: userId, step_key: 'connect_gbp',    step_title: 'Verify GBP Listing',             is_completed: false },
    { id: 'op_6',  agency_id: agencyId, user_id: userId, step_key: 'check_aeo',      step_title: 'Check AEO Brand Visibility',     is_completed: false },
    { id: 'op_7',  agency_id: agencyId, user_id: userId, step_key: 'compose_post',   step_title: 'Create Social Post Draft',       is_completed: false },
    { id: 'op_8',  agency_id: agencyId, user_id: userId, step_key: 'write_ai_content',step_title: 'Draft Blog with AI Writer',    is_completed: false },
    { id: 'op_9',  agency_id: agencyId, user_id: userId, step_key: 'create_contact', step_title: 'Add Lead in CRM Contacts',       is_completed: false },
    { id: 'op_10', agency_id: agencyId, user_id: userId, step_key: 'invite_member',  step_title: 'Invite Team Member',             is_completed: false },
  ];
  localStorage.setItem('db_onboarding_progress', JSON.stringify(onboardingProgress));

  localStorage.setItem('agencyos_seeded', 'true');
}
