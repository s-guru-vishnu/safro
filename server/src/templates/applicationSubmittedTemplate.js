/**
 * Driver Application Submitted Template
 */
const applicationSubmittedTemplate = (user, application) => {
    const name = user?.name || 'Applicant';
    const vehicle = `${application?.vehicleType || 'Vehicle'} — ${application?.vehicleNumber || ''}`;
    return {
        subject: '📋 Driver Application Received — Safro',
        html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <tr><td style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:22px;">📋 Application Received</h1>
    </td></tr>
    <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 16px;color:#334155;font-size:15px;">Hello <strong>${name}</strong>,</p>
        <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">We've received your driver application. Our admin team will review your documents and contact you for an offline verification meeting.</p>
        <table width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;"><tr><td style="padding:16px 20px;">
            <p style="margin:0 0 6px;color:#64748b;font-size:12px;">VEHICLE</p>
            <p style="margin:0;color:#1e293b;font-size:14px;font-weight:600;">${vehicle}</p>
        </td></tr></table>
        <table width="100%" style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;margin-top:16px;"><tr><td style="padding:14px 20px;">
            <p style="margin:0;color:#92400e;font-size:13px;">⏳ <strong>Status:</strong> Pending Review — We'll update you soon.</p>
        </td></tr></table>
    </td></tr>
    <tr><td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:11px;">Keep your original documents ready for verification.</p>
    </td></tr>
</table></td></tr></table></body></html>`
    };
};
module.exports = applicationSubmittedTemplate;
