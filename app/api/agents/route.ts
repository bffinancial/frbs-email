import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendWelcomeEmail } from "@/lib/mail/sendWelcomeEmail";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.frbsmail.com";

function cleanName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z]/g, "");
}

function createCompanyEmail(firstName: string, lastName: string) {
  return `${cleanName(firstName)}.${cleanName(lastName)}@frbsmail.com`;
}

function createTempPassword() {
  return `FRBS-${crypto.randomUUID()}-Temp!`;
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ agents: data || [] });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const forwardingEmail = body.forwardingEmail?.trim().toLowerCase();
    const phone = body.phone?.trim() || null;
    const role = body.role?.trim() || "Agent";

    if (!firstName || !lastName || !forwardingEmail) {
      return NextResponse.json(
        { error: "First name, last name, and forwarding email are required." },
        { status: 400 }
      );
    }

    const fullName = `${firstName} ${lastName}`;
    const companyEmail = createCompanyEmail(firstName, lastName);

    const { data: existingAgent } = await supabaseAdmin
      .from("agents")
      .select("id")
      .or(`forwarding_email.eq.${forwardingEmail},company_email.eq.${companyEmail}`)
      .maybeSingle();

    if (existingAgent) {
      return NextResponse.json(
        { error: "An agent already exists with this forwarding email or FRBS email." },
        { status: 409 }
      );
    }

    const { data: createdUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email: forwardingEmail,
        password: createTempPassword(),
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          frbs_email: companyEmail,
          role,
        },
      });

    if (createUserError || !createdUser.user) {
      return NextResponse.json(
        { error: createUserError?.message || "Unable to create login account." },
        { status: 500 }
      );
    }

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: forwardingEmail,
        options: {
          redirectTo: `${SITE_URL}/create-password`,
        },
      });

    if (linkError || !linkData?.properties?.action_link) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);

      return NextResponse.json(
        { error: linkError?.message || "Unable to create password setup link." },
        { status: 500 }
      );
    }

    const inviteLink = linkData.properties.action_link;

    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .insert({
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        forwarding_email: forwardingEmail,
        company_email: companyEmail,
        auth_email: forwardingEmail,
        user_id: createdUser.user.id,
        phone,
        role,
        signature_title: role,
        status: "active",
        is_active: true,
        invite_status: "sent",
        invite_sent_at: new Date().toISOString(),
        suspended: false,
      })
      .select()
      .single();

    if (agentError || !agent) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);

      return NextResponse.json(
        { error: agentError?.message || "Unable to create agent profile." },
        { status: 500 }
      );
    }

    const welcomeResult = await sendWelcomeEmail({
      to: forwardingEmail,
      fullName,
      companyEmail,
      role,
      inviteLink,
    });

    if ("error" in welcomeResult && welcomeResult.error) {
      await supabaseAdmin
        .from("agents")
        .update({
          invite_status: "email_failed",
        })
        .eq("id", agent.id);

      return NextResponse.json(
        {
          error: `Agent was created, but the welcome email failed: ${welcomeResult.error.message}`,
          agent,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        agent,
        message: `Agent created. Welcome email sent to ${forwardingEmail}.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE AGENT ERROR:", error);
    return NextResponse.json({ error: "Failed to create agent." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { agentId } = await req.json();

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required." }, { status: 400 });
    }

    const { data: agent, error: findError } = await supabaseAdmin
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (findError || !agent) {
      return NextResponse.json({ error: "Agent not found." }, { status: 404 });
    }

    if (agent.user_id) {
      const { error: authDeleteError } =
        await supabaseAdmin.auth.admin.deleteUser(agent.user_id);

      if (authDeleteError) {
        return NextResponse.json(
          { error: authDeleteError.message },
          { status: 500 }
        );
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from("agents")
      .delete()
      .eq("id", agentId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Agent and login account permanently deleted.",
    });
  } catch (error) {
    console.error("DELETE AGENT ERROR:", error);
    return NextResponse.json({ error: "Failed to delete agent." }, { status: 500 });
  }
}