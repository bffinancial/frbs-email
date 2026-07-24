import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendWelcomeEmail } from "@/lib/mail/sendWelcomeEmail";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://frbsmail.com";

const EMAIL_DOMAIN = "frbsmail.com";

function cleanEmailUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/@frbsmail\.com$/i, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "");
}

function isValidEmailUsername(value: string): boolean {
  if (value.length < 1 || value.length > 64) {
    return false;
  }

  if (!/^[a-z0-9]/.test(value)) {
    return false;
  }

  if (!/[a-z0-9]$/.test(value)) {
    return false;
  }

  if (/[._-]{2,}/.test(value)) {
    return false;
  }

  return /^[a-z0-9._-]+$/.test(value);
}

function createCompanyEmail(
  emailUsername: string
): string {
  return `${emailUsername}@${EMAIL_DOMAIN}`;
}

function isValidEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function createTempPassword(): string {
  return `FRBS-${crypto.randomUUID()}-Temp!`;
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("agents")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    agents: data || [],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const firstName =
      typeof body.firstName === "string"
        ? body.firstName.trim()
        : "";

    const lastName =
      typeof body.lastName === "string"
        ? body.lastName.trim()
        : "";

    const emailUsername = cleanEmailUsername(
      typeof body.emailUsername === "string"
        ? body.emailUsername
        : ""
    );

    const forwardingEmail =
      typeof body.forwardingEmail === "string"
        ? body.forwardingEmail.trim().toLowerCase()
        : "";

    const phone =
      typeof body.phone === "string" &&
      body.phone.trim()
        ? body.phone.trim()
        : null;

    const requestedRole =
      typeof body.role === "string"
        ? body.role.trim()
        : "Agent";

    const allowedRoles = [
      "Agent",
      "Manager",
      "Admin",
    ];

    const role = allowedRoles.includes(requestedRole)
      ? requestedRole
      : "Agent";

    if (
      !firstName ||
      !lastName ||
      !emailUsername ||
      !forwardingEmail
    ) {
      return NextResponse.json(
        {
          error:
            "First name, last name, FRBS email username, and personal forwarding email are required.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmailUsername(emailUsername)) {
      return NextResponse.json(
        {
          error:
            "The FRBS email username must use letters, numbers, periods, hyphens, or underscores and must begin and end with a letter or number.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmailAddress(forwardingEmail)) {
      return NextResponse.json(
        {
          error:
            "Enter a valid personal or forwarding email address.",
        },
        { status: 400 }
      );
    }

    const fullName = `${firstName} ${lastName}`;
    const companyEmail =
      createCompanyEmail(emailUsername);

    const {
      data: existingCompanyAgent,
      error: companyLookupError,
    } = await supabaseAdmin
      .from("agents")
      .select("id")
      .or(
        `company_email.eq.${companyEmail},auth_email.eq.${companyEmail}`
      )
      .limit(1)
      .maybeSingle();

    if (companyLookupError) {
      console.error(
        "COMPANY EMAIL LOOKUP ERROR:",
        companyLookupError
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify whether the FRBS email address is available.",
        },
        { status: 500 }
      );
    }

    if (existingCompanyAgent) {
      return NextResponse.json(
        {
          error: `${companyEmail} is already in use.`,
        },
        { status: 409 }
      );
    }

    const {
      data: existingForwardingAgent,
      error: forwardingLookupError,
    } = await supabaseAdmin
      .from("agents")
      .select("id")
      .eq("forwarding_email", forwardingEmail)
      .limit(1)
      .maybeSingle();

    if (forwardingLookupError) {
      console.error(
        "FORWARDING EMAIL LOOKUP ERROR:",
        forwardingLookupError
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify the personal forwarding email.",
        },
        { status: 500 }
      );
    }

    if (existingForwardingAgent) {
      return NextResponse.json(
        {
          error:
            "An agent already exists with this personal or forwarding email.",
        },
        { status: 409 }
      );
    }

    const {
      data: existingAuthUsers,
      error: authLookupError,
    } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (authLookupError) {
      console.error(
        "AUTH USER LOOKUP ERROR:",
        authLookupError
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify whether the login email is available.",
        },
        { status: 500 }
      );
    }

    const authEmailAlreadyExists =
      existingAuthUsers.users.some(
        (user) =>
          user.email?.toLowerCase() ===
          companyEmail.toLowerCase()
      );

    if (authEmailAlreadyExists) {
      return NextResponse.json(
        {
          error: `${companyEmail} already has a login account.`,
        },
        { status: 409 }
      );
    }

    const {
      data: createdUser,
      error: createUserError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email: companyEmail,
        password: createTempPassword(),
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          frbs_email: companyEmail,
          forwarding_email: forwardingEmail,
          role,
        },
      });

    if (createUserError || !createdUser.user) {
      return NextResponse.json(
        {
          error:
            createUserError?.message ||
            "Unable to create login account.",
        },
        { status: 500 }
      );
    }

    const {
      data: linkData,
      error: linkError,
    } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: companyEmail,
        options: {
          redirectTo: `${SITE_URL}/create-password`,
        },
      });

    if (
      linkError ||
      !linkData?.properties?.action_link
    ) {
      await supabaseAdmin.auth.admin.deleteUser(
        createdUser.user.id
      );

      return NextResponse.json(
        {
          error:
            linkError?.message ||
            "Unable to create password setup link.",
        },
        { status: 500 }
      );
    }

    const inviteLink =
      linkData.properties.action_link;

    const { data: agent, error: agentError } =
      await supabaseAdmin
        .from("agents")
        .insert({
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,

          company_email: companyEmail,
          auth_email: companyEmail,
          forwarding_email: forwardingEmail,

          user_id: createdUser.user.id,
          phone,
          role,
          signature_title: role,

          status: "active",
          is_active: true,
          invite_status: "sent",
          invite_sent_at:
            new Date().toISOString(),
          suspended: false,
        })
        .select()
        .single();

    if (agentError || !agent) {
      await supabaseAdmin.auth.admin.deleteUser(
        createdUser.user.id
      );

      return NextResponse.json(
        {
          error:
            agentError?.message ||
            "Unable to create agent profile.",
        },
        { status: 500 }
      );
    }

    const welcomeResult =
      await sendWelcomeEmail({
        to: forwardingEmail,
        fullName,
        companyEmail,
        role,
        inviteLink,
      });

    if (
      "error" in welcomeResult &&
      welcomeResult.error
    ) {
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
        message: `Agent created. Login is ${companyEmail}. Welcome email sent to ${forwardingEmail}.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE AGENT ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to create agent.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { agentId } = await req.json();

    if (!agentId) {
      return NextResponse.json(
        {
          error: "Agent ID is required.",
        },
        { status: 400 }
      );
    }

    const { data: agent, error: findError } =
      await supabaseAdmin
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single();

    if (findError || !agent) {
      return NextResponse.json(
        {
          error: "Agent not found.",
        },
        { status: 404 }
      );
    }

    if (agent.user_id) {
      const { error: authDeleteError } =
        await supabaseAdmin.auth.admin.deleteUser(
          agent.user_id
        );

      if (authDeleteError) {
        return NextResponse.json(
          {
            error: authDeleteError.message,
          },
          { status: 500 }
        );
      }
    }

    const { error: deleteError } =
      await supabaseAdmin
        .from("agents")
        .delete()
        .eq("id", agentId);

    if (deleteError) {
      return NextResponse.json(
        {
          error: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Agent and login account permanently deleted.",
    });
  } catch (error) {
    console.error("DELETE AGENT ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to delete agent.",
      },
      { status: 500 }
    );
  }
}