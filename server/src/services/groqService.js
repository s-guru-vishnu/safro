/**
 * GROQ AI Service
 * Core client for GROQ API with structured prompts, JSON parsing, rate limiting, and caching
 */
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_CB });

// Simple in-memory cache (TTL: 5 minutes)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// Rate limiting: max 30 calls per minute
let callCount = 0;
let windowStart = Date.now();
const MAX_CALLS_PER_MINUTE = 30;

/**
 * Call GROQ with structured prompts and JSON response parsing
 * @param {string} systemPrompt - System context
 * @param {string} userPrompt - User query
 * @param {string} cacheKey - Optional cache key
 * @returns {Object} Parsed JSON response
 */
const callGroq = async (systemPrompt, userPrompt, cacheKey = null) => {
    // Check cache
    if (cacheKey && cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }
        cache.delete(cacheKey);
    }

    // Rate limiting
    if (Date.now() - windowStart > 60000) {
        callCount = 0;
        windowStart = Date.now();
    }
    if (callCount >= MAX_CALLS_PER_MINUTE) {
        throw new Error('AI rate limit exceeded. Please try again shortly.');
    }
    callCount++;

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 500,
            response_format: { type: 'json_object' }
        });

        const rawContent = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(rawContent);

        // Cache result
        if (cacheKey) {
            cache.set(cacheKey, { data: parsed, timestamp: Date.now() });
        }

        return parsed;
    } catch (error) {
        console.error('GROQ API error:', error.message);
        // Return null so callers can handle gracefully
        return null;
    }
};

/**
 * Clear expired cache entries
 */
const cleanCache = () => {
    const now = Date.now();
    for (const [key, val] of cache) {
        if (now - val.timestamp > CACHE_TTL) cache.delete(key);
    }
};

// Clean cache every 10 minutes
setInterval(cleanCache, 10 * 60 * 1000);

module.exports = { callGroq };
