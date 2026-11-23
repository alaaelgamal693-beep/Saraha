const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const emailTemplate = ({ title, message, otp }) => {
    const safeTitle = escapeHtml(title);
    const safeMessage = escapeHtml(message);
    const safeOtp = escapeHtml(otp);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:40px 16px;background:#f3f5f9;font-family:Arial,Helvetica,sans-serif;text-align:center;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8ebf2;box-shadow:0 12px 35px rgba(20,28,58,0.08);">

                    <tr>
                        <td align="center" style="padding:26px 30px;background:linear-gradient(135deg,#5b67f1,#7c5cf5);">
                            <div style="text-align:center;font-size:28px;line-height:34px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                                Saraha
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:42px 34px 38px;">
                            <h1 style="margin:0 0 12px;text-align:center;font-size:24px;line-height:32px;color:#182033;">
                                ${safeTitle}
                            </h1>

                            <p style="margin:0 0 28px;text-align:center;font-size:15px;line-height:24px;color:#687086;">
                                ${safeMessage}
                            </p>

                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                                <tr>
                                    <td align="center" style="padding:18px 28px;background:#f2f4ff;border:1px solid #dde2ff;border-radius:12px;font-size:32px;line-height:38px;font-weight:800;letter-spacing:9px;color:#4e5bd9;">
                                        ${safeOtp}
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:24px 0 0;text-align:center;font-size:14px;line-height:22px;color:#858ba0;">
                                This code expires in <strong style="color:#5b67f1;">10 minutes</strong>.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:20px 30px;background:#fafbfc;border-top:1px solid #eef0f5;">
                            <p style="margin:0 0 6px;text-align:center;font-size:12px;line-height:18px;color:#a0a5b3;">
                                If you did not request this action, you can safely ignore this email.
                            </p>
                            <p style="margin:0;text-align:center;font-size:12px;line-height:18px;color:#b0b4c1;">
                                © 2026 Saraha. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};
