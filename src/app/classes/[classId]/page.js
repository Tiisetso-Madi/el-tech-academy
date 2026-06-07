"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function SubjectsPage({ params }) {
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    const { data } = await supabase
      .from("subjects")
      .select("*")
      .eq("class_id", params.classId);

    setSubjects(data || []);
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-8">
        Subjects
      </h1>

      <div className="grid md:grid-cols-3 gap-5">
        {subjects.map((subject) => (
          <Link
            key={subject.id}
            href={`/subjects/${subject.id}`}
            className="bg-white p-6 rounded-2xl shadow"
          >
            <h2 className="font-bold text-xl">
              {subject.name}
            </h2>
          </Link>
        ))}
      </div>
    </main>
  );
}