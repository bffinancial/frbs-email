import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function getBearerToken(
  request: Request
): string | null {
  const authorization =
    request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return (
    authorization.slice("Bearer ".length).trim() ||
    null
  );
}

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    const { data: agent, error: agentError } =
      await supabaseAdmin
        .from("agents")
        .select("id")
        .or(
          `user_id.eq.${user.id},auth_email.eq.${user.email ?? ""}`
        )
        .maybeSingle();

    if (agentError) {
      console.error(
        "Microsoft status agent lookup failed:",
        agentError
      );

      return NextResponse.json(
        { error: "Unable to load the agent profile." },
        { status: 500 }
      );
    }

    if (!agent) {
      return NextResponse.json(
        { error: "No agent profile was found." },
        { status: 404 }
      );
    }

    const { data: connection, error: connectionError } =
      await supabaseAdmin
        .from("microsoft_connections")
        .select(
          "email, display_name, tenant_id, connected_at, updated_at, expires_at"
        )
        .eq("agent_id", agent.id)
        .maybeSingle();

    if (connectionError) {
      console.error(
        "Microsoft status lookup failed:",
        connectionError
      );

      return NextResponse.json(
        { error: "Unable to load Microsoft connection status." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      connected: Boolean(connection),
      connection: connection || null,
    });
  } catch (error) {
    console.error(
      "Microsoft status request failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Microsoft connection status.",
      },
      { status: 500 }
    );
  }
}