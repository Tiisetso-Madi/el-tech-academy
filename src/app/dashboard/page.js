"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    quizzesTaken: 0,
    avgScore: 0,
    answersCount: 0,
    votes: 0,
    streak: 0,
  });

  // ----------------------------
  // LOAD DASHBOARD DATA
  // ----------------------------
  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    // ---------------- USER ----------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUser(user);

    // ---------------- PROFILE ----------------
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

    // ---------------- QUIZ ATTEMPTS ----------------
    const { data: quizzes, error: quizError } = await supabase
      .from("quiz_attempts")
      .select("score, percentage, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    if (quizError) console.log("QUIZ ERROR:", quizError);

    const quizzesTaken = quizzes?.length || 0;

    const avgScore =
      quizzesTaken > 0
        ? Math.round(
            quizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) /
              quizzesTaken
          )
        : 0;

    // ---------------- COMMUNITY ANSWERS ----------------
    const { data: answers } = await supabase
      .from("community_answers")
      .select("id")
      .eq("user_id", user.id);

    const answersCount = answers?.length || 0;

    // ---------------- VOTES RECEIVED ----------------
    const { data: votes } = await supabase
      .from("community_answer_votes")
      .select("vote, answer_id, community_answers(user_id)");

    let totalVotes = 0;

    (votes || []).forEach((v) => {
      if (v.community_answers?.user_id === user.id) {
        totalVotes += v.vote || 0;
      }
    });

    // ---------------- REAL CURRENT STREAK ----------------
    function calculateCurrentStreak(attempts) {
      if (!attempts || attempts.length === 0) return 0;

      // get unique sorted days (latest first)
      const days = [
        ...new Set(
          attempts.map((a) =>
            new Date(a.completed_at).toISOString().split("T")[0]
          )
        ),
      ].sort((a, b) => new Date(b) - new Date(a)); // DESC

      let streak = 0;
      let today = new Date();

      // normalize today to date string
      let expectedDate = new Date(today);
      expectedDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < days.length; i++) {
        const current = new Date(days[i]);
        current.setHours(0, 0, 0, 0);

        if (i === 0) {
          // first entry must be today OR yesterday to start streak
          const diff =
            (expectedDate - current) / (1000 * 60 * 60 * 24);

          if (diff === 0 || diff === 1) {
            streak = 1;
            expectedDate = new Date(current);
          } else {
            return 0;
          }
        } else {
          const nextExpected = new Date(expectedDate);
          nextExpected.setDate(nextExpected.getDate() - 1);

          if (current.getTime() === nextExpected.getTime()) {
            streak++;
            expectedDate = current;
          } else {
            break;
          }
        }
      }

      return streak;
    }

    const streak = calculateCurrentStreak(quizzes);

    // ---------------- SET STATS ----------------
    setStats({
      quizzesTaken,
      avgScore,
      answersCount,
      votes: totalVotes,
      streak,
    });

    setLoading(false);
  }

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 text-gray-500">Loading dashboard...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Welcome back, {profile?.first_name || "Student"} 👋
          </h1>
          <p className="text-gray-500">
            Let’s continue your learning journey
          </p>
        </div>

        {/* STATS GRID */}
        <div className="grid md:grid-cols-4 gap-5">

          <StatCard
            title="Quizzes Taken"
            value={stats.quizzesTaken}
          />

          <StatCard
            title="Average Score"
            value={`${stats.avgScore}%`}
          />

          <StatCard
            title="Answers Given"
            value={stats.answersCount}
          />

          <StatCard
            title="Streak"
            value={`🔥 ${stats.streak} days`}
          />

        </div>

        {/* PERFORMANCE SECTION */}
        <div className="mt-8 bg-white border rounded-xl p-6 shadow-sm">

          <h2 className="font-bold text-lg mb-2">
            Your Performance
          </h2>

          <p className="text-gray-600">
            You are actively engaging with the platform. Keep going!
          </p>

          <div className="mt-4 text-sm text-gray-500">
            Total votes received: {stats.votes}
          </div>

        </div>

      </div>
    </AppLayout>
  );
}

// ---------------- STAT CARD ----------------
function StatCard({ title, value }) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p className="text-2xl font-bold mt-2 text-slate-800">
        {value}
      </p>
    </div>
  );
}