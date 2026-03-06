/**
 * Payment Receipt Email Template
 */
const paymentReceiptTemplate = (user, ride) => {
    const userName = user?.name || 'Rider';
    const method = ride?.paymentMethod || 'Cash';
    const fare = ride?.agreedFare || ride?.finalFare || ride?.proposedFare || 0;
    const commission = ride?.platformFee || ride?.commission || Math.round(fare * 0.05) || 0;
    const total = ride?.totalPaid || (Number(fare) + Number(commission)) || fare;
    const rideId = ride?._id || '—';
    const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    return {
        subject: '💳 Payment Receipt — Safro',
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
        <h1 style="margin:0;color:#fff;font-size:22px;">💳 Payment Receipt</h1>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Ride #${String(rideId).slice(-8).toUpperCase()}</p>
    </td></tr>
    <!-- Body -->
    <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 20px;color:#334155;font-size:15px;">Hello <strong>${userName}</strong>,</p>
        <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">Here's your payment receipt for your recent Safro ride.</p>
        
        <!-- Payment Method -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr>
                <td style="padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                    <table width="100%">
                        <tr>
                            <td style="color:#64748b;font-size:13px;">Payment Method</td>
                            <td style="text-align:right;color:#1e293b;font-size:14px;font-weight:700;">${method.charAt(0).toUpperCase() + method.slice(1)}</td>
                        </tr>
                        <tr>
                            <td style="color:#64748b;font-size:13px;padding-top:6px;">Date</td>
                            <td style="text-align:right;color:#1e293b;font-size:13px;padding-top:6px;">${date}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <!-- Fare Breakdown -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr><td style="padding:16px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                <span style="color:#334155;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Fare Breakdown</span>
            </td></tr>
            <tr><td style="padding:16px 20px;">
                <table width="100%">
                    <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;">Ride Fare</td>
                        <td style="padding:6px 0;text-align:right;color:#1e293b;font-size:14px;">₹${fare}</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;">Platform Fee</td>
                        <td style="padding:6px 0;text-align:right;color:#1e293b;font-size:14px;">₹${commission}</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding:8px 0 0;border-top:1px solid #e2e8f0;"></td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0;color:#1e293b;font-size:16px;font-weight:800;">Total Paid</td>
                        <td style="padding:4px 0;text-align:right;color:#059669;font-size:22px;font-weight:800;">₹${total}</td>
                    </tr>
                </table>
            </td></tr>
        </table>
    </td></tr>
    <!-- Footer -->
    <tr><td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:12px;">This is an automated receipt from <strong>Safro</strong>. For queries, contact safro.2026.safro@gmail.com</p>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
    };
};

module.exports = paymentReceiptTemplate;
