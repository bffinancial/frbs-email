type SendEmailParams = {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

export async function sendEmail({
  from,
  to,
  subject,
  html,
  text,
}: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }
console.log("RESEND FROM:", from);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html: html || text || "",
      text: text || "",
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || "Email failed to send.");
  }

  return data;
}