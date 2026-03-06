/**
 * Ride Completed Email Template
 */
const rideCompletedTemplate = (user, ride) => {
    const userName = user?.name || 'Rider';
    const pickup = ride?.pickupAddress || ride?.pickupLocation?.address || 'Pickup';
    const drop = ride?.dropAddress || ride?.dropLocation?.address || 'Drop';
    const distance = ride?.distance || '—';
    const fare = ride?.agreedFare || ride?.finalFare || ride?.proposedFare || '—';
    const duration = ride?.duration || '—';

    return {
        subject: '🏁 Ride Completed — Safro',
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
        <h1 style="margin:0;color:#fff;font-size:22px;">🏁 Ride Completed</h1>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Thanks for riding with Safro</p>
    </td></tr>
    <!-- Body -->
    <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 20px;color:#334155;font-size:15px;">Hello <strong>${userName}</strong>,</p>
        <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">Your ride has been completed successfully. Here's your trip summary:</p>
        
        <!-- Trip Summary -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:20px;">
                <table width="100%">
                    <tr>
                        <td style="padding:0 0 10px;">
                            <span style="display:inline-block;width:8px;height:8px;background:#10b981;border-radius:50%;margin-right:10px;vertical-align:middle;"></span>
                            <span style="color:#64748b;font-size:12px;">FROM</span>
                            <p style="margin:2px 0 0 18px;color:#1e293b;font-size:13px;font-weight:600;">${pickup}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0 0;border-top:1px dashed #e2e8f0;">
                            <span style="display:inline-block;width:8px;height:8px;background:#ef4444;border-radius:50%;margin-right:10px;vertical-align:middle;"></span>
                            <span style="color:#64748b;font-size:12px;">TO</span>
                            <p style="margin:2px 0 0 18px;color:#1e293b;font-size:13px;font-weight:600;">${drop}</p>
                        </td>
                    </tr>
                </table>
            </td></tr>
        </table>

        <!-- Stats Row -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
                <td width="50%" style="padding-right:8px;">
                    <table width="100%" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;">
                        <tr><td style="padding:16px;text-align:center;">
                            <span style="color:#0284c7;font-size:11px;text-transform:uppercase;">Distance</span>
                            <p style="margin:4px 0 0;color:#0c4a6e;font-size:20px;font-weight:800;">${distance}</p>
                        </td></tr>
                    </table>
                </td>
                <td width="50%" style="padding-left:8px;">
                    <table width="100%" style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:8px;">
                        <tr><td style="padding:16px;text-align:center;">
                            <span style="color:#9333ea;font-size:11px;text-transform:uppercase;">Duration</span>
                            <p style="margin:4px 0 0;color:#581c87;font-size:20px;font-weight:800;">${duration}</p>
                        </td></tr>
                    </table>
                </td>
            </tr>
        </table>

        <!-- Total Fare -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;">
            <tr><td style="padding:16px 20px;text-align:center;">
                <span style="color:#059669;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Total Fare</span>
                <p style="margin:4px 0 0;color:#065f46;font-size:28px;font-weight:800;">₹${fare}</p>
            </td></tr>
        </table>
    </td></tr>
    <!-- Footer -->
    <tr><td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:12px;">Rate your ride on the <strong>Safro</strong> app. Your feedback helps us improve!</p>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
    };
};

module.exports = rideCompletedTemplate;
