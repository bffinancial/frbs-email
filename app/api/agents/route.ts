import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function cleanName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z]/g, "");
}

function createCompanyEmail(firstName: string, lastName: string) {
  return `${cleanName(firstName)}.${cleanName(lastName)}@frbsmail.com`;
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

    const inviteRedirectTo =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000/login";

    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(forwardingEmail, {
        redirectTo: inviteRedirectTo,
      });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("agents")
      .insert({
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        forwarding_email: forwardingEmail,
        company_email: companyEmail,
        auth_email: forwardingEmail,
        user_id: inviteData.user?.id || null,
        phone,
        role,
        signature_title: role,
        status: "active",
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(
      { agent: data, message: "Agent created and invite email sent." },
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