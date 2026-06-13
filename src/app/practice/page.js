"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import AppLayout from "@/app/AppLayout";

export default function PracticePage() {
  const router = useRouter();
const [loadingAssessmentId, setLoadingAssessmentId] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [topicsBySubject, setTopicsBySubject] = useState({});
  const [quizzesByTopic, setQuizzesByTopic] = useState({});
  const [assessmentsBySubject, setAssessmentsBySubject] = useState({});

  const [openSubject, setOpenSubject] = useState(null);
  const [openTopics, setOpenTopics] = useState({});

  useEffect(() => {
    loadSubjects();
  }, []);

  // ---------------- SUBJECTS ----------------
  async function loadSubjects() {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("name");

    if (error) console.log("Subjects error:", error);

    setSubjects(data || []);
  }

  // ---------------- ASSESSMENTS ----------------
async function loadAssessments(subjectId) {
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq('"Subject_Id"', subjectId) // ✅ FIXED

  console.log("ASSESSMENTS:", data, error);

  return data || [];
}

  // ---------------- TOPICS ----------------
  async function loadTopics(subjectId) {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .eq("subject_id", subjectId)
      .order("name");

    if (error) console.log("Topics error:", error);

    return data || [];
  }

  // ---------------- QUIZZES ----------------
  async function loadQuizzes(topicId) {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("topic_id", topicId)
      .order("created_at", { ascending: false });

    if (error) console.log("Quizzes error:", error);

    return data || [];
  }

  // ---------------- RESUME CHECK ----------------
 async function getLatestAttempt(assessmentId) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const { data, error } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("assessment_id", assessmentId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false }) // ✅ FIX HERE
    .limit(1);

  if (error) console.log("Attempt error:", error);

  return data?.[0] || null;
} async function getLatestAttempt(assessmentId) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    

    const { data, error } = await supabase
      .from("assessment_attempts")
      .select("*")
      .eq("assessment_id", assessmentId)
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(1);

    if (error) console.log("Attempt error:", error);

    return data?.[0] || null;
  }

  // ---------------- TOGGLE SUBJECT ----------------
async function toggleSubject(subjectId) {
  const isOpen = openSubject === subjectId;

  setOpenSubject(isOpen ? null : subjectId);

  if (!isOpen) {

    // TOPICS
    if (!topicsBySubject[subjectId]) {
      const topics = await loadTopics(subjectId);

      setTopicsBySubject((prev) => ({
        ...prev,
        [subjectId]: topics,
      }));
    }

    // ✅ FIX: ALWAYS ENSURE ASSESSMENTS LOAD PROPERLY
    const assessments = await loadAssessments(subjectId);

    setAssessmentsBySubject((prev) => ({
      ...prev,
      [subjectId]: assessments,
    }));
  }
}
  // ---------------- TOGGLE TOPIC ----------------
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

  // ---------------- NAV ----------------
  function startQuiz(quizId) {
    router.push(`/quiz/${quizId}`);
  }

  function startAssessment(assessmentId, hasAttempt) {
    if (hasAttempt) {
      router.push(`/assessment/${assessmentId}?resume=true`);
    } else {
      router.push(`/assessment/${assessmentId}`);
    }
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
              Choose a quiz or assessment to start
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

                {/* CONTENT */}
                {openSubject === subject.id && (
                  <div className="bg-slate-50 border-t border-slate-200 px-3 py-3 space-y-3">

                    {/* ASSESSMENTS */}
                    {(assessmentsBySubject[subject.id] || []).length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase text-slate-500 mb-2">
                          Assessments
                        </div>

                        <div className="space-y-2">
                          {assessmentsBySubject[subject.id].map((assessment) => (
                            <div
                              key={assessment.id}
                              className="flex justify-between items-center bg-white border border-green-200 rounded-lg px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-800">
                                  📝 {assessment.title}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {assessment.description}
                                </p>
                              </div>

<button
  disabled={loadingAssessmentId === assessment.id}
  onClick={async () => {
    if (loadingAssessmentId === assessment.id) return;

    setLoadingAssessmentId(assessment.id);

    try {
      const attempt = await getLatestAttempt(assessment.id);

      // ✅ no attempt → START
      if (!attempt) {
        router.push(`/assessment/${assessment.id}`);
        return;
      }

      // optional safety checks
      const isCompleted = attempt?.completed === true;

      // ✅ completed attempt → START NEW
      if (isCompleted) {
        router.push(`/assessment/${assessment.id}`);
        return;
      }

      // ✅ in-progress attempt → RESUME
      router.push(
        `/assessment/${assessment.id}?resume=true&attempt_id=${attempt.id}`
      );

    } finally {
      setLoadingAssessmentId(null);
    }
  }}
  className={`text-xs px-3 py-1 rounded-md text-white transition
    ${
      loadingAssessmentId === assessment.id
        ? "bg-green-400 cursor-not-allowed"
        : "bg-green-600 hover:bg-green-700"
    }
  `}
>
  {loadingAssessmentId === assessment.id
    ? "Loading..."
    : "Start / Resume"}
</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TOPICS */}
                    {(topicsBySubject[subject.id] || []).map((topic) => (
                      <div
                        key={topic.id}
                        className="bg-white border border-slate-200 rounded-lg"
                      >

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

                        {openTopics[topic.id] && (
                          <div className="border-t border-slate-100 bg-slate-50 px-2 py-2 space-y-2">

                            {(quizzesByTopic[topic.id] || []).map((quiz) => (
                              <div
                                key={quiz.id}
                                className="flex justify-between items-center bg-white border border-slate-200 rounded-md px-3 py-2"
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    🧪 {quiz.title}
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