export const PARAMETER_CATALOG = [
  // SEO
  { id: 'seo_score', label: 'SEO Score', module: 'seo', source: 'seo_audits.overall_score', displayType: 'score' },
  { id: 'keyword_movement', label: 'Keyword Movement', module: 'seo', source: 'keyword_trackers', displayType: 'trend' },
  { id: 'organic_traffic', label: 'Organic Traffic', module: 'seo', source: 'seo_audits', displayType: 'number' },
  // Social
  { id: 'social_engagement', label: 'Engagement Rate', module: 'social', source: 'social_posts', displayType: 'percentage' },
  { id: 'follower_growth', label: 'Follower Growth', module: 'social', source: 'social_posts', displayType: 'trend' },
  { id: 'posts_scheduled', label: 'Posts Scheduled', module: 'social', source: 'social_posts', displayType: 'number' },
  // GBP
  { id: 'gbp_rating', label: 'GBP Rating', module: 'gbp', source: 'gbp_listings', displayType: 'rating' },
  { id: 'gbp_unanswered_qa', label: 'Unanswered Q&A', module: 'gbp', source: 'gbp_qa', displayType: 'status' },
  // Reputation
  { id: 'avg_rating', label: 'Avg Review Rating', module: 'reputation', source: 'reviews', displayType: 'rating' },
  { id: 'unresponded_reviews', label: 'Unresponded Reviews', module: 'reputation', source: 'reviews', displayType: 'status' },
  // Content
  { id: 'content_awaiting_approval', label: 'Awaiting Approval', module: 'content', source: 'content_items', displayType: 'status' },
  { id: 'content_published', label: 'Published This Month', module: 'content', source: 'content_items', displayType: 'number' },
  // AEO
  { id: 'aeo_score', label: 'AEO Visibility', module: 'aeo', source: 'aeo_scores', displayType: 'score' },
  // Tasks
  { id: 'overdue_tasks', label: 'Overdue Tasks', module: 'tasks', source: 'tasks', displayType: 'status' },
  { id: 'open_tasks', label: 'Open Tasks', module: 'tasks', source: 'tasks', displayType: 'number' },
  { id: 'completion_rate', label: 'Task Completion Rate', module: 'tasks', source: 'tasks', displayType: 'percentage' },
];
