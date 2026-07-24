import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  createMicrosoftClient,
  getMicrosoftConfiguration,
  MICROSOFT_SCOPES,
} from "@/lib/microsoft/config";
import { verifyMicrosoftState } from "@/lib/microsoft/state";
import { encryptMicrosoftTokenCache } from "@/lib/microsoft/tokenEncryption";

export const runtime = "nodejs";

type MicrosoftProfile = {
  id: string;
  displayName?: string | null;
  mail?: string | null;
  userPrincipalName?: string | null;
};

function createSettingsRedirect(
  appUrl: string,
  status: string,
  message?: string
): NextResponse {
  const redirectUrl = new URL("/settings", appUrl);

  redirectUrl.searchParams.set("microsoft", status);

  if (message) {
    redirectUrl.searchParams.set("message", message);
  }

  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: Request) {
  const { appUrl, redirectUri, tenantId } =
    getMicrosoftConfiguration();

  try {
    const url = new URL(request.url);

    const microsoftError =
      url.searchParams.get("error");

    const microsoftErrorDescription =
      url.searchParams.get("error_description");

    if (microsoftError) {
      console.error(
        "Microsoft authorization returned an error:",
        microsoftError,
        microsoftErrorDescription
      );

      return createSettingsRedirect(
        appUrl,
        "error",
        "Microsoft authorization was cancelled or denied."
      );
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      return createSettingsRedirect(
        appUrl,
        "error",
        "Microsoft did not return the required authorization information."
      );
    }

    const statePayload = verifyMicrosoftState(state);

    const {
      data: { user: authUser },
      error: authUserError,
    } = await supabaseAdmin.auth.admin.getUserById(
      statePayload.userId
    );

    if (authUserError || !authUser) {
      return createSettingsRedirect(
        appUrl,
        "error",
        "The FRBS Mail user account could not be verified."
      );
    }

    const { data: agent, error: agentError } =
      await supabaseAdmin
        .from("agents")
        .select(
          "id, user_id, auth_email, company_email, is_active, suspended"
        )
        .eq("id", statePayload.agentId)
        .maybeSingle();

    if (agentError || !agent) {
      return createSettingsRedirect(
        appUrl,
        "error",
        "The FRBS Mail agent profile could not be verified."
      );
    }

    const agentMatchesUser =
      agent.user_id === statePayload.userId ||
      agent.auth_email?.toLowerCase() ===
        authUser.email?.toLowerCase();

    if (!agentMatchesUser) {
      return createSettingsRedirect(
        appUrl,
        "error",
        "This Microsoft connection does not match the signed-in agent."
      );
    }

    if (
      agent.is_active === false ||
      agent.suspended === true
    ) {
      return createSettingsRedirect(
        appUrl,
        "error",
        "This FRBS Mail agent account is not active."
      );
    }

    const microsoftClient = createMicrosoftClient();

    const tokenResult =
      await microsoftClient.acquireTokenByCode({
        code,
        scopes: MICROSOFT_SCOPES,
        redirectUri,
      });

    if (!tokenResult?.accessToken || !tokenResult.account) {
      throw new Error(
        "Microsoft did not return a usable account token."
      );
    }

    const profileResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName",
      {
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!profileResponse.ok) {
      const profileError = await profileResponse.text();

      console.error(
        "Microsoft Graph profile request failed:",
        profileResponse.status,
        profileError
      );

      throw new Error(
        "Unable to read the connected Microsoft profile."
      );
    }

    const profile =
      (await profileResponse.json()) as MicrosoftProfile;

    const serializedTokenCache =
      microsoftClient.getTokenCache().serialize();

    const encryptedTokenCache =
      encryptMicrosoftTokenCache(serializedTokenCache);

    const email =
      profile.mail ||
      profile.userPrincipalName ||
      tokenResult.account.username ||
      null;

    const { error: connectionError } =
      await supabaseAdmin
        .from("microsoft_connections")
        .upsert(
          {
            agent_id: agent.id,
            microsoft_user_id:
              profile.id ||
              tokenResult.account.localAccountId,
            tenant_id:
              tokenResult.account.tenantId || tenantId,
            home_account_id:
              tokenResult.account.homeAccountId,
            token_cache: encryptedTokenCache,
            access_token: null,
            refresh_token: null,
            expires_at:
              tokenResult.expiresOn?.toISOString() || null,
            email,
            display_name:
              profile.displayName ||
              tokenResult.account.name ||
              null,
            connected_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "agent_id",
          }
        );

    if (connectionError) {
      console.error(
        "Unable to save Microsoft connection:",
        connectionError
      );

      throw new Error(
        "The Microsoft account was authorized, but FRBS Mail could not save the connection."
      );
    }

    return createSettingsRedirect(
      appUrl,
      "connected"
    );
  } catch (error) {
    console.error(
      "Microsoft authorization callback failed:",
      error
    );

    return createSettingsRedirect(
      appUrl,
      "error",
      error instanceof Error
        ? error.message
        : "Unable to connect Microsoft 365."
    );
  }
}