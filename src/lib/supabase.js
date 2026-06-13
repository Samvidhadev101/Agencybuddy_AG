// Mock Supabase Client using LocalStorage Database Fallback
let authListener = null;

class SupabaseQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.data = JSON.parse(localStorage.getItem(`db_${tableName}`) || '[]');
    this.filters = [];
    this.orderCol = null;
    this.orderAsc = true;
    this.limitCount = null;
  }

  select(columns) {
    // Chainable select
    return this;
  }

  eq(column, value) {
    this.filters.push(item => item[column] === value);
    return this;
  }

  neq(column, value) {
    this.filters.push(item => item[column] !== value);
    return this;
  }

  in(column, array) {
    this.filters.push(item => array.includes(item[column]));
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderCol = column;
    this.orderAsc = ascending;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  execute() {
    let result = [...this.data];
    // Apply filters
    for (const filter of this.filters) {
      result = result.filter(filter);
    }
    // Apply order
    if (this.orderCol) {
      result.sort((a, b) => {
        let valA = a[this.orderCol];
        let valB = b[this.orderCol];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (typeof valA === 'string') {
          return this.orderAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return this.orderAsc ? valA - valB : valB - valA;
      });
    }
    // Apply limit
    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }
    return result;
  }

  async insert(insertData) {
    const dataArray = Array.isArray(insertData) ? insertData : [insertData];
    const newItems = dataArray.map(item => ({
      id: item.id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)),
      created_at: new Date().toISOString(),
      ...item
    }));
    
    this.data.push(...newItems);
    localStorage.setItem(`db_${this.tableName}`, JSON.stringify(this.data));
    
    // Also dispatch database change event
    window.dispatchEvent(new Event('local_db_change'));

    return { data: Array.isArray(insertData) ? newItems : newItems[0], error: null };
  }

  async update(updateData) {
    let result = [...this.data];
    for (const filter of this.filters) {
      result = result.filter(filter);
    }
    const idsToUpdate = result.map(r => r.id);
    
    this.data = this.data.map(item => {
      if (idsToUpdate.includes(item.id)) {
        return { ...item, ...updateData };
      }
      return item;
    });
    localStorage.setItem(`db_${this.tableName}`, JSON.stringify(this.data));
    const updated = this.data.filter(item => idsToUpdate.includes(item.id));
    
    window.dispatchEvent(new Event('local_db_change'));

    return { data: updated, error: null };
  }

  async delete() {
    let result = [...this.data];
    for (const filter of this.filters) {
      result = result.filter(filter);
    }
    const idsToDelete = result.map(r => r.id);
    this.data = this.data.filter(item => !idsToDelete.includes(item.id));
    localStorage.setItem(`db_${this.tableName}`, JSON.stringify(this.data));
    
    window.dispatchEvent(new Event('local_db_change'));

    return { data: result, error: null };
  }

  then(onfulfilled, onrejected) {
    const result = this.execute();
    return Promise.resolve({ data: result, error: null }).then(onfulfilled, onrejected);
  }

  async single() {
    const result = this.execute();
    return { data: result[0] || null, error: result[0] ? null : { message: 'No row found' } };
  }

  async maybeSingle() {
    const result = this.execute();
    return { data: result[0] || null, error: null };
  }
}

// Function costs dictionary
const TOKEN_COSTS = {
  'seo-audit': 2,
  'keyword-research': 1,
  'blog-draft': 2,
  'social-captions': 1,
  'email-draft': 1,
  'ad-copy': 1,
  'review-response': 1,
  'report-narrative': 2,
  'content-calendar': 2,
  'competitor-analysis': 2,
  'gbp-post': 1,
  'gbp-desc-opt': 1,
  'gbp-qa-seed': 1,
  'gbp-audit': 2,
  'aeo-query-gen': 1,
  'aeo-audit': 3,
  'aeo-recs': 2,
  'geo-msg': 1,
  'aeo-run-check': 2,
  'aeo-calculate-score': 0,
  'aeo-recommendations': 2
};



function getMockOutput(action, input) {
  const clientName = input?.clientName || 'the client';
  const topic = input?.topic || 'digital marketing';
  const website = input?.websiteUrl || input?.url || 'the website';
  const industry = input?.industry || 'general business';
  const narrativeInput = input?.narrativeInput || '';
  const address = input?.address || 'local store';
  const primaryCategory = input?.primaryCategory || 'local service';
  const reviewText = input?.reviewText || '';
  const rating = input?.rating || 5;
  const reviewerName = input?.reviewerName || 'Customer';

  switch (action) {
    case 'keyword-research':
      return JSON.stringify([
        { keyword: `best ${topic || 'services'} near me`, volume: 1200, difficulty: 24, cpc: 1.85 },
        { keyword: `${clientName.toLowerCase()} reviews`, volume: 450, difficulty: 12, cpc: 0.60 },
        { keyword: `affordable ${industry || 'business'} in bangalore`, volume: 900, difficulty: 32, cpc: 2.20 },
        { keyword: `${topic || 'marketing'} delivery indiranagar`, volume: 600, difficulty: 18, cpc: 1.10 }
      ]);

    case 'blog-draft':
      return `# The Definitive Guide to Aromatic Food & Regional Spices\n\nRegional cooking represents more than just a recipe; it is a legacy passed down through generations. A great dish balances standard spices with traditional preparation styles.\n\n## 1. Selecting Traditional Grains\nUsing regional grains like Seeraga Samba rice allows maximum absorption of flavors and juices. Unlike long-grained basmati, Samba rice maintains a firm bite and complements rich gravies perfectly.\n\n## 2. Slow Cooking Methods\nSlow cooking or "dum" locks in moisture, ensuring that meat becomes tender and slides off the bone. Always seal the lid with wheat dough for optimal results.\n\n## Summary\nWhether you are dining in or ordering home delivery, paying attention to traditional ingredients is key.`;

    case 'social-captions':
      return `Option 1: Steaming fresh specials waiting for you! 🏏🍗 Drop by or order local delivery. #KonguCuisine #FoodLovers\n\nOption 2: Make your family lunch plans legendary with our traditional recipes! 🔥 #FamilyTime #GoodFood\n\nOption 3: Cooked with regional spices and lots of love. Taste the difference today! #TraditionalTaste`;

    case 'email-draft':
      return `Subject: Special weekend coupon inside! 🏏🍗\n\nDear customer,\n\nWeekends are meant for traditional family lunches prepared with fresh regional ingredients!\n\nUse coupon BUDDY15 to save flat 15% off delivery orders this weekend.\n\nWarm regards,\n${clientName}`;

    case 'review-response':
      return `Dear ${reviewerName},\n\nThank you so much for the ${rating}-star feedback! We are thrilled that you enjoyed our services. Our team works hard to maintain these standards, and we look forward to serving you again soon.\n\nBest wishes,\n${clientName} Team`;

    case 'report-narrative':
      return `Monthly Performance Summary for ${clientName}:\n\n- Organic search rankings rose by 14% on target local queries.\n- Google Business Profile views increased by 28% following description and photo optimizations.\n- Review responses were updated within 24 hours, boosting client sentiment scores.`;

    case 'gbp-desc-opt':
      return `Serving authentic regional cuisine and special family recipes in a high-hygiene kitchen. Come taste our famous dishes prepared with organic ingredients, fresh spices, and traditional methods at ${address || 'our local branch'}.`;

    case 'gbp-qa-seed':
      return JSON.stringify([
        { question: "What are your popular dishes?", answer: "Our special regional biryani and mutton chops are highly recommended by customers." },
        { question: "Do you offer parking facilities?", answer: "Yes, we have dedicated valet and customer parking spaces available." },
        { question: "Are card and UPI payments accepted?", answer: "Yes, we accept all credit cards, debit cards, Google Pay, and standard UPI apps." }
      ]);

    case 'aeo-query-gen':
      return JSON.stringify([
        `where to get best ${industry || 'services'} in bangalore`,
        `is ${clientName} reliable for local deliveries`,
        `customer reviews for ${clientName} dentist`,
        `pricing packages of ${clientName} marketing`
      ]);

    case 'aeo-audit':
      return JSON.stringify({
        score: 82,
        chatgpt: 85,
        gemini: 78,
        perplexity: 90,
        copilot: 75,
        visibility_trend: "upward",
        checks: [
          {
            query: `best ${industry || 'services'} in Bangalore`,
            chatgpt: true,
            gemini: true,
            perplexity: true,
            copilot: true,
            position: "Ranked 2nd",
            sentiment: "positive",
            response: `${clientName} is highly recommended for premium services in Bangalore due to positive client reviews and pain-free solutions.`
          },
          {
            query: `is ${clientName} recommended`,
            chatgpt: true,
            gemini: false,
            perplexity: true,
            copilot: false,
            position: "Citation 3",
            sentiment: "positive",
            response: `Yes, customers praise ${clientName} for their rotary root canals and prompt delivery.`
          }
        ]
      });

    case 'geo-msg':
      return `Quick Promo: Step inside ${clientName} in the next 15 minutes to get a free side dish or cold drink with your order!`;

    default:
      return `Simulated output for action: ${action}`;
  }
}

async function callAI(prompt, systemPrompt, agencyId, jsonMode = false, isSerp = false) {
  const agencies = JSON.parse(localStorage.getItem('db_agencies') || '[]');
  const agency = agencies.find(a => a.id === agencyId);

  if (!agency || !agency.openrouter_api_key) {
    return {
      success: false,
      text: 'AI is not configured. Please add your OpenRouter API key in Settings.'
    };
  }

  const apiKey = agency.openrouter_api_key;
  let model = agency.preferred_model || 'google/gemini-2.0-flash-exp:free';
  if (isSerp) {
    model = 'perplexity/sonar';
  }
  
  const body = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4096
    };
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://agencyos.in',
        'X-Title': 'Agency OS'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.error) {
      if (data.error.code === 401 || data.error.code === 403) {
        return { success: false, text: 'Your AI API key is invalid or expired. Please update it in Settings.' };
      }
      if (data.error.code === 429) {
        return { success: false, text: 'AI rate limit reached. Please wait a moment and try again.' };
      }
      if (data.error.code === 402) {
        return { success: false, text: 'Your OpenRouter balance is empty. Add credits at openrouter.ai or switch to a free model in Settings.' };
      }
      if (data.error.code === 502 || data.error.code === 503) {
        const rawMsg = data.error.metadata?.raw || data.error.metadata?.previous_errors?.[0]?.raw || '';
        return { success: false, text: `The selected AI model is temporarily overloaded or offline upstream. Please try again shortly or select a different model in Settings. ${rawMsg}` };
      }
      
      return { success: false, text: `AI request failed: ${data.error.message || JSON.stringify(data.error)}` };
    }

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const returnedModel = data.model || model;
      let modelDisplayName = returnedModel.split('/').pop();
      if (modelDisplayName.includes(':free')) modelDisplayName = modelDisplayName.replace(':free', ' (Free)');

      return {
        success: true,
        text: data.choices[0].message.content,
        modelName: modelDisplayName
      };
    }

    return { success: false, text: 'AI returned an empty response. Please try again.' };

  } catch (error) {
    return { success: false, text: 'AI is temporarily unavailable. Please try again in a moment.' };
  }
}

async function generateAIContent(action, input, agencyId) {
  let systemPrompt = '';
  let userPrompt = '';

  const clientName = input?.clientName || 'the client';
  const topic = input?.topic || 'digital marketing';
  const website = input?.websiteUrl || input?.url || 'the website';
  const industry = input?.industry || 'general business';
  const narrativeInput = input?.narrativeInput || '';
  const address = input?.address || 'local store';
  const primaryCategory = input?.primaryCategory || 'local service';
  const reviewText = input?.reviewText || '';
  const rating = input?.rating || 5;
  const reviewerName = input?.reviewerName || 'Customer';
  const queriesList = input?.queries ? input.queries.join(', ') : 'best services near me';

  switch (action) {
    case 'seo-audit':
      systemPrompt = "You are a professional SEO Audit bot. Return ONLY a valid JSON object matching this schema: { \"score\": integer(0-100), \"onpage\": integer(0-100), \"technical\": integer(0-100), \"content\": integer(0-100), \"mobile\": integer(0-100), \"findings\": [ { \"parameter\": string, \"severity\": \"critical\"|\"warning\"|\"good\", \"title\": string, \"description\": string, \"recommendation\": string } ] }. STRICT RULES: Do not include markdown formatting or wrappers like ```json. You must escape all inner quotes with backslashes. Do not use unescaped newlines in strings. The output must be perfectly parsable by JSON.parse().";
      const parametersList = "Keyword Overview, Current Rankings, Search Volume, Keyword Difficulty, Search Intent, Traffic Distribution, Top Pages by Traffic, Performance by Device, Performance by Geography, Click-Through Rate (CTR), Backlink Profile, Competitor Analysis, Content Gaps, Technical SEO Overview, Core Web Vitals, Crawl Errors";
      if (input.scrapedText) {
        userPrompt = `Perform a comprehensive SEO Audit for website "${website}". Here is the actual metadata, content, and real Google PageSpeed Insights data scraped from the live site: \n\n${input.scrapedText}\n\nAnalyze this data. Generate realistic scores and provide exactly 16 findings, one for each of these parameters: ${parametersList}. Each finding must include a 'parameter' field set to the exact parameter name, 'severity' (critical/warning/good), a short 'title', 'description' detailing the finding, and 'recommendation' explaining how to fix it.\n\nCRITICAL: You MUST use the Real Google PageSpeed Data provided above to populate the "Technical SEO Overview", "Core Web Vitals", and "Performance by Device" findings accurately. For Traffic, Keyword, and Backlink metrics, simulate realistic industry-standard values.`;
      } else {
        userPrompt = `Perform a comprehensive SEO Audit for website "${website}" (Client: "${clientName}", Industry: "${industry}"). Generate realistic scores and provide exactly 16 findings, one for each of these parameters: ${parametersList}. Each finding must include a 'parameter' field set to the exact parameter name, 'severity' (critical/warning/good), a short 'title', 'description' detailing the finding, and 'recommendation' explaining how to fix it.`;
      }
      break;
    case 'keyword-research':
      systemPrompt = "You are a local search keyword strategist. Return ONLY a valid JSON array of objects matching this schema: [ { \"keyword\": string, \"volume\": integer, \"difficulty\": integer(0-100), \"cpc\": number } ]. Generate 4 relevant keywords. Do not include markdown code block wrappers.";
      userPrompt = `Generate 4 search keywords for the topic: "${topic}" for client "${clientName}" in the ${industry} industry. Include search volumes, ranking difficulty, and estimated CPC.`;
      break;
    case 'blog-draft':
      systemPrompt = "You are a senior SEO content writer. Write a comprehensive, high-quality, engaging blog post in Markdown format. Keep the formatting clean.";
      userPrompt = `Draft an SEO-optimized blog post about: "${topic}" for the client "${clientName}" in the ${industry} industry. Include headings, bullet points, and an introduction/conclusion.`;
      break;
    case 'social-captions':
      systemPrompt = "You are a social media copywriter. Write engaging post copy with emojis and relevant hashtags.";
      userPrompt = `Write 3 creative social media captions on the topic: "${topic}" for client "${clientName}". Separate them clearly.`;
      break;
    case 'email-draft':
      systemPrompt = "You are an email copywriter. Write a professional marketing email template including a clear Subject line and Body. Use placeholders like {{contact_name}} or {{client_name}}.";
      userPrompt = `Compose a promotional or cold outreach email template about: "${topic}" for client "${clientName}".`;
      break;
    case 'review-response':
      systemPrompt = "You are a customer success manager representing the business. Respond politely, professionally, and address the specific feedback left by the customer.";
      userPrompt = `Draft a review response to a customer review: "${reviewText}" with rating ${rating} stars by reviewer "${reviewerName}" for the business "${clientName}".`;
      break;
    case 'report-narrative':
      systemPrompt = "You are an executive digital marketing consultant. Write a professional monthly performance narrative summary highlighting wins, challenges, and next steps.";
      userPrompt = `Write a monthly performance narrative for client "${clientName}" (Industry: "${industry}") based on these inputs: "${narrativeInput}".`;
      break;
    case 'gbp-desc-opt':
      systemPrompt = "You are a Google Business Profile optimization expert. Write an optimized local business description under 750 characters focusing on local search relevance.";
      userPrompt = `Optimize the GBP business description for: "${clientName}", Category: "${primaryCategory}", Address: "${address}".`;
      break;
    case 'gbp-qa-seed':
      systemPrompt = "You are a Google Business Profile setup specialist. Return ONLY a valid JSON array of objects matching this schema: [ { \"question\": string, \"answer\": string } ]. Generate 3 commonly asked questions and answers. Do not wrap in markdown.";
      userPrompt = `Generate 3 Q&A seed items for client "${clientName}" which runs a "${industry}" business at "${address}".`;
      break;
    case 'aeo-query-gen':
      systemPrompt = "You are an Answer Engine Optimization strategist. Return ONLY a valid JSON array of 20 natural search query strings. Do not wrap in markdown.";
      userPrompt = `Generate 20 natural search queries that potential customers would ask an AI assistant when looking for products/services in "${industry}" for a brand called "${clientName}". Mix branded queries, product queries, service queries, and 'best X' comparison queries. Return as a JSON array of strings only.`;
      break;
    case 'aeo-recommendations':
      systemPrompt = "You are an SEO/AEO consultant. Return ONLY a valid JSON array of 5 recommendation objects. Schema: [ { \"title\": string, \"reason\": string, \"priority\": \"high\"|\"medium\"|\"low\", \"queries\": string } ]. Do not wrap in markdown.";
      userPrompt = `A brand called "${clientName}" scores ${input?.score || 50}/100 on AI search visibility. It does NOT appear when users ask these queries: ${input?.missing_queries || 'local services'}. Generate 5 specific, actionable content recommendations to improve the brand's visibility in AI search results. For each: a title, the reason it helps AEO, a priority, and which queries it would improve.`;
      break;
    case 'aeo-audit':
      // Legacy mock audit left for fallback if needed
      systemPrompt = "You are an Answer Engine Optimization (AEO) visibility crawler. Return ONLY a valid JSON object matching this schema: { \"score\": integer(0-100), \"chatgpt\": integer(0-100), \"gemini\": integer(0-100), \"perplexity\": integer(0-100), \"copilot\": integer(0-100), \"visibility_trend\": \"upward\"|\"stable\"|\"downward\", \"checks\": [ { \"query\": string, \"chatgpt\": boolean, \"gemini\": boolean, \"perplexity\": boolean, \"copilot\": boolean, \"position\": string|null, \"sentiment\": \"positive\"|\"neutral\"|\"negative\", \"response\": string } ] }. Do not include markdown code block wrappers.";
      userPrompt = `Generate a realistic simulated AEO audit report for "${clientName}" (Industry: "${industry}") checking these test queries: ${queriesList}. Create citation checks for ChatGPT, Gemini, Perplexity, and Copilot.`;
      break;
    case 'geo-msg':
      systemPrompt = "You are a hyper-local geofenced notifications copywriter. Write a brief, high-conversion mobile push notification under 160 characters containing an offer/CTA.";
      userPrompt = `Write a geofenced promo message for visitors walking near "${clientName}" (Industry: "${industry}").`;
      break;
    case 'keyword-serp':
      systemPrompt = "You are a SERP analyzer. Return ONLY a valid JSON object matching this schema: { \"results\": [ { \"position\": 1, \"url\": \"string\", \"domain\": \"string\", \"page_title\": \"string\", \"summary\": \"string\" } ], \"content_gaps\": [ \"string\" ] }. Do not include markdown code block wrappers.";
      userPrompt = `Perform a live web search for the keyword "${input.keyword}" in location "${input.location}". Summarize the top 10 organic search results and identify 2-3 content gaps.`;
      break;
    case 'keyword-enrich':
      systemPrompt = "You are an SEO strategist. Return ONLY valid JSON: { \"clusters\": [{ \"cluster_name\": \"string\", \"keywords\": [{ \"keyword\": \"string\", \"intent\": \"informational|commercial|transactional|navigational\", \"competition\": \"high|medium|low\", \"priority\": 1-10 }]}] }";
      userPrompt = `Here is a list of keywords for a ${input.industry} business: ${input.keywords}. For each keyword return: intent, competition, and priority score 1-10. Group them into 4-8 topic clusters.`;
      break;
    default:
      systemPrompt = "You are a helpful AI assistant.";
      userPrompt = `Execute operation ${action} with input parameters: ${JSON.stringify(input)}.`;
  }

  // Check if the action expects a structured JSON output
  const isJsonAction = ['seo-audit', 'keyword-research', 'gbp-qa-seed', 'aeo-query-gen', 'aeo-audit', 'aeo-recommendations', 'keyword-serp', 'keyword-enrich'].includes(action);

  const isSerpAction = action === 'keyword-serp';

  const aiResult = await callAI(userPrompt, systemPrompt, agencyId, isJsonAction, isSerpAction);

  if (!aiResult.success) {
    return { error: aiResult.text };
  }

  let contentText = aiResult.text;
  const modelName = aiResult.modelName || 'OpenRouter AI';

  if (isJsonAction) {
    let expectedKeys = [];
    let fallback = null;
    let schemaDesc = '';
    
    switch(action) {
      case 'seo-audit':
        expectedKeys = ['overall_score','onpage_score','technical_score','content_score','mobile_score','findings'];
        fallback = { overall_score: 0, findings: [] };
        schemaDesc = 'SEO Audit (keys: overall_score, findings, etc)';
        break;
      case 'keyword-enrich':
        expectedKeys = ['clusters'];
        fallback = { clusters: [] };
        break;
      case 'keyword-serp':
        expectedKeys = ['results'];
        fallback = { results: [] };
        break;
      case 'aeo-audit':
        expectedKeys = ['score', 'checks'];
        fallback = { score: 0, checks: [] };
        schemaDesc = 'AEO Audit (keys: score, checks)';
        break;
      case 'gbp-qa-seed':
      case 'aeo-query-gen':
      case 'keyword-research':
        expectedKeys = []; // Array output, skip unwrap
        fallback = [];
        break;
      case 'aeo-recommendations':
        expectedKeys = []; // Array of objects
        fallback = [];
        break;
    }

    let parsedResult = parseAIJson(contentText, expectedKeys, fallback);
    
    // Optional AI self-repair for critical features
    if (!parsedResult.success && (action === 'seo-audit' || action === 'aeo-audit' || action === 'report-narrative')) {
       console.warn(`[parseAIJson] Failed to parse ${action}, attempting AI repair...`);
       const repairPrompt = `The following text should be valid JSON matching this structure: ${schemaDesc}. Fix it and return ONLY the corrected raw JSON, no markdown, no commentary:\n\n${contentText}`;
       const repairAiResult = await callAI(repairPrompt, 'You are a JSON repair tool. Return only valid raw JSON.', agencyId, true, false);
       if (repairAiResult.success) {
         const repairedParsed = parseAIJson(repairAiResult.text, expectedKeys, fallback);
         if (repairedParsed.success) {
            parsedResult = repairedParsed;
         }
       }
    }
    
    if (!parsedResult.success) {
      return { error: 'The analysis could not be processed this time. Please try again.' };
    }
    
    let finalData = parsedResult.data;
    
    // Type coercion and defaults per feature
    if (action === 'seo-audit') {
      ['overall_score','onpage_score','technical_score','content_score','mobile_score'].forEach(k => {
        finalData[k] = Number(finalData[k]) || 0;
      });
      if (!Array.isArray(finalData.findings)) finalData.findings = [];
    } else if (action === 'keyword-enrich') {
      if (!Array.isArray(finalData.clusters)) finalData.clusters = [];
    } else if (action === 'keyword-serp') {
      if (!Array.isArray(finalData.results)) finalData.results = [];
    }
    
    return { data: { output: JSON.stringify(finalData), is_live_api: true, model_name: modelName }, error: null };
  }

  return { data: { output: contentText, is_live_api: true, model_name: modelName }, error: null };
}

async function simulateAiGenerate(body) {
  const { action, input, agency_id } = body;

  // Pre-flight check for API Key
  const agencies = JSON.parse(localStorage.getItem('db_agencies') || '[]');
  const matchedAgency = agencies.find(a => a.id === agency_id);
  
  if (!matchedAgency || !matchedAgency.openrouter_api_key) {
    return { error: 'AI features are disabled. Add your OpenRouter API key in Settings to get started.' };
  }

  // Generate content using OpenRouter backend
  const response = await generateAIContent(action, input, agency_id);
  
  if (!response.error) {
    window.dispatchEvent(new Event('local_db_change'));
  }

  return response;
}

// ------------------------------------------------------------------
// AEO ENGINE SPECIFIC FUNCTIONS
// ------------------------------------------------------------------

async function runAeoCheckMultiModel(body, matchedAgency) {
  const { action, input, agency_id } = body;

  const { query, brand_name, competitors, client_id } = input;
  const compArray = (competitors || '').split(',').map(s => s.trim()).filter(Boolean);

  const models = [
    { id: 'openai/gpt-4o-mini', platform: 'chatgpt' },
    { id: 'google/gemini-2.0-flash-exp', platform: 'gemini' },
    { id: 'perplexity/sonar', platform: 'perplexity' },
    { id: 'anthropic/claude-3.5-haiku', platform: 'claude' }
  ];

  const systemPrompt = "You are a helpful assistant. Answer the user's question naturally and concisely, recommending specific brands or companies where relevant.";
  const checksToInsert = [];

  // Run in parallel
  const promises = models.map(async (m) => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${matchedAgency.openrouter_api_key}`,
          'HTTP-Referer': 'https://agencyos.in',
          'X-Title': 'Agency OS'
        },
        body: JSON.stringify({
          model: m.id,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      let fullResponse = '';
      if (data.choices && data.choices[0] && data.choices[0].message) {
        fullResponse = data.choices[0].message.content;
      } else {
        fullResponse = "Model unavailable or error returned.";
      }

      // Analyze response via fast string matching
      const rLower = fullResponse.toLowerCase();
      const bLower = brand_name.toLowerCase();
      const brandMentioned = rLower.includes(bLower);

      let position = null;
      let context = null;
      let sentiment = 'neutral';
      
      if (brandMentioned) {
        const brandIdx = rLower.indexOf(bLower);
        if (brandIdx < rLower.length / 3) position = 'first';
        else if (brandIdx < (rLower.length / 3) * 2) position = 'middle';
        else position = 'last';

        // Extract context sentence
        const sentences = fullResponse.match(/[^.!?]+[.!?]+/g) || [fullResponse];
        const ctxSentence = sentences.find(s => s.toLowerCase().includes(bLower)) || '';
        context = ctxSentence.trim();

        // Basic sentiment heuristics in the context
        const posWords = ['best', 'great', 'excellent', 'recommend', 'top', 'highly', 'reliable', 'good'];
        const negWords = ['bad', 'worst', 'avoid', 'terrible', 'poor', 'dont'];
        let posScore = 0; let negScore = 0;
        posWords.forEach(w => { if(context.toLowerCase().includes(w)) posScore++; });
        negWords.forEach(w => { if(context.toLowerCase().includes(w)) negScore++; });
        
        if (posScore > negScore) sentiment = 'positive';
        else if (negScore > posScore) sentiment = 'negative';
      }

      const compMentions = [];
      compArray.forEach(c => {
        if (rLower.includes(c.toLowerCase())) compMentions.push(c);
      });

      checksToInsert.push({
        id: 'chk_' + Math.random().toString(36).substring(2, 9),
        client_id,
        agency_id,
        query_tested: query,
        platform: m.platform,
        brand_mentioned: brandMentioned,
        mention_position: position,
        mention_context: context,
        competitor_mentions: compMentions,
        sentiment,
        full_response: fullResponse,
        created_at: new Date().toISOString()
      });

    } catch (e) {
      console.error("Model fetch error", e);
      checksToInsert.push({
        id: 'chk_' + Math.random().toString(36).substring(2, 9),
        client_id,
        agency_id,
        query_tested: query,
        platform: m.platform,
        brand_mentioned: false,
        mention_position: null,
        mention_context: null,
        competitor_mentions: [],
        sentiment: 'neutral',
        full_response: 'Platform unavailable during test.',
        created_at: new Date().toISOString()
      });
    }
  });

  await Promise.all(promises);

  // Save to db
  const existingChecks = JSON.parse(localStorage.getItem('db_aeo_checks') || '[]');
  existingChecks.push(...checksToInsert);
  localStorage.setItem('db_aeo_checks', JSON.stringify(existingChecks));
  
  window.dispatchEvent(new Event('local_db_change'));

  return { data: { success: true, checks: checksToInsert }, error: null };
}

async function calculateAeoScore(body) {
  const { input, agency_id } = body;
  const { client_id } = input;

  const allChecks = JSON.parse(localStorage.getItem('db_aeo_checks') || '[]');
  const clientChecks = allChecks.filter(c => c.client_id === client_id);

  if (clientChecks.length === 0) {
    return { data: { message: "No checks found" }, error: null };
  }

  // Get most recent checks per query per platform
  const latestChecksMap = {};
  clientChecks.forEach(c => {
    const key = `${c.query_tested}_${c.platform}`;
    if (!latestChecksMap[key] || new Date(c.created_at) > new Date(latestChecksMap[key].created_at)) {
      latestChecksMap[key] = c;
    }
  });
  const latestChecks = Object.values(latestChecksMap);

  const platforms = ['chatgpt', 'gemini', 'perplexity', 'claude'];
  const pScores = {};
  
  platforms.forEach(p => {
    const pChecks = latestChecks.filter(c => c.platform === p);
    if (pChecks.length === 0) {
      pScores[p] = 0;
      return;
    }
    
    let totalScore = 0;
    pChecks.forEach(c => {
      if (c.brand_mentioned) {
        if (c.mention_position === 'first') totalScore += 100;
        else if (c.mention_position === 'middle') totalScore += 70;
        else totalScore += 40;
      }
    });
    pScores[p] = Math.round(totalScore / pChecks.length);
  });

  const overall = Math.round((pScores.chatgpt + pScores.gemini + pScores.perplexity + pScores.claude) / 4);

  // Queries found/missing
  const uniqueQueries = [...new Set(latestChecks.map(c => c.query_tested))];
  const queryStats = uniqueQueries.map(q => {
    const qChecks = latestChecks.filter(c => c.query_tested === q);
    const platformsMentioned = qChecks.filter(c => c.brand_mentioned).length;
    return { query: q, mentionedCount: platformsMentioned };
  });

  const top_queries_found = queryStats.filter(q => q.mentionedCount >= 2).map(q => q.query);
  const top_queries_missing = queryStats.filter(q => q.mentionedCount === 0).map(q => q.query);

  const scoresDb = JSON.parse(localStorage.getItem('db_aeo_scores') || '[]');
  const previousScoreRow = scoresDb.find(s => s.client_id === client_id);
  
  let trend = 'stable';
  if (previousScoreRow) {
    if (overall > previousScoreRow.overall_score) trend = 'upward';
    if (overall < previousScoreRow.overall_score) trend = 'downward';
  }

  const newScoreRow = {
    id: previousScoreRow?.id || 'sco_' + Math.random().toString(36).substring(2, 9),
    client_id,
    agency_id,
    overall_score: overall,
    chatgpt_score: pScores.chatgpt,
    gemini_score: pScores.gemini,
    perplexity_score: pScores.perplexity,
    copilot_score: pScores.claude, // using copilot_score field to mean claude for backwards compat
    visibility_trend: trend,
    top_queries_found,
    top_queries_missing,
    created_at: new Date().toISOString()
  };

  if (previousScoreRow) {
    Object.assign(previousScoreRow, newScoreRow);
  } else {
    scoresDb.push(newScoreRow);
  }

  localStorage.setItem('db_aeo_scores', JSON.stringify(scoresDb));
  window.dispatchEvent(new Event('local_db_change'));

  return { data: newScoreRow, error: null };
}

export const supabase = {
  auth: {
    signUp: async ({ email, password, options }) => {
      const full_name = options?.data?.full_name || 'Owner';
      const agency_name = options?.data?.agency_name || 'Alpha Marketing';
      
      const newUser = { id: 'usr_' + Math.random().toString(36).substring(2, 9), email, user_metadata: { full_name } };
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      localStorage.setItem('auth_session', JSON.stringify({ user: newUser }));
      
      const agencyId = 'age_' + Math.random().toString(36).substring(2, 9);
      
      // Update agencies list
      const agencies = JSON.parse(localStorage.getItem('db_agencies') || '[]');
      const newAgency = {
        id: agencyId,
        name: agency_name,
        logo_url: null,
        website: '',
        plan: 'trial',
        api_keys: {},
        grok_api_key: '',
        grok_model: 'grok-3-mini',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        primary_color: '#06B6D4',
        secondary_color: '#111827',
        auto_aeo_on_client_add: true,
        created_at: new Date().toISOString()
      };
      agencies.push(newAgency);
      localStorage.setItem('db_agencies', JSON.stringify(agencies));

      // Update users list
      const users = JSON.parse(localStorage.getItem('db_users') || '[]');
      const newDbUser = {
        id: newUser.id,
        agency_id: agencyId,
        full_name,
        email,
        role: 'admin',
        phone: options?.data?.phone || '',
        avatar_url: null,
        status: 'active',
        theme_preference: 'light',
        created_at: new Date().toISOString()
      };
      users.push(newDbUser);
      localStorage.setItem('db_users', JSON.stringify(users));

      // Save onboarding checklist steps
      const onboardingSteps = [
        { id: '1', step_key: 'setup_agency', step_title: 'Setup Agency Profile', is_completed: true, completed_at: new Date().toISOString() },
        { id: '2', step_key: 'add_client', step_title: 'Add First Client', is_completed: false },
        { id: '3', step_key: 'run_seo_audit', step_title: 'Run First SEO Audit', is_completed: false },
        { id: '4', step_key: 'connect_gbp', step_title: 'Verify GBP Listing', is_completed: false },
        { id: '5', step_key: 'check_aeo', step_title: 'Check AEO Brand Visibility', is_completed: false },
        { id: '6', step_key: 'compose_post', step_title: 'Create Social Post Draft', is_completed: false },
        { id: '7', step_key: 'write_ai_content', step_title: 'Draft Blog with AI Writer', is_completed: false },
        { id: '8', step_key: 'create_contact', step_title: 'Add Lead in CRM Contacts', is_completed: false },
        { id: '9', step_key: 'setup_geofence', step_title: 'Draw active Geo-fence zone', is_completed: false },
        { id: '10', step_key: 'invite_member', step_title: 'Invite Team Member', is_completed: false }
      ].map(step => ({
        ...step,
        agency_id: agencyId,
        user_id: newUser.id
      }));
      localStorage.setItem('db_onboarding_progress', JSON.stringify(onboardingSteps));

      if (authListener) authListener('SIGNED_IN', { user: newUser });
      return { data: { user: newUser }, error: null };
    },

    signInWithPassword: async ({ email, password }) => {
      const users = JSON.parse(localStorage.getItem('db_users') || '[]');
      const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        // Admin hardcoded credential check
        const isAdminEmail = email.toLowerCase() === 'admin@agencybuddy.io';
        const correctPassword = isAdminEmail ? 'Admin@123' : 'password';
        if (password !== correctPassword && password !== 'password') {
          return { data: null, error: { message: 'Incorrect password. Please try again.' } };
        }
        const sessionUser = { id: matched.id, email: matched.email, user_metadata: { full_name: matched.full_name } };
        localStorage.setItem('auth_user', JSON.stringify(sessionUser));
        localStorage.setItem('auth_session', JSON.stringify({ user: sessionUser }));
        if (authListener) authListener('SIGNED_IN', { user: sessionUser });
        return { data: { user: sessionUser }, error: null };
      }
      return { data: null, error: { message: 'Account not found. Please sign up first.' } };
    },

    signOut: async () => {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_session');
      if (authListener) authListener('SIGNED_OUT', null);
      return { error: null };
    },

    getUser: async () => {
      const u = localStorage.getItem('auth_user');
      return { data: { user: u ? JSON.parse(u) : null }, error: null };
    },

    getSession: async () => {
      const s = localStorage.getItem('auth_session');
      return { data: { session: s ? JSON.parse(s) : null }, error: null };
    },

    onAuthStateChange: (callback) => {
      authListener = callback;
      const u = localStorage.getItem('auth_user');
      if (u) {
        callback('SIGNED_IN', { user: JSON.parse(u) });
      } else {
        callback('SIGNED_OUT', null);
      }
      return { data: { subscription: { unsubscribe: () => { authListener = null; } } } };
    }
  },
  from: (tableName) => new SupabaseQueryBuilder(tableName),
  storage: {
    from: (bucket) => ({
      upload: async (path, file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result;
            const dbKey = `db_storage_${bucket}`;
            const storageDb = JSON.parse(localStorage.getItem(dbKey) || '{}');
            storageDb[path] = base64data;
            localStorage.setItem(dbKey, JSON.stringify(storageDb));
            window.dispatchEvent(new Event('local_db_change'));
            resolve({ data: { path }, error: null });
          };
          reader.onerror = () => resolve({ data: null, error: { message: 'Failed to read file' } });
          reader.readAsDataURL(file);
        });
      },
      getPublicUrl: (path) => {
        const dbKey = `db_storage_${bucket}`;
        const storageDb = JSON.parse(localStorage.getItem(dbKey) || '{}');
        const dataUrl = storageDb[path] || '';
        return { data: { publicUrl: dataUrl } };
      },
      remove: async (paths) => {
        const dbKey = `db_storage_${bucket}`;
        const storageDb = JSON.parse(localStorage.getItem(dbKey) || '{}');
        paths.forEach(p => delete storageDb[p]);
        localStorage.setItem(dbKey, JSON.stringify(storageDb));
        window.dispatchEvent(new Event('local_db_change'));
        return { data: paths, error: null };
      }
    })
  },
  functions: {
    invoke: async (functionName, { body }) => {
      // Intercept missing AI key before calling simulateAiGenerate
      const agencies = JSON.parse(localStorage.getItem('db_agencies') || '[]');
      const matchedAgency = agencies.find(a => a.id === body.agency_id);
      
      if (!matchedAgency || !matchedAgency.openrouter_api_key) {
        window.dispatchEvent(new Event('show_ai_key_modal'));
        return { data: null, error: { message: 'AI features are disabled. Add your OpenRouter API key in Settings to get started.' } };
      }

      if (body.action === 'aeo-run-check') {
        return await runAeoCheckMultiModel(body, matchedAgency);
      }
      if (body.action === 'aeo-calculate-score') {
        return await calculateAeoScore(body);
      }
      if (body.action === 'aeo-recommendations') {
         // Fallthrough to simulateAiGenerate which will handle it normally,
         // but save it to db_aeo_recommendations after.
         const res = await simulateAiGenerate(body);
         if (!res.error && res.data && res.data.output) {
            const recsDb = JSON.parse(localStorage.getItem('db_aeo_recommendations') || '[]');
            const newRecs = {
              id: 'rec_' + Math.random().toString(36).substring(2, 9),
              client_id: body.input.client_id,
              agency_id: body.agency_id,
              recommendations: JSON.parse(res.data.output),
              created_at: new Date().toISOString()
            };
            recsDb.push(newRecs);
            localStorage.setItem('db_aeo_recommendations', JSON.stringify(recsDb));
         }
         return res;
      }

      if (body.action === 'auto-audit-client') {
        const { clientId, agencyId } = body;
        
        // Fire and forget worker
        setTimeout(async () => {
          try {
            const updateStatus = (field, value) => {
              const clientsDb = JSON.parse(localStorage.getItem('db_clients') || '[]');
              const updated = clientsDb.map(c => c.id === clientId ? { ...c, [field]: value } : c);
              localStorage.setItem('db_clients', JSON.stringify(updated));
              window.dispatchEvent(new Event('local_db_change'));
            };
            
            const clientsDb = JSON.parse(localStorage.getItem('db_clients') || '[]');
            const client = clientsDb.find(c => c.id === clientId);
            if (!client) return;
            
            // SEO Audit
            if (client.website) {
              updateStatus('seo_audit_status', 'running');
              const seoRes = await simulateAiGenerate({ action: 'seo-audit', input: { url: client.website, client_id: clientId }, agency_id: agencyId });
              updateStatus('seo_audit_status', seoRes.error ? 'failed' : 'complete');
            } else {
              updateStatus('seo_audit_status', 'skipped');
            }
            
            // AEO Baseline
            if (matchedAgency.auto_aeo_on_client_add !== false && client.name) {
              updateStatus('aeo_audit_status', 'running');
              const queriesRes = await simulateAiGenerate({ action: 'aeo-generate-queries', input: { business_name: client.name, industry: client.industry }, agency_id: agencyId });
              
              if (!queriesRes.error && queriesRes.data && queriesRes.data.output) {
                let outObj = queriesRes.data.output;
                if (typeof outObj === 'string') {
                  try { outObj = JSON.parse(outObj); } catch(e) {}
                }
                const queries = outObj?.queries || [];
                const topQueries = queries.slice(0, 5);
                
                for (const q of topQueries) {
                  await runAeoCheckMultiModel({ action: 'aeo-run-check', input: { query: q, brand_name: client.name, competitors: '', client_id: clientId }, agency_id: agencyId }, matchedAgency);
                }
                
                await calculateAeoScore({ action: 'aeo-calculate-score', input: { client_id: clientId }, agency_id: agencyId });
                updateStatus('aeo_audit_status', 'complete');
              } else {
                updateStatus('aeo_audit_status', 'failed');
              }
            } else {
              updateStatus('aeo_audit_status', 'skipped');
            }
            
            updateStatus('last_auto_audit_at', new Date().toISOString());
          } catch (e) {
            console.error('Auto audit failed', e);
          }
        }, 100);
        
        return { data: { status: 'started' }, error: null };
      }

      if (functionName === 'keyword-serp') {
        return await simulateAiGenerate({ action: 'keyword-serp', input: body, agency_id: body.agency_id });
      }

      if (functionName === 'keyword-enrich') {
        return await simulateAiGenerate({ action: 'keyword-enrich', input: body, agency_id: body.agency_id });
      }

      return simulateAiGenerate(body);
    }
  }
};


export async function getSERP(keyword, location, agencyId) {
  try {
    const cacheDb = JSON.parse(localStorage.getItem('db_keyword_serp_cache') || '[]');
    const cachedItem = cacheDb.find(c => c.keyword.toLowerCase() === keyword.toLowerCase() && c.location === location);
    
    if (cachedItem) {
      const fetchedAt = new Date(cachedItem.fetched_at);
      const daysOld = (new Date() - fetchedAt) / (1000 * 60 * 60 * 24);
      if (daysOld < 7) {
        return { success: true, text: cachedItem.serp_json, cached: true, fetched_at: cachedItem.fetched_at };
      }
    }

    const { data, error } = await supabase.functions.invoke('keyword-serp', {
      body: { keyword, location, agency_id: agencyId }
    });
    if (error) throw error;
    
    let resultJson = null;
    if (data && data.output) {
      try {
        resultJson = typeof data.output === 'string' ? JSON.parse(data.output) : data.output;
      } catch (e) {
        resultJson = { results: [], content_gaps: [], raw: data.output };
      }
    } else if (data && data.success) {
      resultJson = data;
    } else {
      resultJson = { results: [], content_gaps: [], raw: data?.text || 'Failed to fetch SERP data' };
    }

    // Save to cache
    const newCacheItem = {
      id: 'ksc_' + Math.random().toString(36).substring(2, 9),
      keyword,
      location,
      serp_json: resultJson,
      fetched_at: new Date().toISOString()
    };
    
    // Remove old cache for this keyword if exists
    const updatedCacheDb = cacheDb.filter(c => !(c.keyword.toLowerCase() === keyword.toLowerCase() && c.location === location));
    updatedCacheDb.push(newCacheItem);
    localStorage.setItem('db_keyword_serp_cache', JSON.stringify(updatedCacheDb));
    window.dispatchEvent(new Event('local_db_change'));

    return { success: true, text: resultJson, cached: false, fetched_at: newCacheItem.fetched_at };
  } catch (err) {
    console.error('SERP Error:', err);
    return { success: false, text: err.message || err || 'Unknown error occurred' };
  }
}
