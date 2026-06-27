/**
 * Email template: Scheduled Ride Confirmation
 */
module.exports = (user, ride) => {
    const date = new Date(ride.scheduledTime);
    const formattedDate = date.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return {
        subject: `🗓️ Ride Scheduled — ${formattedDate} at ${formattedTime}`,
        html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:28px 24px;text-align:center;">
                <h1 style="color:white;margin:0;font-size:22px;">🗓️ Ride Scheduled!</h1>
                <p style="color:#ccfbf1;margin:8px 0 0;font-size:14px;">Your ride has been pre-booked.</p>
            </div>
            <div style="padding:24px;">
                <p style="color:#374151;font-size:15px;">Hi <strong>${user.name}</strong>,</p>
                <p style="color:#6b7280;font-size:14px;">Your ride has been successfully scheduled:</p>
                <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:16px;margin:16px 0;">
                    <p style="margin:4px 0;font-size:14px;color:#374151;"><strong>📅 Date:</strong> ${formattedDate}</p>
                    <p style="margin:4px 0;font-size:14px;color:#374151;"><strong>⏰ Time:</strong> ${formattedTime}</p>
                    <p style="margin:4px 0;font-size:14px;color:#374151;"><strong>📍 Pickup:</strong> ${ride.pickupAddress || 'N/A'}</p>
                    <p style="margin:4px 0;font-size:14px;color:#374151;"><strong>📍 Drop:</strong> ${ride.dropAddress || 'N/A'}</p>
                    <p style="margin:4px 0;font-size:14px;color:#374151;"><strong>💰 Fare:</strong> ₹${ride.proposedFare || 'TBD'}</p>
                </div>
                <p style="color:#6b7280;font-size:13px;">A driver will be assigned automatically 10 minutes before your ride. You'll receive a reminder 30 minutes before departure.</p>
            </div>
            <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
                <p style="color:#9ca3af;font-size:12px;margin:0;">Safro — Ride the price you decide</p>
            </div>
        </div>`
    };
};
