/**
 * Welcome Email Template — Sent after user registration
 */
const welcomeTemplate = (user) => {
    const name = user?.name || 'there';
    return {
        subject: '🎉 Welcome to Safro — Your Fair Ride Starts Here',
        html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <tr><td style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:24px;">Welcome to Safro! 🎉</h1>
    </td></tr>
    <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 16px;color:#334155;font-size:15px;">Hello <strong>${name}</strong>,</p>
        <p style="margin:0 0 16px;color:#64748b;font-size:14px;line-height:1.6;">Welcome aboard! Safro is India's first negotiation-based ride platform where <strong>you decide the fare</strong>.</p>
        <table width="100%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:20px 0;"><tr><td style="padding:20px;">
            <p style="margin:0 0 8px;color:#15803d;font-size:13px;font-weight:700;">Here's how it works:</p>
            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.8;">
                1️⃣ Enter your pickup & drop location<br>
                2️⃣ Propose your fare<br>
                3️⃣ Negotiate with drivers<br>
                4️⃣ Agree & ride — no surge, no hidden fees
            </p>
        </td></tr></table>
        <p style="margin:0;color:#64748b;font-size:14px;">We're glad to have you. Happy riding! 🚗</p>
    </td></tr>
    <tr><td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:11px;">Safro — Where the Price is Yours to Decide</p>
    </td></tr>
</table></td></tr></table></body></html>`
    };
};
module.exports = welcomeTemplate;
