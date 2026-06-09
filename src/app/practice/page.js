"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import AppLayout from "@/app/AppLayout";

export default function PracticePage() {
  const router = useRouter();

  const [subjects, setSubjects] = useState([]);
  const [topicsBySubject, setTopicsBySubject] = useState({});
  const [quizzesByTopic, setQuizzesByTopic] = useState({});

  const [openSubject, setOpenSubject] = useState(null);
  const [openTopics, setOpenTopics] = useState({});

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    const { data } = await supabase
      .from("subjects")
      .select("*")
      .order("name");

    setSubjects(data || []);
  }

  async function loadTopics(subjectId) {
    const { data } = await supabase
      .from("topics")
      .select("*")
      .eq("subject_id", subjectId)
      .order("name");

    return data || [];
  }

  async function loadQuizzes(topicId) {
    const { data } = await supabase
      .from("quizzes")
      .select("*")
      .eq("topic_id", topicId)
      .order("created_at", { ascending: false });

    return data || [];
  }

  async function toggleSubject(subjectId) {
    const isOpen = openSubject === subjectId;

    setOpenSubject(isOpen ? null : subjectId);

    if (!isOpen && !topicsBySubject[subjectId]) {
      const topics = await loadTopics(subjectId);

      setTopicsBySubject((prev) => ({
        ...prev,
        [subjectId]: topics,
      }));
    }
  }

  async function toggleTopic(topicId) {
    const isOpen = !openTopics[topicId];

    setOpenTopics((prev) => ({
      ...prev,
      [topicId]: isOpen,
    }));

    if (!isOpen) return;

    if (!quizzesByTopic[topicId]) {
      const quizzes = await loadQuizzes(topicId);

      setQuizzesByTopic((prev) => ({
        ...prev,
        [topicId]: quizzes,
      }));
    }
  }

  function startQuiz(quizId) {
    router.push(`/quiz/${quizId}`);
  }

  return (
    <AppLayout>
      <div className="flex justify-center">
        <div className="w-full max-w-4xl px-4 py-6">

          {/* HEADER */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-800">
              🧠 Practice Assessments
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Choose a quiz and start practicing
            </p>
          </div>

          {/* SUBJECTS */}
          <div className="space-y-3">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm"
              >

                {/* SUBJECT HEADER */}
                <button
                  onClick={() => toggleSubject(subject.id)}
                  className="w-full flex justify-between items-center px-4 py-3 hover:bg-slate-50 transition"
                >
                  <span className="font-medium text-slate-700 text-sm">
                    📚 {subject.name}
                  </span>
                  <span className="text-slate-400 text-sm">
                    {openSubject === subject.id ? "▲" : "▼"}
                  </span>
                </button>

                {/* TOPICS */}
                {openSubject === subject.id && (
                  <div className="bg-slate-50 border-t border-slate-200 px-3 py-3 space-y-2">

                    {(topicsBySubject[subject.id] || []).map((topic) => (
                      <div
                        key={topic.id}
                        className="bg-white border border-slate-200 rounded-lg"
                      >

                        {/* TOPIC HEADER */}
                        <button
                          onClick={() => toggleTopic(topic.id)}
                          className="w-full flex justify-between items-center px-3 py-2 hover:bg-slate-50"
                        >
                          <span className="text-sm text-slate-700">
                            📂 {topic.name}
                          </span>
                          <span className="text-slate-400 text-sm">
                            {openTopics[topic.id] ? "▲" : "▼"}
                          </span>
                        </button>

                        {/* QUIZZES */}
                        {openTopics[topic.id] && (
                          <div className="border-t border-slate-100 bg-slate-50 px-2 py-2 space-y-2">

                            {(quizzesByTopic[topic.id] || []).map((quiz) => (
                              <div
                                key={quiz.id}
                                className="flex justify-between items-center bg-white border border-slate-200 rounded-md px-3 py-2"
                              >
                                <div className="flex flex-col">
                                  <p className="text-sm text-slate-800 font-medium">
                                    🧪 {quiz.title}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Pass mark: {quiz.pass_mark}%
                                  </p>
                                </div>

                                <button
                                  onClick={() => startQuiz(quiz.id)}
                                  className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                  Start
                                </button>
                              </div>
                            ))}

                            {(quizzesByTopic[topic.id] || []).length === 0 && (
                              <p className="text-xs text-slate-400 px-2">
                                No quizzes available
                              </p>
                            )}

                          </div>
                        )}

                      </div>
                    ))}

                  </div>
                )}

              </div>
            ))}
          </div>

        </div>
      </div>
    </AppLayout>
  );
}