"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LessonPage({ params }) {
  const [lesson, setLesson] = useState(null);
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    loadLesson();
  }, []);

  async function loadLesson() {
    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", params.lessonId)
      .single();

    setLesson(data);

    const { data: quizData } = await supabase
      .from("quizzes")
      .select("*")
      .eq("lesson_id", params.lessonId)
      .single();

    setQuiz(quizData);
  }

  if (!lesson) return <div>Loading...</div>;

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">
        {lesson.title}
      </h1>

      <div className="bg-white p-6 rounded-xl shadow">
        {lesson.content}
      </div>

      {quiz && (
        <Link
          href={`/quiz/${quiz.id}`}
          className="inline-block mt-6 bg-purple-600 text-white px-6 py-3 rounded-xl"
        >
          Take Quiz
        </Link>
      )}
    </main>
  );
}