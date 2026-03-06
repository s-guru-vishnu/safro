/**
 * Ride Cancelled Email Template
 */
const rideCancelledTemplate = (user, ride, cancelledBy) => {
    const name = user?.name || 'User';
    const pickup = ride?.pickupAddress || ride?.pickupLocation?.address || 'Pickup';
    const drop = ride?.dropAddress || ride?.dropLocation?.address || 'Drop';
    const who = cancelledBy || 'rider';
    return {
        subject: '🚫 Ride Cancelled — Safro',
        html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <tr><td style="background:linear-gradient(135deg,#7f1d1d,#991b1b);padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:22px;">🚫 Ride Cancelled</h1>
    </td></tr>
    <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 16px;color:#334155;font-size:15px;">Hello <strong>${name}</strong>,</p>
        <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">Your ride has been cancelled${who === 'driver' ? ' by the driver' : ''}.</p>
        <table width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;"><tr><td style="padding:16px 20px;">
            <p style="margin:0 0 4px;color:#64748b;font-size:11px;">ROUTE</p>
            <p style="margin:0;color:#1e293b;font-size:13px;"><span style="color:#10b981;">●</span> ${pickup} → <span style="color:#ef4444;">●</span> ${drop}</p>
        </td></tr></table>
        <p style="margin:20px 0 0;color:#64748b;font-size:13px;">You can book another ride anytime on the Safro app. No cancellation fee was charged.</p>
    </td></tr>
    <tr><td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:11px;">Safro — Where the Price is Yours to Decide</p>
    </td></tr>
</table></td></tr></table></body></html>`
    };
};
module.exports = rideCancelledTemplate;
