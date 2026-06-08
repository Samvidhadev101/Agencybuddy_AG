import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, agency_id } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ success: false, error: 'URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Normalize URL
    let target = url.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }

    // 1. Fetch Target HTML Server-Side
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let html = '';
    let onPageError = '';
    let onPageData = null;

    try {
      const res = await fetch(target, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      clearTimeout(timeout);
      
      if (!res.ok) {
        onPageError = `The website returned status ${res.status}. It may be blocking automated requests or the URL may be incorrect.`;
      } else {
        html = await res.text();
        
        // Parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        if (doc) {
          const title = doc.querySelector('title')?.textContent || '';
          const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
          const h1s = doc.querySelectorAll('h1').length;
          const h2s = doc.querySelectorAll('h2').length;
          const h3s = doc.querySelectorAll('h3').length;
          const images = doc.querySelectorAll('img');
          const imagesWithAlt = Array.from(images).filter(img => img.getAttribute('alt')).length;
          const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || null;
          const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || null;
          const viewport = doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || null;
          const ogTags = doc.querySelectorAll('meta[property^="og:"]').length;
          const schema = doc.querySelectorAll('script[type="application/ld+json"]').length;
          const bodyText = doc.querySelector('body')?.textContent || '';
          const wordCount = bodyText.trim().split(/\s+/).length;
          const internalLinks = Array.from(doc.querySelectorAll('a')).filter(a => {
            const href = a.getAttribute('href') || '';
            return href.startsWith('/') || href.includes(new URL(target).hostname);
          }).length;
          const externalLinks = doc.querySelectorAll('a').length - internalLinks;

          onPageData = {
            title: { value: title, length: title.length },
            metaDescription: { value: metaDesc, length: metaDesc.length },
            headings: { h1: h1s, h2: h2s, h3: h3s },
            images: { total: images.length, withAlt: imagesWithAlt, altCoverage: images.length ? Math.round(imagesWithAlt/images.length*100) : 0 },
            canonical, robots, viewport, openGraphTags: ogTags, structuredData: schema, wordCount, internalLinks, externalLinks, isHttps: target.startsWith('https')
          };
        }
      }
    } catch (e) {
      clearTimeout(timeout);
      onPageError = 'Could not reach this website. Check the URL is correct and publicly accessible, including https://';
    }

    // 2. Fetch PageSpeed
    const psKey = Deno.env.get('VITE_PAGESPEED_API_KEY') || '';
    
    const fetchPageSpeed = async (strategy: string) => {
      if (!psKey) return null;
      try {
        const psRes = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target)}&key=${psKey}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo`);
        const psData = await psRes.json();
        const lighthouse = psData.lighthouseResult;
        if (!lighthouse) return null;
        return {
          performance: Math.round((lighthouse.categories.performance?.score || 0) * 100),
          accessibility: Math.round((lighthouse.categories.accessibility?.score || 0) * 100),
          bestPractices: Math.round((lighthouse.categories['best-practices']?.score || 0) * 100),
          seo: Math.round((lighthouse.categories.seo?.score || 0) * 100),
          lcp: lighthouse.audits['largest-contentful-paint']?.displayValue || 'N/A',
          cls: lighthouse.audits['cumulative-layout-shift']?.displayValue || 'N/A',
          inp: lighthouse.audits['interaction-to-next-paint']?.displayValue || 'N/A',
          fcp: lighthouse.audits['first-contentful-paint']?.displayValue || 'N/A'
        };
      } catch (e) {
        return null;
      }
    };

    const psMobile = await fetchPageSpeed('mobile');
    const psDesktop = await fetchPageSpeed('desktop');

    // 3. Graceful degradation check
    if (!onPageData && !psMobile && !psDesktop) {
      return new Response(JSON.stringify({
        success: false,
        error: onPageError || 'Failed to retrieve any data from the website.'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4. Call Agency's AI Model
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
       return new Response(JSON.stringify({
          success: false,
          error: 'AI is not configured. Please set OPENROUTER_API_KEY.'
       }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const auditData = { 
      onPage: onPageData || { note: "On-page analysis unavailable - site blocked direct access, but speed data was retrieved." }, 
      pagespeed: { mobile: psMobile, desktop: psDesktop } 
    };

    const prompt = \`You are an SEO auditor. Here is REAL measured data for \${target}:
\${JSON.stringify(auditData, null, 2)}

Based ONLY on this real data, generate an SEO audit. Return JSON:
{
  "overall_score": <0-100>,
  "onpage_score": <0-100>,
  "technical_score": <0-100>,
  "content_score": <0-100>,
  "mobile_score": <0-100>,
  "findings": [
    { "category": "onpage|technical|content|mobile", "severity": "critical|warning|good", "title": "...", "issue": "...", "recommendation": "..." }
  ]
}
Base every finding on the actual values provided. Reference specific numbers.\`;

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${openRouterKey}\`,
        'HTTP-Referer': 'https://agencyos.in',
        'X-Title': 'Agency OS'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free', // Default model, in reality fetched from DB
        messages: [
          { role: 'system', content: 'You are an expert SEO auditor.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: "json_object" }
      })
    });

    const aiData = await aiRes.json();
    if (aiData.error) throw new Error(aiData.error.message || 'AI request failed');

    let jsonString = aiData.choices[0].message.content;
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    let parsedAudit = JSON.parse(jsonString);

    // UNWRAPPING FAILSAFE
    if (parsedAudit && typeof parsedAudit.overall_score === 'undefined') {
      const keys = Object.keys(parsedAudit);
      if (keys.length === 1 && typeof parsedAudit[keys[0]] === 'object' && parsedAudit[keys[0]] !== null) {
        parsedAudit = parsedAudit[keys[0]];
      } else {
        for (const k of keys) {
          if (parsedAudit[k] && typeof parsedAudit[k] === 'object' && typeof parsedAudit[k].overall_score !== 'undefined') {
            parsedAudit = parsedAudit[k];
            break;
          }
        }
      }
    }

    parsedAudit.raw_data = onPageData;
    parsedAudit.pagespeed_mobile = psMobile;
    parsedAudit.pagespeed_desktop = psDesktop;

    return new Response(JSON.stringify({
      success: true,
      data: parsedAudit
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
