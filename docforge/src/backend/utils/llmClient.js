const axios = require('axios');

const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function callGemini(prompt, options = {}) {
  if (!GEMINI_API_URL || !GEMINI_API_KEY) {
    // Placeholder: return a mocked response for local development
    return { content: `MOCK RESPONSE for prompt: ${prompt.substring(0, 200)}` };
  }

  try {
    const resp = await axios.post(
      GEMINI_API_URL,
      { prompt, ...options },
      { headers: { 'Authorization': `Bearer ${GEMINI_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return resp.data;
  } catch (err) {
    console.error('LLM call error', err?.response?.data || err.message);
    throw err;
  }
}

module.exports = { callGemini };
