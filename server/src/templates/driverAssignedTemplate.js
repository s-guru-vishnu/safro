/**
 * Driver Assigned Email Template
 */
const driverAssignedTemplate = (user, driver, ride) => {
    const userName = user?.name || 'Rider';
    const driverName = driver?.name || driver?.userId?.name || 'Your Driver';
    const vehicleNumber = driver?.vehicleNumber || '—';
    const vehicleType = driver?.vehicleType || 'Car';
    const phone = driver?.phone || driver?.userId?.phone || '';
    const fare = ride?.agreedFare || ride?.proposedFare || '—';

    return {
        subject: '✅ Driver Assigned — Safro',
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
        <h1 style="margin:0;color:#fff;font-size:22px;">✅ Driver Assigned</h1>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Your ride is confirmed</p>
    </td></tr>
    <!-- Body -->
    <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 20px;color:#334155;font-size:15px;">Hello <strong>${userName}</strong>,</p>
        <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">Great news! A driver has been assigned to your ride. They'll be at your pickup point shortly.</p>
        
        <!-- Driver Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:24px;">
                <table width="100%">
                    <tr>
                        <td>
                            <p style="margin:0;color:#15803d;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Driver Details</p>
                            <h2 style="margin:8px 0 4px;color:#1e293b;font-size:20px;">${driverName}</h2>
                            <p style="margin:0;color:#64748b;font-size:14px;">${vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} • <strong>${vehicleNumber}</strong></p>
                            ${phone ? `<p style="margin:8px 0 0;color:#64748b;font-size:13px;">📞 ${phone}</p>` : ''}
                        </td>
                    </tr>
                </table>
            </td></tr>
        </table>

        <!-- Agreed Fare -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
            <tr><td style="padding:16px 20px;text-align:center;">
                <span style="color:#2563eb;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Agreed Fare</span>
                <p style="margin:4px 0 0;color:#1e40af;font-size:26px;font-weight:800;">₹${fare}</p>
            </td></tr>
        </table>
    </td></tr>
    <!-- Footer -->
    <tr><td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:12px;">Track your ride in real-time on the <strong>Safro</strong> app.</p>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
    };
};

module.exports = driverAssignedTemplate;
