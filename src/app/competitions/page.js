"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";
import { useRouter } from "next/navigation";

export default function CompetitionPage() {
  const router = useRouter();

  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetitions();
  }, []);

  async function loadCompetitions() {
    setLoading(true);

    const { data, error } = await supabase
      .from("competitions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log("COMPETITION ERROR:", error);
      setCompetitions([]);
    } else {
      setCompetitions(data || []);
    }

    setLoading(false);
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">🏆 Competitions</h1>
          <p className="text-slate-500 text-sm">
            Test your knowledge and compete with others
          </p>
        </div>

        {/* CONTENT */}
        {loading ? (
          <p className="text-slate-500">Loading competitions...</p>
        ) : (
          <div className="space-y-4">

            {competitions.length === 0 ? (
              <div className="bg-white border rounded-xl p-4">
                <p className="text-slate-500">
                  No competitions available yet.
                </p>
              </div>
            ) : (
              competitions.map((c) => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/competition/${c.id}`)}
                  className="bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition"
                >

                  <h2 className="font-semibold text-lg">
                    {c.title || "Untitled Competition"}
                  </h2>

                  <p className="text-slate-500 text-sm mt-1">
                    {c.description || "No description provided"}
                  </p>

                  <div className="flex justify-between mt-3 text-xs text-slate-500">
                    <span>
                      📅 {c.status || "Upcoming"}
                    </span>

                    <span className="text-indigo-500 font-medium">
                      Open →
                    </span>
                  </div>

                </div>
              ))
            )}

          </div>
        )}

      </div>
    </AppLayout>
  );
}