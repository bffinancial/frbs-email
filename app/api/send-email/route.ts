import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { agentId, fromEmail, toEmail, subject, body } = await req.json();

    if (!agentId || !fromEmail || !toEmail || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const { data: agentProfile, error: agentProfileError } =
      await supabaseAdmin
        .from("agents")
        .select(
          "first_name, last_name, full_name, company_email, primary_sender_email"
        )
        .eq("id", agentId)
        .single();

    if (agentProfileError || !agentProfile) {
      return NextResponse.json(
        { error: "Unable to load agent sender profile." },
        { status: 404 }
      );
    }

    const senderEmail =
      agentProfile.primary_sender_email ||
      agentProfile.company_email ||
      fromEmail;

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
        subject,
      })
      .select()
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: threadError?.message || "Unable to create email thread." },
        { status: 500 }
      );
    }

    const { data: email, error: emailError } = await supabaseAdmin
      .from("emails")
      .insert({
        thread_id: thread.id,
        agent_id: agentId,
        from_email: senderEmail,
        to_email: toEmail,
        subject,
        body,
        direction: "outbound",
        status: "queued",
        opened: false,
        starred: false,
        deleted: false,
      })
      .select()
      .single();

    if (emailError || !email) {
      return NextResponse.json(
        { error: emailError?.message || "Unable to save email." },
        { status: 500 }
      );
    }

    const resendResult = await resend.emails.send({
      from: formattedFrom,
      to: [toEmail],
      subject,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;">
          ${body.replace(/\n/g, "<br />")}
        </div>
      `,
    });

    if ("error" in resendResult && resendResult.error) {
      await supabaseAdmin
        .from("emails")
        .update({ status: "failed" })
        .eq("id", email.id);

      return NextResponse.json(
        { error: resendResult.error.message },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("emails")
      .update({ status: "sent" })
      .eq("id", email.id);

    return NextResponse.json({
      success: true,
      thread,
      email,
      resend: resendResult,
    });
  } catch (error) {
    console.error("SEND EMAIL ERROR:", error);

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}