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

export async function POST(req: Request) {
  try {
    const { agentId, fromEmail, toEmail, subject, body } = await req.json();

    const cleanToEmail = String(toEmail || "").trim().toLowerCase();
    const cleanSubject = String(subject || "").trim();
    const cleanBody = String(body || "").trim();

    if (!agentId || !fromEmail || !cleanToEmail || !cleanSubject || !cleanBody) {
      return NextResponse.json(
        { error: "Please complete all required fields." },
        { status: 400 }
      );
    }

    const { data: agentProfile, error: agentProfileError } =
      await supabaseAdmin
        .from("agents")
        .select("id, first_name, last_name, full_name, company_email")
        .eq("id", agentId)
        .single();

    if (agentProfileError || !agentProfile) {
      return NextResponse.json(
        { error: "Unable to load agent sender profile." },
        { status: 404 }
      );
    }

    const senderEmail = agentProfile.company_email || fromEmail;

    const senderName =
      agentProfile.full_name?.trim() ||
      [agentProfile.first_name, agentProfile.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      "Agent";

    const formattedFrom = `FRBS ${senderName} <${senderEmail}>`;

    const { data: thread, error: threadError } = await supabaseAdmin
      .from("email_threads")
      .insert({
        agent_id: agentId,
        subject: cleanSubject,
      })
      .select("id, subject, created_at, updated_at")
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: threadError?.message || "Unable to create email thread." },
        { status: 500 }
      );
    }

    const resendResult = await resend.emails.send({
      from: formattedFrom,
      to: [cleanToEmail],
      subject: cleanSubject,
      text: cleanBody,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;white-space:pre-wrap;">
          ${escapeHtml(cleanBody)}
        </div>
      `,
    });

    if ("error" in resendResult && resendResult.error) {
      return NextResponse.json(
        { error: resendResult.error.message },
        { status: 500 }
      );
    }

    const providerMessageId =
      "data" in resendResult ? resendResult.data?.id || null : null;

    const { data: email, error: emailError } = await supabaseAdmin
      .from("emails")
      .insert({
        thread_id: thread.id,
        agent_id: agentId,
        from_email: senderEmail,
        to_email: cleanToEmail,
        subject: cleanSubject,
        body: cleanBody,
        direction: "outbound",
        status: "sent",
        opened: true,
        starred: false,
        deleted: false,
        provider_message_id: providerMessageId,
      })
      .select("*")
      .single();

    if (emailError || !email) {
      return NextResponse.json(
        {
          error:
            emailError?.message ||
            "Email was sent, but could not be saved to Sent.",
        },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("email_threads")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", thread.id);

    return NextResponse.json({
      success: true,
      thread,
      email,
      providerMessageId,
    });
  } catch (error) {
    console.error("SEND EMAIL ERROR:", error);

    return NextResponse.json(
      { error: "Unexpected server error sending email." },
      { status: 500 }
    );
  }
}