const tamilNaduData = {
    "Chennai": ["Alandur", "Ambattur", "Aminjikarai", "Ayanavaram", "Egmore", "Guindy", "Madhavaram", "Madhuravoyal", "Mambalam", "Mylapore", "Perambur", "Purasavakkam", "Sholinganallur", "Tiruvottiyur", "Tondiarpet", "Velachery"],
    "Coimbatore": ["Annur", "Coimbatore North", "Coimbatore South", "Kinathukadavu", "Madukkarai", "Mettupalayam", "Perur", "Pollachi", "Sulur", "Valparai"],
    "Madurai": ["Madurai East", "Madurai North", "Madurai South", "Madurai West", "Melur", "Peraiyur", "Thirumangalam", "Thiruparankundram", "Usilampatti", "Vadipatti"],
    "Salem": ["Attur", "Edappadi", "Gangavalli", "Kadaiyampatti", "Mettur", "Omalur", "Pethanaickenpalayam", "Salem", "Salem South", "Salem West", "Sankari", "Vazhapadi", "Yercaud"],
    // Add more if needed, but these are for testing/demo
};

/**
 * Identify taluk from address string
 * @param {string} address - The pickup/drop address
 * @returns {string|null} - Identified taluk name
 */
const identifyTaluk = (address) => {
    if (!address) return null;
    const addrUpper = address.toUpperCase();
    
    // Flatten all taluks for easy search
    const allTaluks = Object.values(tamilNaduData).flat();
    
    for (const taluk of allTaluks) {
        if (addrUpper.includes(taluk.toUpperCase())) {
            return taluk;
        }
    }
    
    return null;
};

module.exports = { identifyTaluk, tamilNaduData };
