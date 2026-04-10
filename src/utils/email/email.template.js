export const emailTemp = (otp) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Saraha Message</title>
</head>
<body style="margin:0; padding:0; background-color:#0f172a; font-family: Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f172a; padding:20px;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#020617; border-radius:10px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:20px; text-align:center; background-color:#020617; border-bottom:1px solid #1e293b;">
              <h1 style="color:#38bdf8; margin:0;">Saraha</h1>
              <p style="color:#94a3b8; margin:5px 0 0;">Anonymous Messaging Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px; color:#e2e8f0; line-height:1.6;">

              <h2 style="margin-top:0; color:#f1f5f9;">You've received a new message 💬</h2>

              <p style="color:#cbd5f5;">
                Someone has sent you a message on <strong>Saraha</strong>.
              </p>

              <!-- Message Box -->
              <div style="background-color:#0f172a; padding:20px; border-radius:8px; border:1px solid #1e293b; margin:20px 0;">
                <p style="margin:0; color:#e2e8f0;">
                your code is: ${otp}
                </p>
              </div>

              <p style="color:#94a3b8;">
                Log in to your account to reply or view more messages.
              </p>

              <!-- Button -->
              <div style="text-align:center; margin:30px 0;">
                <a href="{{APP_LINK}}" 
                   style="background-color:#2563eb; color:#ffffff; padding:12px 25px; text-decoration:none; border-radius:6px; display:inline-block; font-weight:bold;">
                  View Message
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px; text-align:center; border-top:1px solid #1e293b;">
              <p style="color:#64748b; font-size:12px; margin:0;">
                You received this email because you have a Saraha account.
              </p>
              <p style="color:#475569; font-size:11px; margin-top:5px;">
                © 2026 Saraha. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`
}