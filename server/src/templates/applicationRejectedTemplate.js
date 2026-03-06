/**
 * Application Rejected Email Template
 */
const applicationRejectedTemplate = (user, reason) => {
    const name = user?.name || 'Applicant';
    const rejectionReason = reason || 'Application did not meet requirements';
    return {
        subject: '❌ Driver Application Update — Safro',
        html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <tr><td style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:22px;">Application Update</h1>
    </td></tr>
    <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 16px;color:#334155;font-size:15px;">Hello <strong>${name}</strong>,</p>
        <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">We've reviewed your driver application. Unfortunately, we're unable to approve it at this time.</p>
        <table width="100%" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;"><tr><td style="padding:16px 20px;">
            <p style="margin:0 0 4px;color:#991b1b;font-size:12px;font-weight:600;">REASON</p>
            <p style="margin:0;color:#7f1d1d;font-size:13px;">${rejectionReason}</p>
        </td></tr></table>
        <p style="margin:20px 0 0;color:#64748b;font-size:13px;">You can reapply after addressing the concerns above. Contact safro.2026.safro@gmail.com if you need help.</p>
    </td></tr>
    <tr><td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:11px;">Safro — We look forward to having you on board soon.</p>
    </td></tr>
</table></td></tr></table></body></html>`
    };
};
module.exports = applicationRejectedTemplate;
