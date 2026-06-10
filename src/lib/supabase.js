import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Ensure we have a working client
if (!supabase) {
  console.error("Missing Supabase credentials in .env.local!");
}

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
  const { data: agency } = await supabase.from('agencies').select('*').eq('id', agencyId).single();

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
  const { data: matchedAgency } = await supabase.from('agencies').select('*').eq('id', agency_id).single();
  if (!matchedAgency || !matchedAgency.openrouter_api_key) {
    return { error: 'AI features are disabled. Add your OpenRouter API key in Settings.' };
  }

  // Very simplified AI call for the hybrid
  const res = await callAI(JSON.stringify(input), "You are an AI assistant for a marketing agency.", agency_id);
  if (!res.error) window.dispatchEvent(new Event('local_db_change'));
  
  if (action === 'seo-audit' || action === 'keyword-research') {
     // Return mock JSON so it doesn't break
     return { data: { output: getMockOutput(action, input), is_live_api: false }, error: null };
  }
  
  return { data: { output: res.text, is_live_api: true }, error: null };
}

// Intercept functions.invoke
if (supabase) {
  const originalInvoke = supabase.functions.invoke.bind(supabase.functions);
  supabase.functions.invoke = async (functionName, options) => {
    const body = options?.body;
    if (body && body.action) {
      return await simulateAiGenerate(body);
    }
    return originalInvoke(functionName, options);
  };

  // Intercept signUp
  const originalSignUp = supabase.auth.signUp.bind(supabase.auth);
  supabase.auth.signUp = async ({ email, password, options }) => {
    const res = await originalSignUp({ email, password, options });
    if (res.data?.user && !res.error) {
      const agency_name = options?.data?.agency_name || 'My Agency';
      const full_name = options?.data?.full_name || 'Owner';

      const { data: agency } = await supabase.from('agencies').insert({
        name: agency_name,
        plan: 'trial'
      }).select().single();

      if (agency) {
        await supabase.from('users').insert({
          id: res.data.user.id,
          agency_id: agency.id,
          full_name,
          email,
          role: 'admin'
        });
      }
    }
    return res;
  };
  
  // Monkey patch to trigger local_db_change
  ['from', 'rpc'].forEach(method => {
    if (!supabase[method]) return;
    const orig = supabase[method].bind(supabase);
    supabase[method] = (...args) => {
      const builder = orig(...args);
      ['insert', 'update', 'delete', 'upsert'].forEach(op => {
        if (builder[op]) {
          const origOp = builder[op].bind(builder);
          builder[op] = (...opArgs) => {
            const promise = origOp(...opArgs);
            promise.then(res => {
              if (!res.error) window.dispatchEvent(new Event('local_db_change'));
            });
            return promise;
          };
        }
      });
      return builder;
    };
  });
}
