"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LessonsPage({ params }) {
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    loadLessons();
  }, []);

  async function loadLessons() {
    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("chapter_id", params.chapterId);

    setLessons(data || []);
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-8">
        Lessons
      </h1>

      <div className="space-y-4">
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            href={`/lesson/${lesson.id}`}
            className="block bg-white p-5 rounded-xl shadow"
          >
            {lesson.title}
          </Link>
        ))}
      </div>
    </main>
  );
}