import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.frbsmail.com";
const LOGO_URL = `${SITE_URL}/frbs-logo.png`;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type SendWelcomeEmailParams = {
  to: string;
  fullName: string;
  companyEmail: string;
  role: string;
  inviteLink: string;
};

export async function sendWelcomeEmail({
  to,
  fullName,
  companyEmail,
  role,
  inviteLink,
}: SendWelcomeEmailParams) {
  const safeName = escapeHtml(fullName);
  const safeCompanyEmail = escapeHtml(companyEmail);
  const safeRole = escapeHtml(role);

  return resend.emails.send({
    from: "FRBS Mail <notifications@frbsmail.com>",
    to: [to],
    subject: "Welcome to FRBS Mail - Activate Your Account",
    text: `Welcome to FRBS Mail, ${fullName}.

Your professional FRBS Mail account has been created.

FRBS Email:
${companyEmail}

Role:
${role}

Create your password and activate your account here:
${inviteLink}

Login page:
${SITE_URL}/login`,
    html: `
      <div style="margin:0;padding:0;background:#f6f3ef;font-family:Arial,Helvetica,sans-serif;color:#2c0004;">
        <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
          <div style="background:#ffffff;border:1px solid #eadede;border-radius:22px;overflow:hidden;">
            <div style="background:#4b0008;padding:28px;text-align:center;">
              <img src="${LOGO_URL}" alt="FRBS Mail" width="220" style="max-width:220px;height:auto;margin:0 auto 18px;display:block;" />
              <p style="margin:0;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:700;color:#f4d7d9;">
                FRBS Mail
              </p>
              <h1 style="margin:12px 0 0;font-size:30px;line-height:1.2;color:#ffffff;">
                Welcome, ${safeName}
              </h1>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#f4d7d9;">
                Your professional mailbox is ready.
              </p>
            </div>

            <div style="padding:28px;">
              <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">
                You have been added to the FRBS Mail platform. Use the secure button below to create your password and activate your account.
              </p>

              <div style="background:#fbfaf8;border:1px solid #eadede;border-radius:18px;padding:20px;margin:22px 0;">
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#7a1118;">
                  Your FRBS Email
                </p>
                <p style="margin:0;font-size:20px;font-weight:800;color:#4b0008;">
                  ${safeCompanyEmail}
                </p>

                <div style="height:1px;background:#eadede;margin:18px 0;"></div>

                <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#7a1118;">
                  Role
                </p>
                <p style="margin:0;font-size:16px;font-weight:700;">
                  ${safeRole}
                </p>
              </div>

              <p style="margin:24px 0;">
                <a href="${inviteLink}" style="display:inline-block;background:#4b0008;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:14px;font-weight:800;">
                  Create My Password
                </a>
              </p>

              <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#6f2b31;">
                After creating your password, log in here:
                <br />
                <a href="${SITE_URL}/login" style="color:#4b0008;font-weight:700;">
                  ${SITE_URL}/login
                </a>
              </p>

              <div style="margin-top:28px;padding-top:18px;border-top:1px solid #eadede;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6f2b31;">
                  Security note: only create your password if you were expecting this invitation from FRBS Mail.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  });
}