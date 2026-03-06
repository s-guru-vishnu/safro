/**
 * Application Approved Email Template
 */
const applicationApprovedTemplate = (user) => {
    const name = user?.name || 'Driver';
    return {
        subject: '🎉 Driver Application Approved — Welcome to the Safro Fleet!',
        html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <tr><td style="background:linear-gradient(135deg,#065f46,#059669);padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:24px;">🎉 You're Approved!</h1>
    </td></tr>
    <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 16px;color:#334155;font-size:15px;">Congratulations <strong>${name}</strong>!</p>
        <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">Your driver application has been approved. You are now part of the Safro fleet and can start accepting rides immediately!</p>
        <table width="100%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;"><tr><td style="padding:20px;">
            <p style="margin:0 0 10px;color:#15803d;font-size:13px;font-weight:700;">Next Steps:</p>
            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.8;">
                ✅ Log in to the Safro app<br>
                ✅ Go online to accept ride requests<br>
                ✅ Negotiate fares and start earning<br>
                ✅ Get paid directly — no hidden commissions
            </p>
        </td></tr></table>
    </td></tr>
    <tr><td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:11px;">Welcome to the Safro family! Drive safe. 🚗</p>
    </td></tr>
</table></td></tr></table></body></html>`
    };
};
module.exports = applicationApprovedTemplate;
