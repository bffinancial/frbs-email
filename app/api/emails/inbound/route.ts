import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function previewText(value: string, max = 220) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/emails/inbound",
  });
}

export async function POST(req: Request) {
  try {
    const event = await req.json();

    console.log("INBOUND WEBHOOK EVENT:", JSON.stringify(event, null, 2));

    if (event.type !== "email.received") {
      return NextResponse.json({ received: true });
    }

    const emailId = event.data?.email_id || event.data?.id;

    if (!emailId) {
      return NextResponse.json({ error: "Missing email_id." }, { status: 400 });
    }

    const { data: receivedEmail, error } =
      await resend.emails.receiving.get(emailId);

    if (error || !receivedEmail) {
      console.error("RESEND RECEIVE ERROR:", error);

      return NextResponse.json(
        { error: error?.message || "Unable to retrieve received email." },
        { status: 500 }
      );
    }

    const toEmailRaw =
      Array.isArray(receivedEmail.to) && receivedEmail.to.length > 0
        ? receivedEmail.to[0]
        : Array.isArray(event.data?.to) && event.data.to.length > 0
          ? event.data.to[0]
          : event.data?.to;

    const toEmail =
      typeof toEmailRaw === "string" ? toEmailRaw.toLowerCase().trim() : "";

    const fromEmail =
      typeof receivedEmail.from === "string"
        ? receivedEmail.from
        : event.data?.from || "";

    const subject =
      receivedEmail.subject || event.data?.subject || "(No subject)";

    const body = receivedEmail.text || receivedEmail.html || "";

    if (!toEmail) {
      return NextResponse.json(
        { error: "Missing recipient email." },
        { status: 400 }
      );
    }

    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .select("id, forwarding_email, company_email, full_name")
      .eq("company_email", toEmail)
      .maybeSingle();

    if (agentError) {
      console.error("AGENT LOOKUP ERROR:", agentError);

      return NextResponse.json({ error: agentError.message }, { status: 500 });
    }

    if (!agent) {
      return NextResponse.json(
        { error: `No agent found for ${toEmail}.` },
        { status: 404 }
      );
    }

    const { data: thread, error: threadError } = await supabaseAdmin
      .from("email_threads")
      .insert({
        agent_id: agent.id,
        subject,
      })
      .select("id")
      .single();

    if (threadError || !thread) {
      console.error("THREAD INSERT ERROR:", threadError);

      return NextResponse.json(
        { error: threadError?.message || "Unable to create thread." },
        { status: 500 }
      );
    }

    const { error: emailError } = await supabaseAdmin.from("emails").insert({
      thread_id: thread.id,
      agent_id: agent.id,
      from_email: fromEmail,
      to_email: toEmail,
      subject,
      body,
      direction: "inbound",
      status: "received",
      opened: false,
      starred: false,
      deleted: false,
      provider_message_id: emailId,
    });

    if (emailError) {
      console.error("EMAIL INSERT ERROR:", emailError);

      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    if (agent.forwarding_email) {
      const inboxUrl = "https://www.frbsmail.com/inbox";
      const cleanPreview = previewText(body);
      const notificationSubject = `New FRBS Mail: ${subject}`;

      const notificationResult = await resend.emails.send({
        from: "FRBS Mail Notifications <notifications@frbsmail.com>",
        to: [agent.forwarding_email],
        subject: notificationSubject,
        text: `You received a new email in FRBS Mail.

From: ${fromEmail}
To: ${toEmail}
Subject: ${subject}

Preview:
${cleanPreview}

Open Inbox:
${inboxUrl}`,
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f3ef;padding:24px;">
            <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #eadede;border-radius:18px;overflow:hidden;">
              <div style="background:#4b0008;color:#ffffff;padding:20px 24px;">
                <h1 style="margin:0;font-size:22px;">New FRBS Mail Received</h1>
                <p style="margin:8px 0 0;color:#f4d7d9;">${escapeHtml(toEmail)}</p>
              </div>

              <div style="padding:24px;color:#2c0004;">
                <p><strong>From:</strong> ${escapeHtml(fromEmail)}</p>
                <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>

                <div style="margin-top:18px;padding:16px;background:#fbfaf8;border-radius:14px;border:1px solid #eadede;">
                  ${escapeHtml(cleanPreview || "No preview available.")}
                </div>

                <p style="margin-top:24px;">
                  <a href="${inboxUrl}" style="display:inline-block;background:#4b0008;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:bold;">
                    Open FRBS Mail Inbox
                  </a>
                </p>
              </div>
            </div>
          </div>
        `,
      });

      if ("error" in notificationResult && notificationResult.error) {
        console.error("NOTIFICATION EMAIL ERROR:", notificationResult.error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("INBOUND EMAIL ERROR:", error);

    return NextResponse.json(
      { error: "Unexpected inbound email error." },
      { status: 500 }
    );
  }
}