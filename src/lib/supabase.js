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

function cleanJson(str) {
  let cleaned = str.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/```$/, '');
  }
  return cleaned.trim();
}

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
    case 'seo-audit':
      return JSON.stringify({
        score: 84,
        onpage: 88,
        technical: 76,
        content: 90,
        mobile: 82,
        findings: [
          {
            severity: "critical",
            title: "Missing LocalBusiness Schema Markup",
            description: "No JSON-LD schema detected for local business addresses.",
            recommendation: "Implement LocalBusiness schema on the homepage footer."
          },
          {
            severity: "warning",
            title: "Large Hero Banner Images",
            description: "Image size is 2.4MB, which slows mobile loading speeds.",
            recommendation: "Compress header banners to modern webp formats under 200KB."
          },
          {
            severity: "good",
            title: "Valid SSL Configuration",
            description: "HTTPS connection is secure and valid.",
            recommendation: "No actions required."
          }
        ]
      });

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

async function callAI(prompt, systemPrompt, agencyId) {
  const agencies = JSON.parse(localStorage.getItem('db_agencies') || '[]');
  const agency = agencies.find(a => a.id === agencyId);

  if (!agency || !agency.openrouter_api_key) {
    return {
      success: false,
      text: 'AI is not configured. Please add your OpenRouter API key in Settings.'
    };
  }

  const apiKey = agency.openrouter_api_key;
  const model = agency.preferred_model || 'google/gemini-2.0-flash-exp:free';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://agencyos.in',
        'X-Title': 'Agency OS'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
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
    default:
      systemPrompt = "You are a helpful AI assistant.";
      userPrompt = `Execute operation ${action} with input parameters: ${JSON.stringify(input)}.`;
  }

  const aiResult = await callAI(userPrompt, systemPrompt, agencyId);

  if (!aiResult.success) {
    return { error: aiResult.text };
  }

  let contentText = aiResult.text;
  const modelName = aiResult.modelName || 'OpenRouter AI';

  // Check if the action expects a structured JSON output
  const isJsonAction = ['seo-audit', 'keyword-research', 'gbp-qa-seed', 'aeo-query-gen', 'aeo-audit'].includes(action);
  
  if (isJsonAction) {
    try {
      const cleaned = cleanJson(contentText);
      JSON.parse(cleaned);
      return { data: { output: cleaned, is_live_api: true, model_name: modelName }, error: null };
    } catch (jsonErr) {
      const firstBrace = contentText.indexOf('{');
      const firstBracket = contentText.indexOf('[');
      let trimmedJson = '';
      if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        const lastBrace = contentText.lastIndexOf('}');
        trimmedJson = contentText.substring(firstBrace, lastBrace + 1);
      } else if (firstBracket !== -1) {
        const lastBracket = contentText.lastIndexOf(']');
        trimmedJson = contentText.substring(firstBracket, lastBracket + 1);
      }
      
      try {
        JSON.parse(trimmedJson);
        return { data: { output: trimmedJson, is_live_api: true, model_name: modelName }, error: null };
      } catch (retryErr) {
        // Attempt to auto-fix truncated JSON
        try {
          const autoFixed = trimmedJson + ']}';
          JSON.parse(autoFixed);
          return { data: { output: autoFixed, is_live_api: true, model_name: modelName }, error: null };
        } catch (e2) {
          try {
            const autoFixed2 = trimmedJson + '}]}';
            JSON.parse(autoFixed2);
            return { data: { output: autoFixed2, is_live_api: true, model_name: modelName }, error: null };
          } catch (e3) {
            return { error: `AI output could not be parsed as structured JSON. Error: ${retryErr.message}. Output tail: ${trimmedJson.slice(-100)}` };
          }
        }
      }
    }
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
    { id: 'perplexity/llama-3.1-sonar-small-128k-online', platform: 'perplexity' },
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

      return simulateAiGenerate(body);
    }
  }
};
