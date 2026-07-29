"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  // --------------------
  // FORM STATE
  // --------------------
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");
  const [province, setProvince] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --------------------
  // UI STATE
  // --------------------
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // --------------------
  // REGISTER
  // --------------------
  async function handleRegister(e) {
    e.preventDefault();

    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      // 1. Create user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      const user = data?.user;

      if (!user) {
        throw new Error(
          "Account created but not confirmed yet. Please check your email."
        );
      }

      // 2. Create / update profile safely
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          grade,
          school,
          province,
          email,
        });

      if (profileError) throw profileError;

      // 3. Check session state (email confirmed or not)
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData?.session) {
        setMessage(
          "Account created! Please check your email to confirm your account."
        );
      } else {
        setMessage("Account created successfully!");

        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }

    } catch (err) {
      setMessage(err.message || "Something went wrong");
    }

    setLoading(false);
  }

  // --------------------
  // UI
  // --------------------
  return (
    <main className="h-screen grid grid-cols-12 overflow-hidden">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex col-span-4 flex-col justify-center px-10 bg-gradient-to-br from-purple-700 via-indigo-600 to-cyan-500 text-white">

        <h1 className="text-4xl font-extrabold leading-tight">
          Master Grade 12 Mathematics
        </h1>

        <p className="mt-4 text-sm text-purple-100">
          Join EL-Tech Academy for structured lessons, exam prep,
          and guided practice designed for real results.
        </p>

        <div className="mt-8 bg-white/20 backdrop-blur-md p-4 rounded-xl">
          <p className="italic text-sm">
            “Consistency beats motivation.”
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="col-span-12 lg:col-span-8 flex items-center justify-center bg-white px-4">

        <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-5">

          <h2 className="text-3xl font-bold text-gray-900">
            Create Account
          </h2>

          <p className="text-sm text-gray-500 mb-3">
            Start your Grade 12 journey
          </p>

          <form onSubmit={handleRegister} className="space-y-2">

            {/* GRID INPUTS */}
            <div className="grid grid-cols-2 gap-2">

              <input
                type="text"
                placeholder="First Name"
                className="border rounded-lg p-2 text-sm w-full"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />

              <input
                type="text"
                placeholder="Last Name"
                className="border rounded-lg p-2 text-sm w-full"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />

              <input
                type="text"
                placeholder="Grade"
                className="border rounded-lg p-2 text-sm w-full"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                required
              />

              <input
                type="text"
                placeholder="Province"
                className="border rounded-lg p-2 text-sm w-full"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                required
              />
            </div>

            {/* FULL WIDTH INPUTS */}
            <input
              type="text"
              placeholder="School Name"
              className="w-full border rounded-lg p-2 text-sm"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              required
            />

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

            {/* PRICE CARD */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-600">Monthly Plan</p>
              <p className="text-2xl font-bold text-purple-700"></p>
              <p className="text-xs text-gray-500">
                Full Access
              </p>
            </div>

            {/* BUTTON */}
            <button
              disabled={loading}
              className="w-full py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Continue"}
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
