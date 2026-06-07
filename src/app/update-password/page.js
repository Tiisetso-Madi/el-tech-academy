"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpdate(e) {
    e.preventDefault();

    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMessage("Password updated successfully!");

      setTimeout(() => {
        router.push("/login");
      }, 1200);

    } catch (err) {
      setMessage(err.message || "Failed to update password");
    }

    setLoading(false);
  }

  return (
    <main className="h-screen flex items-center justify-center bg-gray-50">

      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6">

        <h1 className="text-3xl font-bold text-gray-900">
          Set New Password
        </h1>

        <p className="text-sm text-gray-500 mb-4">
          Enter your new password below
        </p>

        <form onSubmit={handleUpdate} className="space-y-3">

          <input
            type="password"
            placeholder="New Password"
            className="w-full border rounded-lg p-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            disabled={loading}
            className="w-full py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500"
          >
            {loading ? "Updating..." : "Update Password"}
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
    </main>
  );
}