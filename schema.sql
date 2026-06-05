-- Database Schema - Agency OS (Supabase PostgreSQL)
-- Enable Row Level Security (RLS) on all tables.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core
CREATE TABLE agencies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  logo_url text,
  website text,
  plan text DEFAULT 'trial' CHECK (plan IN ('trial','premium')),
  token_balance integer DEFAULT 20,
  trial_ends_at timestamptz DEFAULT now() + interval '14 days',
  primary_color text DEFAULT '#06B6D4',
  secondary_color text DEFAULT '#111827',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY,
  agency_id uuid REFERENCES agencies NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('admin','manager','executive','client')),
  phone text,
  avatar_url text,
  status text DEFAULT 'active',
  theme_preference text DEFAULT 'light',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  name text NOT NULL,
  industry text,
  website text,
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  twitter_url text,
  gbp_url text,
  contact_name text,
  contact_email text,
  contact_phone text,
  status text DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Tasks & Content
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  client_id uuid REFERENCES clients,
  module text NOT NULL CHECK (module IN ('seo','social','content','email','reputation','analytics','geofencing','gbp','aeo','general')),
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES users,
  status text DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  due_date date,
  is_recurring boolean DEFAULT false,
  recurrence_pattern text,
  time_logged_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE content_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  client_id uuid REFERENCES clients NOT NULL,
  type text NOT NULL CHECK (type IN ('blog','social_post','email','ad_copy','video_script','reel_script','caption','story')),
  title text NOT NULL,
  body text,
  platform text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','internal_review','client_review','approved','published','rejected')),
  scheduled_at timestamptz,
  published_at timestamptz,
  ai_generated boolean DEFAULT false,
  tokens_used integer DEFAULT 0,
  created_by uuid REFERENCES users,
  created_at timestamptz DEFAULT now()
);

-- SEO
CREATE TABLE seo_audits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  client_id uuid REFERENCES clients NOT NULL,
  url text NOT NULL,
  overall_score integer,
  onpage_score integer,
  technical_score integer,
  content_score integer,
  mobile_score integer,
  findings jsonb,
  recommendations jsonb,
  tokens_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE keyword_trackers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients NOT NULL,
  keyword text NOT NULL,
  current_rank integer,
  previous_rank integer,
  search_volume integer,
  difficulty integer,
  cpc numeric,
  last_checked timestamptz,
  created_at timestamptz DEFAULT now()
);

-- GBP (Google Business Profile)
CREATE TABLE gbp_listings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  client_id uuid REFERENCES clients NOT NULL,
  business_name text NOT NULL,
  address text,
  city text,
  state text,
  zip_code text,
  phone text,
  website text,
  category_primary text,
  categories_secondary text[],
  description text,
  hours_json jsonb,
  attributes text[],
  logo_url text,
  cover_photo_url text,
  status text DEFAULT 'active',
  verification_status text DEFAULT 'unverified',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE gbp_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid REFERENCES gbp_listings NOT NULL,
  agency_id uuid REFERENCES agencies NOT NULL,
  type text CHECK (type IN ('update','offer','event','product')),
  title text,
  body text NOT NULL,
  image_url text,
  cta_type text,
  cta_url text,
  offer_code text,
  event_start timestamptz,
  event_end timestamptz,
  status text DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published')),
  scheduled_at timestamptz,
  published_at timestamptz,
  views integer DEFAULT 0,
  clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE gbp_photos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid REFERENCES gbp_listings NOT NULL,
  photo_url text NOT NULL,
  category text CHECK (category IN ('logo','cover','interior','exterior','product','team','food')),
  views integer DEFAULT 0,
  uploaded_at timestamptz DEFAULT now()
);

CREATE TABLE gbp_qa (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid REFERENCES gbp_listings NOT NULL,
  question text NOT NULL,
  asked_by text,
  answer text,
  answered_by text,
  answered_at timestamptz,
  status text DEFAULT 'unanswered' CHECK (status IN ('unanswered','answered')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE gbp_insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid REFERENCES gbp_listings NOT NULL,
  period text,
  searches_direct integer DEFAULT 0,
  searches_discovery integer DEFAULT 0,
  searches_branded integer DEFAULT 0,
  views_maps integer DEFAULT 0,
  views_search integer DEFAULT 0,
  actions_website integer DEFAULT 0,
  actions_directions integer DEFAULT 0,
  actions_calls integer DEFAULT 0,
  actions_messages integer DEFAULT 0,
  photo_views integer DEFAULT 0,
  recorded_at timestamptz DEFAULT now()
);

CREATE TABLE gbp_audit_scores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid REFERENCES gbp_listings NOT NULL,
  overall_score integer,
  completeness_score integer,
  photo_score integer,
  review_score integer,
  post_frequency_score integer,
  qa_score integer,
  findings jsonb,
  recommendations jsonb,
  tokens_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- AEO (Answer Engine Optimization)
CREATE TABLE aeo_checks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  client_id uuid REFERENCES clients NOT NULL,
  brand_name text NOT NULL,
  query_tested text NOT NULL,
  platform text CHECK (platform IN ('chatgpt','gemini','perplexity','copilot','claude')),
  brand_mentioned boolean DEFAULT false,
  mention_position text,
  mention_context text,
  competitor_mentions text[],
  sentiment text,
  full_response text,
  tokens_used integer DEFAULT 0,
  checked_at timestamptz DEFAULT now()
);

CREATE TABLE aeo_scores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients NOT NULL,
  agency_id uuid REFERENCES agencies NOT NULL,
  overall_score integer,
  chatgpt_score integer,
  gemini_score integer,
  perplexity_score integer,
  copilot_score integer,
  visibility_trend text,
  top_queries_found text[],
  top_queries_missing text[],
  recommendations jsonb,
  tokens_used integer DEFAULT 0,
  scored_at timestamptz DEFAULT now()
);

CREATE TABLE aeo_tracked_queries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients NOT NULL,
  query text NOT NULL,
  category text CHECK (category IN ('branded','product','service','competitor','industry')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Social Media
CREATE TABLE social_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  client_id uuid REFERENCES clients NOT NULL,
  platform text NOT NULL,
  content text NOT NULL,
  media_urls text[],
  hashtags text[],
  status text DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  engagement_likes integer DEFAULT 0,
  engagement_comments integer DEFAULT 0,
  engagement_shares integer DEFAULT 0,
  engagement_reach integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Email & CRM
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients NOT NULL,
  agency_id uuid REFERENCES agencies NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  tags text[],
  lead_score integer DEFAULT 0,
  pipeline_stage text DEFAULT 'lead' CHECK (pipeline_stage IN ('lead','qualified','proposal','won','lost')),
  source text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE email_campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  client_id uuid REFERENCES clients NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  body_html text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sent','failed')),
  recipients_count integer DEFAULT 0,
  opens integer DEFAULT 0,
  clicks integer DEFAULT 0,
  bounces integer DEFAULT 0,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE automations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  client_id uuid REFERENCES clients NOT NULL,
  name text NOT NULL,
  trigger_type text NOT NULL,
  trigger_config jsonb,
  actions jsonb NOT NULL,
  is_active boolean DEFAULT true,
  runs_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Reputation
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients NOT NULL,
  agency_id uuid REFERENCES agencies NOT NULL,
  platform text NOT NULL CHECK (platform IN ('google','facebook','yelp','trustpilot','other')),
  reviewer_name text,
  rating integer NOT NULL,
  review_text text,
  sentiment text CHECK (sentiment IN ('positive','neutral','negative')),
  response_text text,
  response_status text DEFAULT 'unresponded' CHECK (response_status IN ('unresponded','draft','responded')),
  review_date timestamptz,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Analytics & Reports
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  client_id uuid REFERENCES clients NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  date_range_start date NOT NULL,
  date_range_end date NOT NULL,
  data_json jsonb,
  narrative text,
  pdf_url text,
  tokens_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Geo-fencing
CREATE TABLE geo_fence_zones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  client_id uuid REFERENCES clients NOT NULL,
  name text NOT NULL,
  zone_type text CHECK (zone_type IN ('radius','polygon')),
  center_lat float8,
  center_lng float8,
  radius_meters integer,
  polygon_coordinates jsonb,
  address text,
  color text DEFAULT '#06B6D4',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE geo_campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id uuid REFERENCES geo_fence_zones NOT NULL,
  agency_id uuid REFERENCES agencies NOT NULL,
  client_id uuid REFERENCES clients NOT NULL,
  name text NOT NULL,
  trigger_type text CHECK (trigger_type IN ('enter','exit','dwell')),
  dwell_time_seconds integer,
  action_type text CHECK (action_type IN ('push','sms','whatsapp','email','ad_trigger')),
  message_title text,
  message_body text,
  message_image_url text,
  cta_text text,
  cta_url text,
  frequency_cap integer DEFAULT 1,
  active_days text[] DEFAULT '{mon,tue,wed,thu,fri,sat,sun}',
  active_hours_start time DEFAULT '00:00',
  active_hours_end time DEFAULT '23:59',
  status text DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed')),
  budget_daily numeric,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE geo_campaign_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid REFERENCES geo_campaigns NOT NULL,
  date date NOT NULL,
  zone_entries integer DEFAULT 0,
  triggers_sent integer DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  spend numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE geo_competitor_zones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  client_id uuid REFERENCES clients NOT NULL,
  competitor_name text NOT NULL,
  center_lat float8,
  center_lng float8,
  radius_meters integer DEFAULT 500,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Tokens & Billing
CREATE TABLE token_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  action text NOT NULL,
  module text NOT NULL,
  tokens_used integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  amount_usd numeric NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  payment_method text,
  razorpay_payment_id text,
  created_at timestamptz DEFAULT now()
);

-- Assets
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  client_id uuid REFERENCES clients,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text CHECK (file_type IN ('image','video','document','template')),
  tags text[],
  uploaded_by uuid REFERENCES users,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  user_id uuid REFERENCES users NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info','warning','success','error')),
  is_read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

-- Support System
CREATE TABLE knowledge_base_articles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  body text NOT NULL,
  category text CHECK (category IN ('getting_started','modules','billing','troubleshooting','integrations','faq')),
  tags text[],
  order_index integer DEFAULT 0,
  is_published boolean DEFAULT true,
  views integer DEFAULT 0,
  helpful_yes integer DEFAULT 0,
  helpful_no integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  user_id uuid REFERENCES users NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text CHECK (category IN ('bug','feature_request','billing','how_to','other')),
  status text DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority text DEFAULT 'normal',
  ai_response text,
  resolution text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE onboarding_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  user_id uuid REFERENCES users NOT NULL,
  step_key text NOT NULL,
  step_title text NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamptz
);

CREATE TABLE video_tutorials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  module text,
  duration_seconds integer,
  order_index integer DEFAULT 0,
  is_published boolean DEFAULT true,
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Exit Feedback
CREATE TABLE exit_feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid REFERENCES agencies NOT NULL,
  user_id uuid REFERENCES users NOT NULL,
  exit_type text CHECK (exit_type IN ('cancel_subscription','trial_expired','trial_cancel','downgrade','delete_account')),
  reason text CHECK (reason IN ('too_expensive','missing_features','too_complex','found_alternative','not_needed','bad_experience','other')),
  reason_detail text,
  missing_feature text,
  competitor_name text,
  price_willing_to_pay text,
  satisfaction_rating integer,
  would_return text CHECK (would_return IN ('yes','no','maybe')),
  additional_comments text,
  created_at timestamptz DEFAULT now()
);

-- Announcements
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  body text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
