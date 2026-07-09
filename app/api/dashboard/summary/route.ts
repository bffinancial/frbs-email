import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Missing auth token." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { data: agent } = await supabaseAdmin
      .from("agents")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found." },
        { status: 404 }
      );
    }

    const isAdmin = agent.role?.toLowerCase() === "admin";

    let inboxQuery = supabaseAdmin
      .from("emails")
      .select("*", { count: "exact", head: true })
      .eq("direction", "inbound")
      .eq("deleted", false);

    let sentQuery = supabaseAdmin
      .from("emails")
      .select("*", { count: "exact", head: true })
      .eq("direction", "outbound")
      .eq("deleted", false);

    let unreadQuery = supabaseAdmin
      .from("emails")
      .select("*", { count: "exact", head: true })
      .eq("direction", "inbound")
      .eq("opened", false)
      .eq("deleted", false);

    let latestInboxQuery = supabaseAdmin
      .from("emails")
      .select("*")
      .eq("direction", "inbound")
      .eq("deleted", false)
      .order("created_at", { ascending: false })
      .limit(5);

    let latestSentQuery = supabaseAdmin
      .from("emails")
      .select("*")
      .eq("direction", "outbound")
      .eq("deleted", false)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!isAdmin) {
      inboxQuery = inboxQuery.eq("agent_id", agent.id);
      sentQuery = sentQuery.eq("agent_id", agent.id);
      unreadQuery = unreadQuery.eq("agent_id", agent.id);
      latestInboxQuery = latestInboxQuery.eq("agent_id", agent.id);
      latestSentQuery = latestSentQuery.eq("agent_id", agent.id);
    }

    const [
      inbox,
      sent,
      unread,
      latestInbox,
      latestSent,
    ] = await Promise.all([
      inboxQuery,
      sentQuery,
      unreadQuery,
      latestInboxQuery,
      latestSentQuery,
    ]);

    const { count: agentCount } = await supabaseAdmin
      .from("agents")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      stats: {
        inbox: inbox.count || 0,
        unread: unread.count || 0,
        sent: sent.count || 0,
        agents: agentCount || 0,
      },
      latestInbox: latestInbox.data || [],
      latestSent: latestSent.data || [],
      agent,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Unable to load dashboard." },
      { status: 500 }
    );
  }
}