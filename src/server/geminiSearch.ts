import { GoogleGenAI } from '@google/genai';

export interface GroundedSerpInsights {
  keyword: string;
  searchSummary: string;
  competitorHeadlines: string[];
  suggestedTitles: string[];
  suggestedDescriptions: string[];
  searchQueries: string[];
  groundingSources: { title: string; url: string }[];
}

export async function getGroundedSerpInsights(
  keyword: string,
  topic: string,
  brand?: string
): Promise<GroundedSerpInsights | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a world-class SEO strategist and technical copywriter for RankNova.
Perform live Google Search analysis for the keyword: "${keyword}".
Context/Topic: "${topic}"
Optional Brand: "${brand || 'None'}"

Use Google Search grounding to find what is currently ranking on Google, understand real-time user search intent, and analyze top SERP snippets.

Return a strictly formatted JSON response with:
{
  "searchSummary": "2-3 sentences explaining current Google search intent and top ranking snippet patterns for this keyword",
  "competitorHeadlines": ["3 to 4 examples of real or representative high-ranking headline patterns on Google"],
  "suggestedTitles": ["5 high-CTR, SEO-optimized title tags between 50-60 characters incorporating the keyword"],
  "suggestedDescriptions": ["5 compelling, search-intent matched meta descriptions between 135-155 characters"]
}
Only output the JSON object without code markdown ticks if possible, or inside standard json markdown.`;

    const response = await ai.models.generateContent({
      model: 'models/gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const rawText = response.text || '';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsed: any = {};
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      // If parsing fails, extract text sections
      parsed = {
        searchSummary: rawText.slice(0, 300),
        competitorHeadlines: [],
        suggestedTitles: [],
        suggestedDescriptions: []
      };
    }

    // Extract grounding metadata sources
    const candidate = response.candidates?.[0];
    const groundingMeta = candidate?.groundingMetadata;
    const searchQueries: string[] = groundingMeta?.webSearchQueries || [];
    const groundingChunks = groundingMeta?.groundingChunks || [];

    const sources: { title: string; url: string }[] = [];
    for (const chunk of groundingChunks) {
      if (chunk.web?.uri) {
        sources.push({
          title: chunk.web.title || chunk.web.uri,
          url: chunk.web.uri
        });
      }
    }

    return {
      keyword,
      searchSummary: parsed.searchSummary || 'Live Google search data analyzed.',
      competitorHeadlines: Array.isArray(parsed.competitorHeadlines) ? parsed.competitorHeadlines : [],
      suggestedTitles: Array.isArray(parsed.suggestedTitles) ? parsed.suggestedTitles : [],
      suggestedDescriptions: Array.isArray(parsed.suggestedDescriptions) ? parsed.suggestedDescriptions : [],
      searchQueries,
      groundingSources: sources.slice(0, 5)
    };
  } catch (err) {
    console.warn('Gemini Search Grounding error (falling back to deterministic generator):', err);
    return null;
  }
}
