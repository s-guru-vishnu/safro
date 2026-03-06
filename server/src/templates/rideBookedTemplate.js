/**
 * Ride Booked Email Template
 */
const rideBookedTemplate = (user, ride) => {
    const userName = user?.name || 'Rider';
    const pickup = ride?.pickupAddress || ride?.pickupLocation?.address || 'Pickup Location';
    const drop = ride?.dropAddress || ride?.dropLocation?.address || 'Drop Location';
    const fare = ride?.agreedFare || ride?.proposedFare || ride?.estimatedFare || '—';

    return {
        subject: '🚗 Ride Booked Successfully — Safro',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <!-- Header -->
    <tr><td style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:22px;">🚗 Ride Booked</h1>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Your ride has been successfully booked</p>
    </td></tr>
    <!-- Body -->
    <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 20px;color:#334155;font-size:15px;">Hello <strong>${userName}</strong>,</p>
        <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">Your ride has been placed on the Safro marketplace. Drivers will start sending offers shortly.</p>
        
        <!-- Route Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:20px;">
                <table width="100%">
                    <tr>
                        <td style="padding:0 0 12px;border-bottom:1px dashed #e2e8f0;">
                            <span style="display:inline-block;width:8px;height:8px;background:#10b981;border-radius:50%;margin-right:10px;vertical-align:middle;"></span>
                            <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Pickup</span>
                            <p style="margin:4px 0 0 18px;color:#1e293b;font-size:14px;font-weight:600;">${pickup}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:12px 0 0;">
                            <span style="display:inline-block;width:8px;height:8px;background:#ef4444;border-radius:50%;margin-right:10px;vertical-align:middle;"></span>
                            <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Drop</span>
                            <p style="margin:4px 0 0 18px;color:#1e293b;font-size:14px;font-weight:600;">${drop}</p>
                        </td>
                    </tr>
                </table>
            </td></tr>
        </table>

        <!-- Fare -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;">
            <tr><td style="padding:16px 20px;text-align:center;">
                <span style="color:#059669;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Estimated Fare</span>
                <p style="margin:4px 0 0;color:#065f46;font-size:26px;font-weight:800;">₹${fare}</p>
            </td></tr>
        </table>
    </td></tr>
    <!-- Footer -->
    <tr><td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:12px;">Thank you for choosing <strong>Safro</strong> — Where the Price is Yours to Decide.</p>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
    };
};

module.exports = rideBookedTemplate;
