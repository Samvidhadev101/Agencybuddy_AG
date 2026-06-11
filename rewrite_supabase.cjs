const fs = require('fs');
const path = require('path');

const targetPath = path.join('src', 'lib', 'supabase.js');
const origCode = fs.readFileSync(targetPath, 'utf8');

const startAiIdx = origCode.indexOf('const TOKEN_COSTS');
const endAiIdx = origCode.indexOf('async function simulateAiGenerate');

if (startAiIdx === -1 || endAiIdx === -1) {
  console.error("Failed to find AI block");
  process.exit(1);
}

let aiBlock = origCode.substring(startAiIdx, endAiIdx);

// Patch callAI to use real supabase
aiBlock = aiBlock.replace(/const agencies = JSON\.parse\(localStorage\.getItem\('db_agencies'\) \|\| '\[\]'\);\s*const agency = agencies\.find\(a => a\.id === agencyId\);/g, 
  "const { data: agency } = await supabase.from('agencies').select('*').eq('id', agencyId).single();");

const newCode = `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Ensure we have a working client
if (!supabase) {
  console.error("Missing Supabase credentials in .env.local!");
}

` + aiBlock + `



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
`;

fs.writeFileSync(targetPath, newCode);
console.log("Rewrote supabase.js successfully");
