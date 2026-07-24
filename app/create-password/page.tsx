"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
} from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function CreatePasswordPage() {
  const router = useRouter();
  const verificationStarted = useRef(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [status, setStatus] = useState(
    "Verifying secure password link..."
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    let mounted = true;

    async function verifyPasswordLink() {
      try {
        const currentUrl = new URL(window.location.href);
        const code = currentUrl.searchParams.get("code");
        const errorDescription =
          currentUrl.searchParams.get("error_description");

        if (errorDescription) {
          throw new Error(
            decodeURIComponent(
              errorDescription.replace(/\+/g, " ")
            )
          );
        }

        if (code) {
          setStatus("Activating secure password session...");

          const { error: exchangeError } =
            await supabaseClient.auth.exchangeCodeForSession(
              code
            );

          if (exchangeError) {
            throw exchangeError;
          }

          currentUrl.searchParams.delete("code");
          currentUrl.searchParams.delete("type");
          currentUrl.searchParams.delete("token");

          window.history.replaceState(
            {},
            document.title,
            `${currentUrl.pathname}${currentUrl.search}`
          );
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabaseClient.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error(
            "This password link is invalid, expired, or has already been used. Please ask your administrator to resend the invitation."
          );
        }

        if (!mounted) {
          return;
        }

        setReady(true);
        setStatus(
          "Create your password to activate your FORWARD Mail account."
        );
      } catch (error) {
        if (!mounted) {
          return;
        }

        console.error(
          "CREATE PASSWORD VERIFICATION ERROR:",
          error
        );

        setReady(false);
        setStatus(
          error instanceof Error
            ? error.message
            : "This password link is invalid or expired. Please ask your administrator to resend your invitation."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void verifyPasswordLink();

    return () => {
      mounted = false;
    };
  }, []);

  async function createPassword() {
    if (saving) {
      return;
    }

    if (password.length < 8) {
      setStatus(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    setSaving(true);
    setStatus("Creating password...");

    try {
      const { error } =
        await supabaseClient.auth.updateUser({
          password,
        });

      if (error) {
        throw error;
      }

      setSuccess(true);
      setReady(false);
      setStatus(
        "Password created successfully. Redirecting to your dashboard..."
      );

      window.setTimeout(() => {
        router.replace("/dashboard");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error(
        "CREATE PASSWORD UPDATE ERROR:",
        error
      );

      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to create your password."
      );
    } finally {
      setSaving(false);
    }
  }

  function goToLogin() {
    router.replace("/login");
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

          <h1 className="mt-3 text-3xl font-black">
            Create Your Password
          </h1>

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
                  : loading
                    ? "border-[#4b0008]/10 bg-[#fbfaf8] text-[#6f2b31]"
                    : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {loading || saving ? (
                <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />
              ) : success ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              ) : ready ? (
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
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  disabled={saving}
                  className="w-full rounded-2xl border border-[#4b0008]/15 bg-[#fbfaf8] px-4 py-3 font-semibold outline-none focus:border-[#7a1118] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black">
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void createPassword();
                    }
                  }}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  disabled={saving}
                  className="w-full rounded-2xl border border-[#4b0008]/15 bg-[#fbfaf8] px-4 py-3 font-semibold outline-none focus:border-[#7a1118] disabled:opacity-60"
                />
              </div>

              <button
                type="button"
                onClick={() => void createPassword()}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4b0008] px-5 py-3 font-black text-white transition hover:bg-[#6b1018] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Lock className="h-5 w-5" />
                )}

                {saving
                  ? "Creating..."
                  : "Create Password & Continue"}
              </button>
            </div>
          )}

          {!loading && !ready && !success && (
            <button
              type="button"
              onClick={goToLogin}
              className="w-full rounded-2xl border border-[#4b0008]/20 px-5 py-3 font-black text-[#4b0008] transition hover:bg-[#f5eee7]"
            >
              Return to Login
            </button>
          )}
        </div>
      </section>
    </main>
  );
}