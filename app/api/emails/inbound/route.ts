import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const resend = new Resend(process.env.RESEND_API_KEY);

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
      typeof toEmailRaw === "string"
        ? toEmailRaw.toLowerCase().trim()
        : "";

    const fromEmail =
      typeof receivedEmail.from === "string"
        ? receivedEmail.from
        : event.data?.from || "";

    const subject =
      receivedEmail.subject || event.data?.subject || "(No subject)";

    const body =
      receivedEmail.text ||
      receivedEmail.html ||
      "";

    if (!toEmail) {
      return NextResponse.json({ error: "Missing recipient email." }, { status: 400 });
    }

    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .select("id, forwarding_email, company_email")
      .eq("company_email", toEmail)
      .maybeSingle();

    if (agentError) {
      console.error("AGENT LOOKUP ERROR:", agentError);

      return NextResponse.json(
        { error: agentError.message },
        { status: 500 }
      );
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
    });

    if (emailError) {
      console.error("EMAIL INSERT ERROR:", emailError);

      return NextResponse.json(
        { error: emailError.message },
        { status: 500 }
      );
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