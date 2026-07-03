import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user?.email) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  const { data: agent, error: agentError } = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("auth_email", user.email)
    .single();

  if (agentError || !agent) {
    return NextResponse.json(
      { error: "No agent profile found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ user, agent });
}