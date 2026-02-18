/**
 * Safron AI Chat endpoint
 * POST /api/ai/chat
 * Handles conversational AI chat via GROQ
 */
const express = require('express');
const { callGroq } = require('../services/groqService');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/chat', protect, async (req, res, next) => {
    try {
        const { message, context } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const systemPrompt = `You are Safron, the friendly AI assistant for Safro — an AI-powered ride-sharing and fare negotiation marketplace.

Your personality:
- Helpful, concise, and friendly
- You speak casually but professionally 
- Use emojis sparingly (1-2 max per message)
- Keep answers short (2-3 sentences max)

You can help with:
- How the platform works (booking, negotiation, fare estimates)
- Tips for riders (how to get better fares, safety)
- Tips for drivers (acceptance strategies, earning more)
- General FAQs about Safro
- AI fare prediction explanation
- Platform features

You do NOT:
- Share real fare data or prices
- Access user accounts or ride data
- Handle complaints or refunds (redirect to support)
- Provide legal advice

User role: ${context?.role || 'visitor'}
Current page context: ${context?.page || 'unknown'}`;

        const response = await callGroq(systemPrompt, message.trim());

        // callGroq returns parsed JSON or string — we want the raw text here
        const reply = typeof response === 'string' ? response : (response?.reply || response?.message || JSON.stringify(response));

        res.json({ reply });
    } catch (error) {
        console.error('Safron chat error:', error.message);
        // Fallback response if AI fails
        res.json({
            reply: "I'm having a moment 🤔 — try asking me again in a few seconds!"
        });
    }
});

module.exports = router;
