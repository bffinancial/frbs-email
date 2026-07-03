import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function getAgentFromRequest(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) return null;

  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);

  if (!user?.email) return null;

  const { data: agent } = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("auth_email", user.email)
    .single();

  return agent;
}

export async function GET(req: Request) {
  const agent = await getAgentFromRequest(req);

  if (!agent) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let query = supabaseAdmin
    .from("emails")
    .select("*")
    .eq("direction", "outbound")
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (agent.role !== "Admin") {
    query = query.eq("agent_id", agent.id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ emails: data || [] });
}