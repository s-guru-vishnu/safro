/**
 * AI Negotiation Assistant Service
 * Suggests fair compromise during rider-driver fare negotiation
 */
const { callGroq } = require('./groqService');

/**
 * Suggest a compromise fare between two parties
 * @param {Object} params
 * @param {number} params.currentOffer - Latest offer amount
 * @param {number} params.counterOffer - Counter offer amount
 * @param {number} params.distanceKm - Route distance
 * @param {Object} params.fareRange - { minFare, suggestedFare, maxFare } from AI prediction
 * @param {number} params.roundNumber - Which round of negotiation (1, 2, 3...)
 * @returns {Object} { compromise, explanation }
 */
const suggestCompromise = async ({ currentOffer, counterOffer, distanceKm, fareRange, roundNumber }) => {
    const cacheKey = `nego_${currentOffer}_${counterOffer}_${Math.round(distanceKm || 0)}`;

    const systemPrompt = `You are Safro's negotiation assistant for a ride marketplace.
Suggest a fair compromise between rider and driver offers.
Be balanced — don't always favor one side. Consider market fairness and distance.
Currency is Indian Rupees (₹).
Return ONLY valid JSON with keys: compromise (integer), explanation (short string, max 60 chars).`;

    const userPrompt = `Current offer: ₹${currentOffer}
Counter offer: ₹${counterOffer}
Distance: ${distanceKm || 'unknown'} km
${fareRange ? `AI suggested range: ₹${fareRange.minFare} – ₹${fareRange.maxFare} (recommended: ₹${fareRange.suggestedFare})` : ''}
Negotiation round: ${roundNumber || 1}

What is a fair compromise between ₹${Math.min(currentOffer, counterOffer)} and ₹${Math.max(currentOffer, counterOffer)}?`;

    const result = await callGroq(systemPrompt, userPrompt, cacheKey);

    if (!result || !result.compromise) {
        // Fallback: weighted midpoint
        const lower = Math.min(currentOffer, counterOffer);
        const higher = Math.max(currentOffer, counterOffer);
        const compromise = Math.round((lower + higher) / 2);
        return {
            compromise,
            explanation: 'Balanced midpoint between both offers'
        };
    }

    result.compromise = Math.round(result.compromise);
    return result;
};

module.exports = { suggestCompromise };
