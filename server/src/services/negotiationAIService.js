/**
 * AI Negotiation Assistant Service
 * Suggests fair compromise during rider-driver fare negotiation
 * (FALLBACK VERSION: Midpoint algorithm)
 */

/**
 * Suggest a compromise fare between two parties
 * @param {Object} params
 * @param {number} params.currentOffer - Latest offer amount
 * @param {number} params.counterOffer - Counter offer amount
 * @param {number} params.distanceKm - Route distance
 * @param {Object} params.fareRange - { minFare, suggestedFare, maxFare } from prediction
 * @param {number} params.roundNumber - Which round of negotiation (1, 2, 3...)
 * @returns {Object} { compromise, explanation }
 */
const suggestCompromise = async ({ currentOffer, counterOffer, distanceKm, fareRange, roundNumber }) => {
    // Weighted midpoint calculation
    const lower = Math.min(currentOffer, counterOffer);
    const higher = Math.max(currentOffer, counterOffer);
    
    // Suggest a value slightly closer to the AI suggested fare if available
    let compromise;
    if (fareRange && fareRange.suggestedFare) {
        const aiFavored = (lower + higher + fareRange.suggestedFare) / 3;
        compromise = Math.round(aiFavored);
    } else {
        compromise = Math.round((lower + higher) / 2);
    }

    return {
        compromise,
        explanation: 'Balanced compromise based on current offers'
    };
};

module.exports = { suggestCompromise };
