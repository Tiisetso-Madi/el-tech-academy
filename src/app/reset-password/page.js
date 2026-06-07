"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleReset(e) {
    e.preventDefault();

    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setMessage("Password reset email sent! Check your inbox.");

    } catch (err) {
      setMessage(err.message || "Error sending reset email");
    }

    setLoading(false);
  }

  return (
    <main className="h-screen grid grid-cols-12 overflow-hidden">

      {/* LEFT */}
      <div className="hidden lg:flex col-span-4 flex-col justify-center px-10 bg-gradient-to-br from-purple-700 via-indigo-600 to-cyan-500 text-white">

        <h1 className="text-4xl font-extrabold">
          Reset Your Password
        </h1>

        <p className="mt-4 text-sm text-purple-100">
          We’ll send you a secure link to create a new password.
        </p>

        <div className="mt-8 bg-white/20 p-4 rounded-xl backdrop-blur-md">
          <p className="italic text-sm">
            “Security first — always.”
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="col-span-12 lg:col-span-8 flex items-center justify-center bg-white px-4">

        <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-5">

          <h2 className="text-3xl font-bold text-gray-900">
            Forgot Password
          </h2>

          <p className="text-sm text-gray-500 mb-4">
            Enter your email to reset your password
          </p>

          <form onSubmit={handleReset} className="space-y-3">

            <input
              type="email"
              placeholder="Email"
              className="w-full border rounded-lg p-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button
              disabled={loading}
              className="w-full py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full py-2 rounded-lg text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-100"
            >
              Back to Login
            </button>

            {message && (
              <p className="text-center text-xs text-gray-600">
                {message}
              </p>
            )}

          </form>
        </div>
      </div>
    </main>
  );
}