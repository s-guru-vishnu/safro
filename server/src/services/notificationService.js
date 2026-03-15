const { sendEmail } = require('./emailService');

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
};
