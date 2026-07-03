"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  ShieldCheck,
  Users,
  MailCheck,
} from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (session) {
        router.replace("/dashboard");
      }
    }

    checkSession();
  }, [router]);

  async function login() {
    if (!email || !password) {
      setStatus("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setStatus("");

    const { error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8]">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT SIDE */}

        <div className="flex flex-col justify-center bg-[#4b0008] px-16 py-12 text-white">

          <Image
            src="/forward-logo.png"
            alt="FORWARD Retirement & Benefit Services"
            width={380}
            height={120}
            priority
            className="mb-10 h-auto w-80"
          />

          <h1 className="text-5xl font-black">
            FORWARD Mail
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-white/90">
            The official communications platform for
            FORWARD Retirement & Benefit Services.
          </p>

          <div className="mt-12 space-y-6">

            <div className="flex items-center gap-4">
              <ShieldCheck className="h-8 w-8 text-orange-300" />

              <div>
                <p className="font-bold">
                  Secure Authentication
                </p>

                <p className="text-white/70">
                  Protected by Supabase Authentication.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <MailCheck className="h-8 w-8 text-orange-300" />

              <div>
                <p className="font-bold">
                  Professional Email
                </p>

                <p className="text-white/70">
                  Send using your @frbsmail.com identity.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-orange-300" />

              <div>
                <p className="font-bold">
                  Built for FORWARD Agents
                </p>

                <p className="text-white/70">
                  One workspace for every agent.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="flex items-center justify-center px-8">

          <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl">

            <h2 className="text-4xl font-black text-[#4b0008]">
              Welcome Back
            </h2>

            <p className="mt-3 text-[#6f2b31]">
              Sign in to continue to FORWARD Mail.
            </p>

            <div className="mt-8 space-y-5">

              <div className="flex items-center gap-3 rounded-xl border border-[#4b0008]/20 px-4 py-3">

                <Mail className="text-[#4b0008]" />

                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="w-full bg-white text-black placeholder:text-gray-400 outline-none"
                />

              </div>

              <div className="flex items-center gap-3 rounded-xl border border-[#4b0008]/20 px-4 py-3">

                <Lock className="text-[#4b0008]" />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  className="w-full bg-white text-black placeholder:text-gray-400 outline-none"
                />

              </div>

              <div className="flex items-center justify-between">

                <label className="flex items-center gap-2 text-sm">

                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={() =>
                      setRemember(!remember)
                    }
                  />

                  Remember Me

                </label>

                <button
                  className="text-sm font-semibold text-[#7a1118] hover:underline"
                >
                  Forgot Password?
                </button>

              </div>

              <button
                onClick={login}
                disabled={loading}
                className="w-full rounded-xl bg-[#4b0008] py-4 text-lg font-bold text-white transition hover:bg-[#68101a]"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>

              {status && (
                <div className="rounded-xl bg-red-50 p-3 text-center font-semibold text-red-700">
                  {status}
                </div>
              )}

            </div>

            <div className="mt-10 border-t pt-6 text-center text-sm text-gray-500">
              FORWARD Mail v1.0
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}