"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";
export default function SubjectPage() {
  const { subjectId } = useParams();
  const router = useRouter();

  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subjectId) {
      loadData();
    }
  }, [subjectId]);

  async function loadData() {
    setLoading(true);

    // Subject
    const { data: subjectData } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .single();

    setSubject(subjectData);

    // Topics + Chapters (NESTED QUERY)
    const { data: topicsData } = await supabase
      .from("topics")
      .select(`
        *,
        chapters (*)
      `)
      .eq("subject_id", subjectId)
      .order("display_order");

    setTopics(topicsData || []);

    setLoading(false);
  }

  if (loading) {
    <AppLayout>
    return (
      <div className="p-8">
        <p>Loading...</p>
      </div>
    );

    </AppLayout>
  }

  return (
    <AppLayout>
    <div className="p-8 min-h-screen bg-slate-100">

      <button
        onClick={() => router.push("/subjects")}
        className="mb-6 text-purple-600 font-semibold hover:text-purple-800"
      >
        ← Back to Subjects
      </button>

      <h1 className="text-4xl font-bold mb-2">
        {subject?.name}
      </h1>

      <p className="text-gray-500 mb-8">
        Select a topic to continue learning
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition"
          >
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
              Topic {topic.display_order}
            </span>

            <h2 className="text-xl font-bold mt-3">
              {topic.name}
            </h2>

            <p className="text-gray-500 mt-3">
              Chapters:
            </p>

            <div className="space-y-2 mt-3">
              {topic.chapters?.map((chapter) => (
                <div
                  key={chapter.id}
                  onClick={() =>
                    router.push(`/chapters/${chapter.id}`)
                  }
                  className="cursor-pointer p-3 rounded-lg border hover:bg-purple-50 hover:border-purple-400"
                >
                  📖 {chapter.name}
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>
    </div>
    </AppLayout>
  );
}