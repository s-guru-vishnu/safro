/**
 * Wallet Top-up Email Template
 */
const walletTopupTemplate = (user, amount, newBalance) => {
    const name = user?.name || 'User';
    return {
        subject: '💰 Wallet Topped Up — Safro',
        html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <tr><td style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:22px;">💰 Wallet Top-up Successful</h1>
    </td></tr>
    <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 16px;color:#334155;font-size:15px;">Hello <strong>${name}</strong>,</p>
        <p style="margin:0 0 20px;color:#64748b;font-size:14px;">Your Safro wallet has been topped up successfully.</p>
        <table width="100%" style="margin-bottom:16px;"><tr>
            <td width="50%" style="padding-right:6px;">
                <table width="100%" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;"><tr><td style="padding:16px;text-align:center;">
                    <span style="color:#059669;font-size:11px;text-transform:uppercase;">Amount Added</span>
                    <p style="margin:4px 0 0;color:#065f46;font-size:22px;font-weight:800;">₹${amount}</p>
                </td></tr></table>
            </td>
            <td width="50%" style="padding-left:6px;">
                <table width="100%" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;"><tr><td style="padding:16px;text-align:center;">
                    <span style="color:#2563eb;font-size:11px;text-transform:uppercase;">New Balance</span>
                    <p style="margin:4px 0 0;color:#1e40af;font-size:22px;font-weight:800;">₹${newBalance}</p>
                </td></tr></table>
            </td>
        </tr></table>
    </td></tr>
    <tr><td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:11px;">Use your wallet balance for instant payments with 2% cashback!</p>
    </td></tr>
</table></td></tr></table></body></html>`
    };
};
module.exports = walletTopupTemplate;
