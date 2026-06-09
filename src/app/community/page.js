"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";
import { useRouter } from "next/navigation";

export default function CommunityPage() {
  const [grades, setGrades] = useState([]);
  const router = useRouter();

  useEffect(() => {
    loadGrades();
  }, []);

  async function loadGrades() {
    const { data } = await supabase
      .from("community_grades")
      .select("*")
      .order("name");

    setGrades(data || []);
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6">

        <h1 className="text-3xl font-bold">
          💬 Community
        </h1>

        <p className="text-slate-500 mb-6">
          Choose your grade to start asking questions
        </p>

        <div className="grid md:grid-cols-2 gap-4">

          {grades.map((g) => (
            <div
              key={g.id}
              onClick={() => router.push(`/community/grade/${g.id}`)}
              className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md cursor-pointer transition"
            >
              <h2 className="text-xl font-bold">
                {g.name}
              </h2>

              <p className="text-slate-500 text-sm mt-1">
                Open discussion space
              </p>
            </div>
          ))}

        </div>

      </div>
    </AppLayout>
  );
}