"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const [leaders, setLeaders] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserId(user.id);

    const { data: s } = await supabase.from("subjects").select("*");
    const { data: t } = await supabase.from("topics").select("*");

    setSubjects(s || []);
    setTopics(t || []);

    loadLeaderboard();
  }

  async function loadLeaderboard() {
    setLoading(true);

    const { data, error } = await supabase
      .from("quiz_attempts")
      .select(`
        user_id,
        percentage,
        quizzes (
          topics (
            id,
            name,
            subjects (
              id,
              name
            )
          )
        )
      `);

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    const grouped = {};

    (data || []).forEach((a) => {
      if (!grouped[a.user_id]) {
        grouped[a.user_id] = {
          user_id: a.user_id,
          total: 0,
          count: 0,
        };
      }

      grouped[a.user_id].total += Number(a.percentage || 0);
      grouped[a.user_id].count += 1;
    });

    const leaderboard = Object.values(grouped)
      .map((u) => ({
        ...u,
        avg: Math.round(u.total / u.count),
      }))
      .sort((a, b) => b.avg - a.avg)
      .map((u, i) => ({ ...u, rank: i + 1 }));

    setLeaders(leaderboard);
    setLoading(false);
  }

  const top10 = leaders.slice(0, 10);
  const userEntry = leaders.find((u) => u.user_id === userId);

  function LeaderboardTable({ title }) {
    return (
      <div className="mb-10">

        {/* TITLE */}
        <h2 className="text-xl font-bold text-slate-800 mb-3">
          {title}
        </h2>

        {/* TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

          <table className="w-full">

            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left">Rank</th>
                <th className="p-4 text-left">User</th>
                <th className="p-4 text-left">Average %</th>
                <th className="p-4 text-left">Attempts</th>
              </tr>
            </thead>

            <tbody>

              {/* TOP 10 */}
              {top10.map((u) => (
                <tr key={u.user_id} className="border-t hover:bg-slate-50">

                  <td className="p-4 font-bold">#{u.rank}</td>

                  <td className="p-4">
                    {u.user_id === userId ? "You" : u.user_id}
                  </td>

                  <td className="p-4 text-indigo-600 font-semibold">
                    {u.avg}%
                  </td>

                  <td className="p-4">{u.count}</td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

        {/* USER RANK (if not top 10) */}
        {userEntry && userEntry.rank > 10 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="font-medium text-slate-700">
              Your Rank: #{userEntry.rank} — {userEntry.avg}%
            </p>
          </div>
        )}

      </div>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">Loading leaderboard...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6">

        {/* HEADER */}
        <h1 className="text-3xl font-bold mb-8">
          🏆 Leaderboards
        </h1>

        {/* GLOBAL */}
        <LeaderboardTable title="🌍 Global Leaderboard" />

        {/* SUBJECT (same data now, ready for filter later) */}
        <LeaderboardTable title="📚 Subject Leaderboard" />

        {/* TOPIC */}
        <LeaderboardTable title="📖 Topic Leaderboard" />

      </div>
    </AppLayout>
  );
}