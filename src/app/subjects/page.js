"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import AppLayout from "@/app/AppLayout";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const router = useRouter();

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    const { data } = await supabase
      .from("subjects")
      .select("*")
      .order("name");

    if (data) setSubjects(data);
  }

  return (
    <AppLayout>
    <div className="min-h-screen bg-slate-100 p-8">
      
      {/* HEADER */}
    {/* HEADER */}
<div className="mb-10 flex items-center justify-between">

  <div>
    <h1 className="text-4xl font-extrabold text-slate-800">
      📚 Subjects
    </h1>
    <p className="text-slate-500 mt-2">
      Choose a subject to continue learning
    </p>
  </div>

  {/* BACK BUTTON */}
 <button
  onClick={() => router.push("/dashboard")}
  className="
    px-4 py-2
    bg-white
    border border-slate-200
    rounded-lg
    shadow-sm
    hover:shadow-md
    hover:-translate-y-0.5
    transition
    text-slate-700
    font-medium
  "
>
  ← Back
</button>

</div>

      {/* GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject, index) => (
          <div
            key={subject.id}
            onClick={() => router.push(`/subjects/${subject.id}`)}
            className="
              group cursor-pointer
              bg-white
              rounded-2xl
              shadow-sm
              border border-slate-100
              p-6
              hover:shadow-xl
              hover:-translate-y-2
              transition-all duration-300
              relative
              overflow-hidden
            "
          >
            {/* TOP COLOR STRIP */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />

            {/* ICON CIRCLE */}
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold mb-4">
              {subject.name?.charAt(0)}
            </div>

            {/* TITLE */}
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-purple-600 transition">
              {subject.name}
            </h2>

            {/* SUBTEXT */}
            <p className="text-sm text-slate-500 mt-2">
              Start learning this subject
            </p>

            {/* ARROW */}
            <div className="mt-4 text-purple-500 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
              Open
              <span className="transition">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    </AppLayout>
  );
}