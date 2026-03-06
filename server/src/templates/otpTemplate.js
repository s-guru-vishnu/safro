/**
 * OTP Email Template
 * @param {Object} user - User object { name }
 * @param {string} otp - The OTP code
 * @param {string} purpose - Purpose of OTP (e.g., "Verification", "Password Reset")
 */
const otpTemplate = (user, otp, purpose = 'Verification') => {
    return {
        subject: `🔐 ${purpose} OTP — Safro`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155; }
                .card { background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; overflow: hidden; }
                .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; color: #ffffff; }
                .body { padding: 40px; text-align: center; }
                .otp-box { background: #f0fdf4; border: 2px solid #a7f3d0; border-radius: 12px; padding: 24px; margin: 24px 0; display: inline-block; }
                .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #065f46; margin: 0; }
                .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
                .button { background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="card">
                    <div class="header">
                        <h1 style="margin:0; font-size: 24px;">Safro</h1>
                    </div>
                    <div class="body">
                        <h2 style="margin-top: 0; color: #1e293b;">${purpose} Code</h2>
                        <p>Hello <strong>${user.name || 'User'}</strong>,</p>
                        <p>Use the following ${purpose === 'Verification' ? 'verification' : 'password reset'} code to continue:</p>
                        
                        <div class="otp-box">
                            <div class="otp-code">${otp}</div>
                        </div>
                        
                        <p style="margin-bottom: 0;">This code will expire in 5 minutes.</p>
                        <p style="font-size: 14px; color: #64748b; margin-top: 8px;">For security, do not share this code with anyone.</p>
                    </div>
                    <div class="footer">
                        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Safro. All rights reserved.</p>
                        <p style="margin: 4px 0 0;">Where the Price is Yours to Decide</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `
    };
};

module.exports = otpTemplate;
