import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("threadId");

    if (!threadId) {
      return NextResponse.json({ error: "Missing threadId." }, { status: 400 });
    }

    const { data: agents, error: agentError } = await supabaseAdmin
  .from("agents")
  .select("id")
  .eq("user_id", user.id)
  .limit(1);

if (agentError) {
  return NextResponse.json({ error: agentError.message }, { status: 500 });
}

const agent = agents?.[0];

if (!agent) {
  return NextResponse.json(
    { error: "Agent not found for logged-in user." },
    { status: 404 }
  );
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

   const { data: emails, error: emailsError } = await supabaseAdmin
  .from("emails")
  .select("*")
  .eq("thread_id", threadId)
  .eq("agent_id", agent.id)
  .or("deleted.is.null,deleted.eq.false")
  .order("created_at", { ascending: true });

    if (emailsError) {
      return NextResponse.json({ error: emailsError.message }, { status: 500 });
    }

    return NextResponse.json({
      thread,
      emails: emails || [],
    });
  } catch (error) {
    console.error("THREAD API ERROR:", error);
    return NextResponse.json(
      { error: "Server error loading thread." },
      { status: 500 }
    );
  }
}