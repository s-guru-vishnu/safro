/**
 * Generate a 6-digit numeric OTP
 * @returns {string} 6-digit OTP string
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = generateOTP;
