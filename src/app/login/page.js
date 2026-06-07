"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  // --------------------
  // FORM STATE
  // --------------------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --------------------
  // UI STATE
  // --------------------
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // --------------------
  // LOGIN HANDLER
  // --------------------
  async function handleLogin(e) {
    e.preventDefault();

    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.session) {
        setMessage("Login successful!");

        setTimeout(() => {
          router.push("/dashboard");
        }, 900);
      } else {
        setMessage("Invalid login or unverified account.");
      }

    } catch (err) {
      setMessage(err.message || "Login failed");
    }

    setLoading(false);
  }

  return (
    <main className="h-screen grid grid-cols-12 overflow-hidden">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex col-span-6 flex-col justify-center px-12 bg-gradient-to-br from-purple-700 via-indigo-600 to-cyan-500 text-white">

        <h1 className="text-5xl font-extrabold leading-tight">
          Welcome Back
        </h1>

        <p className="mt-4 text-sm text-purple-100 max-w-md">
          Continue your Grade 12 Mathematics journey with structured lessons,
          practice questions, and exam preparation.
        </p>

        <div className="mt-10 bg-white/20 backdrop-blur-md p-5 rounded-xl max-w-md">
          <p className="italic text-sm">
            “Small daily progress leads to big exam success.”
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="col-span-12 lg:col-span-6 flex items-center justify-center bg-white px-6">

        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6">

          {/* TOP BAR (FIXED PROPER FLEX) */}
          <div className="flex items-center justify-between mb-6">

            {/* BACK */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-900 text-xl"
              aria-label="Back Home"
            >
              ←
            </button>

          

          </div>

          {/* CENTER TITLE */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Login
            </h2>

            <p className="text-sm text-gray-500">
              Access your dashboard
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-3">

  <input
    type="email"
    placeholder="Email"
    className="w-full border rounded-lg p-2 text-sm"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
  />

  <input
    type="password"
    placeholder="Password"
    className="w-full border rounded-lg p-2 text-sm"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
  />

  {/* FORGOT PASSWORD (ABOVE BUTTON) */}
  <div className="flex justify-end">
    <button
      type="button"
      onClick={() => router.push("/reset-password")}
      className="text-xs text-purple-600 hover:underline"
    >
      Forgot password?
    </button>
  </div>

  {/* LOGIN BUTTON */}
  <button
    disabled={loading}
    className="w-full py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 disabled:opacity-60"
  >
    {loading ? "Logging in..." : "Login"}
  </button>

  {/* MESSAGE */}
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