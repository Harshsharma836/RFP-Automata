const logger = require("../logger");
require("dotenv").config();
// const { GoogleGenerativeAI } = require("@google/genai");
const { GoogleGenerativeAI } = require("@google/generative-ai");


const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
console.log("GOOGLE_API_KEY:", GOOGLE_API_KEY ? "Loaded" : "Missing");

const ai = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

async function parseRfpFromText(naturalText) {
  logger.info("parseRfpFromText called");

  if (!ai) return parseRfpHeuristic(naturalText);

  const prompt = `
You are an RFP parser. Convert the following natural language request into JSON.

STRICT RULES:
- Return ONLY pure JSON
- No markdown, no comments, no explanation

JSON FORMAT:
{
  "title": "string (max 120 chars)",
  "description": "string",
  "budget": "number or null",
  "delivery_days": "number or null",
  "items": [
    { "name": "string", "qty": number }
  ]
}

RFP TEXT:
${naturalText}
`.trim();

  try {

    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const response = await model.generateContent(prompt);
    const raw = response.response.text().trim();
    console.log("Google Response:", raw);

    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      title: parsed.title || naturalText.split("\n")[0].slice(0, 120),
      description: parsed.description || naturalText,
      budget: parsed.budget ? parseInt(parsed.budget) : null,
      delivery_days: parsed.delivery_days ? parseInt(parsed.delivery_days) : null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch (err) {
    console.dir(err, { depth: 10 });
    return parseRfpHeuristic(naturalText);
  }
}

function parseRfpHeuristic(naturalText) {
  const result = {
    title: naturalText.split("\n")[0].slice(0, 120),
    description: naturalText,
    budget: null,
    delivery_days: null,
    items: [],
  };

  const budgetMatch = naturalText.match(/\$?([0-9,]+)\s*(?:total|budget)/i);
  if (budgetMatch) result.budget = parseInt(budgetMatch[1].replace(/,/g, ""));

  const daysMatch = naturalText.match(/([0-9]+)\s*days/i);
  if (daysMatch) result.delivery_days = parseInt(daysMatch[1]);

  const itemRegex = /([0-9]+)\s+([a-zA-Z0-9\-\s]+?)(?:\.|,|\band|$)/g;
  let m;
  while ((m = itemRegex.exec(naturalText))) {
    const qty = parseInt(m[1]);
    const name = m[2].trim();
    if (qty && name.length > 2) result.items.push({ name, qty });
  }

  logger.info("RFP parsed via heuristic");
  return result;
}

async function parseProposalText(text) {
  logger.info("parseProposalText called");

  if (!ai) return parseProposalHeuristic(text);

  const prompt = `
You are a vendor proposal parser and scorer. Convert the proposal into JSON.

STRICT RULES:
- Only valid JSON
- No markdown, no explanation
- Score 0-100 (0=poor, 100=excellent)
- Look for: clear pricing, delivery timeline, warranty, payment terms

JSON FORMAT:
{
  "total": "number or null",
  "line_items": [
    { "description": "string", "amount": number }
  ],
  "terms": "string or null",
  "score": "0-100 number",
  "feedback": "brief quality assessment"
}

PROPOSAL TEXT:
${text}
`.trim();

  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const response = await model.generateContent(prompt);
    const raw = response.response.text().trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      total_price: parsed.total ? parseInt(parsed.total) : null,
      line_items: Array.isArray(parsed.line_items) ? parsed.line_items : [],
      terms: parsed.terms || null,
      ai_score: parsed.score || 50,
      ai_feedback: parsed.feedback || "Proposal processed",
      json_data: parsed,
      raw: text,
    };
  } catch (err) {
    console.log("========= GEMINI ERROR =========");
    console.dir(err, { depth: 10 });
    console.log("========= END ERROR =========");
    return parseProposalHeuristic(text);
  }
}

function parseProposalHeuristic(text) {
  const proposal = { total_price: null, line_items: [], terms: null, raw: text };

  const totalMatch =
    text.match(/total\s*[:\-\s]*\$?([0-9,]+\.?[0-9]*)/i) ||
    text.match(/\$([0-9,]+\.?[0-9]*)\s*total/i);
  if (totalMatch) proposal.total_price = parseFloat(totalMatch[1].replace(/,/g, ""));

  const lineRegex = /([A-Za-z0-9\s\-]+)\s*[:\-]\s*\$?([0-9,]+\.?[0-9]*)/g;
  let li;
  while ((li = lineRegex.exec(text))) {
    proposal.line_items.push({
      description: li[1].trim(),
      amount: parseFloat(li[2].replace(/,/g, "")),
    });
  }

  const termsMatch = text.match(/(net\s*\d{1,2}|warranty.*?\d+\s*year)/i);
  if (termsMatch) proposal.terms = termsMatch[0];

  // Score based on completeness
  let score = 40; // base score
  if (proposal.total_price) score += 20;
  if (proposal.line_items.length >= 2) score += 20;
  if (proposal.terms) score += 20;
  
  proposal.ai_score = Math.min(score, 95);
  proposal.ai_feedback = `Proposal has ${proposal.line_items.length} items, ${proposal.terms ? 'includes terms' : 'missing terms'}, total: ${proposal.total_price ? '$' + proposal.total_price : 'not specified'}`;
  proposal.json_data = proposal;

  logger.info("Proposal parsed via heuristic");
  return proposal;
}

async function compareProposals(rfp, proposals) {
  logger.info("compareProposals called");

  if (!ai) return compareProposalsHeuristic(rfp, proposals);

  const prompt = `
You are a proposal evaluator. Score proposals from 0–100 based on value, completeness and alignment with the RFP.

RFP Budget: ${rfp.budget || "Not specified"}
RFP Item Count: ${rfp.items.length}

For EACH proposal return JSON object:
{ "index": <proposal_index>, "score": <0–100>, "reason": "string" }
`.trim();

  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const response = await model.generateContent(prompt);
    const raw = response.response.text().trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const scores = JSON.parse(clean);

    const ranked = proposals.map((p, idx) => {
      const found = scores.find((s) => s.index === idx);
      return {
        ...p,
        score: found?.score || 50,
        reason: found?.reason || "No reason provided",
      };
    });

    ranked.sort((a, b) => b.score - a.score);
    return ranked;
  } catch (err) {
    console.log("========= GEMINI ERROR =========");
    console.dir(err, { depth: 10 });
    console.log("========= END ERROR =========");
    return compareProposalsHeuristic(rfp, proposals);
  }
}

function compareProposalsHeuristic(rfp, proposals) {
  const ranked = proposals.map((p) => {
    const total = p.total || Number.MAX_SAFE_INTEGER;
    let score = 0;
    if (p.total) score += 50;
    if (p.line_items.length) score += 30;
    if (rfp.budget)
      score += Math.max(
        0,
        20 - Math.abs((total - rfp.budget) / rfp.budget) * 20
      );
    return { ...p, score };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

module.exports = {
  parseRfpFromText,
  parseProposalText,
  compareProposals,
};
