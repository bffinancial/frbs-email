"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function CreatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("Verifying secure password link...");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifySession() {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        setStatus("This password link is invalid or expired. Please ask your administrator to resend your invite.");
        setLoading(false);
        return;
      }

      setReady(true);
      setStatus("Create your password to activate your FORWARD Mail account.");
      setLoading(false);
    }

    verifySession();
  }, []);

  async function createPassword() {
    if (password.length < 8) {
      setStatus("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    setSaving(true);
    setStatus("Creating password...");

    const { error } = await supabaseClient.auth.updateUser({
      password,
    });

    if (error) {
      setStatus(error.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setStatus("Password created. Redirecting to dashboard...");

    setTimeout(() => {
      router.push("/dashboard");
    }, 1200);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f3ef] px-4 py-10 text-[#4b0008]">
      <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-[#4b0008]/10 bg-white shadow-2xl">
        <div className="bg-[#4b0008] px-8 py-8 text-center text-white">
          <Image
            src="/frbs-logo.png"
            alt="FORWARD Mail"
            width={220}
            height={90}
            priority
            className="mx-auto h-auto w-[220px]"
          />

          <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-[#f4d7d9]">
            FORWARD Mail
          </p>

          <h1 className="mt-3 text-3xl font-black">Create Your Password</h1>

          <p className="mt-3 text-sm text-[#f4d7d9]">
            Secure account activation powered by FRBS.
          </p>
        </div>

        <div className="p-8">
          <div
            className={`mb-6 rounded-2xl border p-4 text-sm font-bold ${
              success
                ? "border-green-200 bg-green-50 text-green-800"
                : ready
                  ? "border-[#4b0008]/10 bg-[#fbfaf8] text-[#6f2b31]"
                  : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {loading || saving ? (
                <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />
              ) : success ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              )}
              <span>{status}</span>
            </div>
          </div>

          {ready && !success && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-2xl border border-[#4b0008]/15 bg-[#fbfaf8] px-4 py-3 font-semibold outline-none focus:border-[#7a1118]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full rounded-2xl border border-[#4b0008]/15 bg-[#fbfaf8] px-4 py-3 font-semibold outline-none focus:border-[#7a1118]"
                />
              </div>

              <button
                onClick={createPassword}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4b0008] px-5 py-3 font-black text-white transition hover:bg-[#6b1018] disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Lock className="h-5 w-5" />
                )}
                {saving ? "Creating..." : "Create Password & Continue"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}