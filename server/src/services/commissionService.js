/**
 * Utility service for calculating commission and driver amounts
 */
const calculateCommission = (fare) => {
    const commissionRate = 0.10; // 10% platform commission
    const platformCommission = Math.round(fare * commissionRate);
    const driverAmount = fare - platformCommission;

    return { platformCommission, driverAmount };
};

module.exports = {
    calculateCommission
};
