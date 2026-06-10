import { jsonrepair } from 'jsonrepair';

/**
 * Bulletproof AI JSON parser.
 * @param rawText - the raw AI response string
 * @param expectedKeys - array of field names that must exist at top level
 * @param fallback - object to return if parsing totally fails
 * @returns { success: boolean, data: object|null, error: string|null, raw: string }
 */
export function parseAIJson(rawText, expectedKeys = [], fallback = null) {
  console.log('parseAIJson RAW INPUT:', rawText?.slice(0, 1000));

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    return { success: false, data: fallback, error: 'Empty AI response', raw: rawText };
  }

  let text = rawText.trim();

  // LAYER 1: EXTRACTION
  text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');

  let extractedText = text;
  
  // Decide whether to extract an object or array based on which comes first
  if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      extractedText = text.slice(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1 && lastBracket !== -1) {
      extractedText = text.slice(firstBracket, lastBracket + 1);
  }

  // LAYER 2 & 3: PARSE
  let parsed = null;
  try {
    parsed = JSON.parse(extractedText);
  } catch (e1) {
    try {
      const repaired = jsonrepair(extractedText);
      parsed = JSON.parse(repaired);
      console.log('parseAIJson: recovered via jsonrepair');
    } catch (e2) {
      // If the extracted text fails, try repairing the raw text just in case the extraction was wrong
      try {
          const repairedRaw = jsonrepair(text);
          parsed = JSON.parse(repairedRaw);
          console.log('parseAIJson: recovered via jsonrepair on raw text');
      } catch (e3) {
          console.error('parseAIJson: parse failed after repair. Raw:', rawText?.slice(0, 1000));
          return { success: false, data: fallback, error: 'Could not parse AI response', raw: rawText };
      }
    }
  }

  // LAYER 4: UNWRAP
  if (expectedKeys.length > 0 && parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const hasExpected = expectedKeys.some(k => typeof parsed[k] !== 'undefined');
    if (!hasExpected) {
      const keys = Object.keys(parsed);
      if (keys.length === 1 && parsed[keys[0]] && typeof parsed[keys[0]] === 'object') {
        parsed = parsed[keys[0]];
      } else {
        for (const k of keys) {
          if (parsed[k] && typeof parsed[k] === 'object') {
            const nestedHas = expectedKeys.some(ek => typeof parsed[k][ek] !== 'undefined');
            if (nestedHas) { parsed = parsed[k]; break; }
          }
        }
      }
    }
  }

  // LAYER 5: VALIDATE
  if (!parsed || typeof parsed !== 'object') {
    return { success: false, data: fallback, error: 'Parsed result is not a valid object or array', raw: rawText };
  }

  return { success: true, data: parsed, error: null, raw: rawText };
}
