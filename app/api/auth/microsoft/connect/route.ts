import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  createMicrosoftClient,
  getMicrosoftConfiguration,
  MICROSOFT_SCOPES,
} from "@/lib/microsoft/config";
import { createMicrosoftState } from "@/lib/microsoft/state";

export const runtime = "nodejs";

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

export async function POST(request: Request) {
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
        .select("id, user_id, auth_email, company_email, is_active, suspended")
        .or(
          `user_id.eq.${user.id},auth_email.eq.${user.email ?? ""}`
        )
        .maybeSingle();

    if (agentError) {
      console.error(
        "Microsoft connection agent lookup failed:",
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

    if (agent.is_active === false || agent.suspended === true) {
      return NextResponse.json(
        { error: "This agent account is not active." },
        { status: 403 }
      );
    }

    const state = createMicrosoftState(agent.id, user.id);
    const microsoftClient = createMicrosoftClient();
    const { redirectUri } = getMicrosoftConfiguration();

    const authorizationUrl =
      await microsoftClient.getAuthCodeUrl({
        scopes: MICROSOFT_SCOPES,
        redirectUri,
        state,
        responseMode: "query",
        prompt: "select_account",
        loginHint:
          agent.company_email ||
          agent.auth_email ||
          user.email ||
          undefined,
      });

    return NextResponse.json({
      authorizationUrl,
    });
  } catch (error) {
    console.error(
      "Unable to start Microsoft connection:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start Microsoft connection.",
      },
      { status: 500 }
    );
  }
}