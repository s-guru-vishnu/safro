/**
 * Email template: Scheduled Ride Reminder (30 min before)
 */
module.exports = (user, ride) => {
    const date = new Date(ride.scheduledTime);
    const formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return {
        subject: `⏰ Ride Reminder — Your ride is at ${formattedTime}`,
        html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <div style="background:linear-gradient(135deg,#0D9488,#d97706);padding:28px 24px;text-align:center;">
                <h1 style="color:white;margin:0;font-size:22px;">⏰ Ride Reminder</h1>
                <p style="color:#fef3c7;margin:8px 0 0;font-size:14px;">Your scheduled ride is coming up soon!</p>
            </div>
            <div style="padding:24px;">
                <p style="color:#374151;font-size:15px;">Hi <strong>${user.name}</strong>,</p>
                <p style="color:#6b7280;font-size:14px;">Your ride is scheduled for <strong>${formattedTime}</strong>. A driver will be assigned automatically shortly.</p>
                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin:16px 0;">
                    <p style="margin:4px 0;font-size:14px;color:#374151;"><strong>📍 From:</strong> ${ride.pickupAddress || 'N/A'}</p>
                    <p style="margin:4px 0;font-size:14px;color:#374151;"><strong>📍 To:</strong> ${ride.dropAddress || 'N/A'}</p>
                </div>
                <p style="color:#6b7280;font-size:13px;">Please be ready at your pickup location. You can still cancel or reschedule from the app if your plans change.</p>
            </div>
            <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
                <p style="color:#9ca3af;font-size:12px;margin:0;">Safro — Ride the price you decide</p>
            </div>
        </div>`
    };
};
