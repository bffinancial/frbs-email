import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/mail/sendEmail";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { threadId, message } = body;

    if (!threadId || !message?.trim()) {
      return NextResponse.json(
        { error: "Missing threadId or message." },
        { status: 400 }
      );
    }

    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .select("id, first_name, last_name, full_name, company_email, primary_sender_email")
      .eq("user_id", user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent not found." }, { status: 404 });
    }

    const { data: thread, error: threadError } = await supabaseAdmin
      .from("email_threads")
      .select("*")
      .eq("id", threadId)
      .eq("agent_id", agent.id)
      .single();

    if (threadError || !thread) {
      return NextResponse.json({ error: "Thread not found." }, { status: 404 });
    }

    const { data: lastEmail, error: lastEmailError } = await supabaseAdmin
      .from("emails")
      .select("*")
      .eq("thread_id", threadId)
      .eq("agent_id", agent.id)
      .or("deleted.is.null,deleted.eq.false")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lastEmailError || !lastEmail) {
      return NextResponse.json(
        { error: "No message found in this thread." },
        { status: 404 }
      );
    }
const senderEmail =
  agent.primary_sender_email ||
  agent.company_email ||
  lastEmail.to_email;

const senderName =
  agent.full_name?.trim() ||
  [agent.first_name, agent.last_name].filter(Boolean).join(" ").trim() ||
  "Agent";

const fromEmail = `FRBS ${senderName} <${senderEmail}>`;

    const toEmail =
      lastEmail.direction === "outbound"
        ? lastEmail.to_email
        : lastEmail.from_email;

    const subject = thread.subject?.startsWith("Re:")
      ? thread.subject
      : `Re: ${thread.subject || lastEmail.subject || "(No subject)"}`;
const sendResult = await sendEmail({
  from: fromEmail,
  to: toEmail,
  subject,
  text: message.trim(),
  html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; white-space: pre-wrap;">${message
    .trim()
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</div>`,
});
    const { data: insertedEmail, error: insertError } = await supabaseAdmin
      .from("emails")
      .insert({
        thread_id: threadId,
        agent_id: agent.id,
        from_email: fromEmail,
        to_email: toEmail,
        subject,
        body: message.trim(),
        direction: "outbound",
        status: "sent",
        opened: true,
        starred: false,
        deleted: false,
        reply_to_email_id: lastEmail.id,
        provider_message_id: sendResult?.id || null,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await supabaseAdmin
      .from("email_threads")
      .update({
        subject,
        updated_at: new Date().toISOString(),
      })
      .eq("id", threadId)
      .eq("agent_id", agent.id);

    return NextResponse.json({
      success: true,
      email: insertedEmail,
    });
  } catch (error) {
    console.error("REPLY API ERROR:", error);
    return NextResponse.json(
      { error: "Server error sending reply." },
      { status: 500 }
    );
  }
}