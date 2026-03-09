/**
 * Notification Service — Central Dispatcher
 * 
 * All notification channels (email, SMS, push) route through here.
 * Every function is non-blocking — they fire-and-forget.
 * SMS failures are caught and logged — they never break the workflow.
 */

const { sendEmail } = require('./emailService');
const { sendWhatsAppMessage } = require('./whatsappService');

// Email Templates
const welcomeTemplate = require('../templates/welcomeTemplate');
const rideBookedTemplate = require('../templates/rideBookedTemplate');
const driverAssignedTemplate = require('../templates/driverAssignedTemplate');
const rideCompletedTemplate = require('../templates/rideCompletedTemplate');
const rideCancelledTemplate = require('../templates/rideCancelledTemplate');
const paymentReceiptTemplate = require('../templates/paymentReceiptTemplate');
const walletTopupTemplate = require('../templates/walletTopupTemplate');
const applicationSubmittedTemplate = require('../templates/applicationSubmittedTemplate');
const applicationApprovedTemplate = require('../templates/applicationApprovedTemplate');
const applicationRejectedTemplate = require('../templates/applicationRejectedTemplate');
const meetingScheduledTemplate = require('../templates/meetingScheduledTemplate');
const otpTemplate = require('../templates/otpTemplate');

// ══════════════════════════════════════════════════════════════════
//  EMAIL NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════

// ── Auth ─────────────────────────────────────────────────────────

/** Welcome email on registration */
const sendWelcomeEmail = (user) => {
    if (!user?.email) return;
    const { subject, html } = welcomeTemplate(user);
    sendEmail(user.email, subject, html).catch(console.error);
};

// ── Ride lifecycle ───────────────────────────────────────────────

/** Ride booked by rider */
const sendRideBookedEmail = (user, ride) => {
    if (!user?.email) return;
    const { subject, html } = rideBookedTemplate(user, ride);
    sendEmail(user.email, subject, html).catch(console.error);
};

/** Driver assigned to ride */
const sendDriverAssignedEmail = (user, driver, ride) => {
    if (!user?.email) return;
    const { subject, html } = driverAssignedTemplate(user, driver, ride);
    sendEmail(user.email, subject, html).catch(console.error);
};

/** Ride completed */
const sendRideCompletedEmail = (user, ride) => {
    if (!user?.email) return;
    const { subject, html } = rideCompletedTemplate(user, ride);
    sendEmail(user.email, subject, html).catch(console.error);
};

/** Ride cancelled */
const sendRideCancelledEmail = (user, ride, cancelledBy) => {
    if (!user?.email) return;
    const { subject, html } = rideCancelledTemplate(user, ride, cancelledBy);
    sendEmail(user.email, subject, html).catch(console.error);
};

// ── Payments ─────────────────────────────────────────────────────

/** Payment receipt */
const sendPaymentReceiptEmail = (user, ride) => {
    if (!user?.email) return;
    const { subject, html } = paymentReceiptTemplate(user, ride);
    sendEmail(user.email, subject, html).catch(console.error);
};

/** Wallet top-up confirmation */
const sendWalletTopupEmail = (user, amount, newBalance) => {
    if (!user?.email) return;
    const { subject, html } = walletTopupTemplate(user, amount, newBalance);
    sendEmail(user.email, subject, html).catch(console.error);
};

// ── Driver Applications ──────────────────────────────────────────

/** Application submitted */
const sendApplicationSubmittedEmail = (user, application) => {
    if (!user?.email) return;
    const { subject, html } = applicationSubmittedTemplate(user, application);
    sendEmail(user.email, subject, html).catch(console.error);
};

/** Application approved */
const sendApplicationApprovedEmail = (user) => {
    if (!user?.email) return;
    const { subject, html } = applicationApprovedTemplate(user);
    sendEmail(user.email, subject, html).catch(console.error);
};

/** Application rejected */
const sendApplicationRejectedEmail = (user, reason) => {
    if (!user?.email) return;
    const { subject, html } = applicationRejectedTemplate(user, reason);
    sendEmail(user.email, subject, html).catch(console.error);
};

/** Verification meeting scheduled */
const sendMeetingScheduledEmail = (user, meeting) => {
    if (!user?.email) return;
    const { subject, html } = meetingScheduledTemplate(user, meeting);
    sendEmail(user.email, subject, html).catch(console.error);
};

/** OTP Email (General - Login, Reg, or Password Reset) */
const sendOTPEmail = (user, otp, purpose = 'Verification') => {
    if (!user?.email) return;
    const { subject, html } = otpTemplate(user, otp, purpose);
    sendEmail(user.email, subject, html).catch(console.error);
};

// ══════════════════════════════════════════════════════════════════
//  WHATSAPP NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════

/** Ride booked — WhatsApp to rider */
const sendRideBookedWhatsApp = (user, ride) => {
    if (!user?.phone) return;
    const msg = `Safro 🚗\n\nYour ride has been booked successfully.\nDriver will arrive soon.`;
    sendWhatsAppMessage(user.phone, msg).catch(console.error);
};

/** Driver assigned — WhatsApp to rider */
const sendDriverAssignedWhatsApp = (user, driver) => {
    if (!user?.phone) return;
    const msg = `Safro 🚗\n\nDriver ${driver?.name || 'Unknown'} is on the way.\nVehicle: ${driver?.vehicleNumber || 'N/A'}`;
    sendWhatsAppMessage(user.phone, msg).catch(console.error);
};

/** Ride started — WhatsApp to rider */
const sendRideStartedWhatsApp = (user, driver) => {
    if (!user?.phone) return;
    const msg = `Safro 🚗\n\nYour ride has started.\nDriver: ${driver?.name || 'Your driver'}`;
    sendWhatsAppMessage(user.phone, msg).catch(console.error);
};

/** Ride completed — WhatsApp to rider */
const sendRideCompletedWhatsApp = (user, ride) => {
    if (!user?.phone) return;
    const fare = ride?.agreedFare || ride?.fare || 'N/A';
    const msg = `Safro 🚗\n\nRide completed.\nFare: ₹${fare}`;
    sendWhatsAppMessage(user.phone, msg).catch(console.error);
};

/** Payment receipt — WhatsApp to rider */
const sendPaymentReceiptWhatsApp = (user, ride) => {
    if (!user?.phone) return;
    const fare = ride?.agreedFare || ride?.totalPaid || ride?.fare || 'N/A';
    const method = ride?.paymentMethod || 'N/A';
    const msg = `Safro 🚗\n\nPayment receipt: ₹${fare} received.\nMethod: ${method}`;
    sendWhatsAppMessage(user.phone, msg).catch(console.error);
};

/**
 * SOS Alert — WhatsApp to admin, guardian, and emergency contacts
 * @param {object} user - User who triggered SOS { name, phone, guardianPhone }
 * @param {object} location - { lat, lng }
 * @returns {Array} Array of { recipient, status } for logging
 */
const sendSOSAlertWhatsApp = async (user, location) => {
    const lat = location?.lat || 0;
    const lng = location?.lng || 0;
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;

    const msg = `🚨 SOS ALERT\n\nUser: ${user?.name || 'Unknown'}\nLocation:\n${mapsLink}`;

    const results = [];

    // Send to admin phone (if configured)
    const adminPhone = process.env.ADMIN_PHONE;
    if (adminPhone) {
        const result = await sendWhatsAppMessage(adminPhone, msg);
        results.push({ recipient: adminPhone, status: result ? 'sent' : 'failed' });
        console.log("SOS Alert will go to for all the guardian they added");
    }

    // Send to guardian
    if (user?.guardianPhone) {
        const result = await sendWhatsAppMessage(user.guardianPhone, msg);
        results.push({ recipient: user.guardianPhone, status: result ? 'sent' : 'failed' });
    }

    // Send to user's own phone (confirmation)
    if (user?.phone) {
        const selfMsg = `Safro SOS: Your emergency alert has been sent to your emergency contacts. Help is on the way.`;
        const result = await sendWhatsAppMessage(user.phone, selfMsg);
        results.push({ recipient: user.phone, status: result ? 'sent' : 'failed' });
    }

    return results;
};

module.exports = {
    // Email — Auth
    sendWelcomeEmail,
    // Email — Ride
    sendRideBookedEmail,
    sendDriverAssignedEmail,
    sendRideCompletedEmail,
    sendRideCancelledEmail,
    // Email — Payment
    sendPaymentReceiptEmail,
    sendWalletTopupEmail,
    // Email — Driver Applications
    sendApplicationSubmittedEmail,
    sendApplicationApprovedEmail,
    sendApplicationRejectedEmail,
    sendMeetingScheduledEmail,
    // Email — OTP
    sendOTPEmail,
    // WhatsApp — Ride lifecycle
    sendRideBookedWhatsApp,
    sendDriverAssignedWhatsApp,
    sendRideStartedWhatsApp,
    sendRideCompletedWhatsApp,
    sendPaymentReceiptWhatsApp,
    // WhatsApp — Emergency
    sendSOSAlertWhatsApp,
};
