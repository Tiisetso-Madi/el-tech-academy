"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import AppLayout from "@/app/AppLayout";

export default function QuizPage() {
  const { quizId } = useParams();
  const router = useRouter();

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [result, setResult] = useState(null);
  const [showReview, setShowReview] = useState(false);

  // ---------------- LOAD QUESTIONS ----------------
 useEffect(() => {
  if (quizId) {
    loadQuestions();
  }
}, [quizId]);

  async function loadQuestions() {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId);

    if (error) {
      console.log(error);
      return;
    }

    console.log("Quiz ID:", quizId);
console.log("Questions returned:", data);

const shuffled = (data || [])
  .sort(() => Math.random() - 0.5)
  .slice(0, 10);

    setQuestions(shuffled);
    setLoading(false);
  }

  // ---------------- SELECT ANSWER ----------------
  function selectAnswer(option) {
    setAnswers((prev) => ({
      ...prev,
      [questions[index].id]: option,
    }));
  }

  // ---------------- NAVIGATION ----------------
  function next() {
    if (index < questions.length - 1) {
      setIndex(index + 1);
    }
  }

  function prev() {
    if (index > 0) {
      setIndex(index - 1);
    }
  }

  // ---------------- SUBMIT QUIZ ----------------
  async function submitQuiz() {
    try {
      setSubmitting(true);

      let score = 0;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: attempt, error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          score: 0,
          total_questions: questions.length,
          percentage: 0,
        })
        .select()
        .single();

      if (attemptError) {
        console.log(attemptError);
        return;
      }

      for (const q of questions) {
        const selected = answers[q.id];
        const correct = selected === q.correct_answer;

        if (correct) {
          score++;
        }

        await supabase.from("quiz_attempt_answers").insert({
          attempt_id: attempt.id,
          question_id: q.id,
          selected_answer: selected || "unanswered",
          is_correct: correct,
        });
      }

      const percentage = Math.round(
        (score / questions.length) * 100
      );

      await supabase
        .from("quiz_attempts")
        .update({
          score,
          percentage,
        })
        .eq("id", attempt.id);

      setResult({
        score,
        percentage,
        total: questions.length,
      });

      setShowReview(true);
    } catch (err) {
      console.log(err);
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <AppLayout>
        <div className="p-10">
          Loading assessment...
        </div>
      </AppLayout>
    );
  }
  if (!questions || questions.length === 0) {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">
            No Questions Found
          </h1>

          <p className="text-slate-500 mb-6">
            This assessment does not contain any questions yet.
          </p>

          <button
            onClick={() => router.push("/practice")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg"
          >
            Back to Practice
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

  // ---------------- REVIEW SCREEN ----------------
  if (showReview && result) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto p-6">

          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h1 className="text-3xl font-bold">
              📝 Review Answers
            </h1>

            <p className="text-slate-500 mt-2">
              Review your responses before viewing
              your final result.
            </p>
          </div>

          <div className="space-y-4">

            {questions.map((question, i) => {
              const selected = answers[question.id];
              const correct = question.correct_answer;
              const isCorrect = selected === correct;

              return (
                <div
                  key={question.id}
                  className={`rounded-xl border p-5 ${
                    isCorrect
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex justify-between mb-3">

                    <h3 className="font-semibold">
                      Question {i + 1}
                    </h3>

                    <span
                      className={`font-bold ${
                        isCorrect
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {isCorrect
                        ? "✓ Correct"
                        : "✗ Incorrect"}
                    </span>
                  </div>

                  <p className="mb-4">
                    {question.question_text}
                  </p>

                  <div className="space-y-2 text-sm">

                    <div>
                      <span className="font-semibold">
                        Your Answer:
                      </span>{" "}
                      {selected || "Not Answered"}
                    </div>

                    <div>
                      <span className="font-semibold">
                        Correct Answer:
                      </span>{" "}
                      {correct}
                    </div>

                    {question.explanation && (
                      <div className="bg-white border border-slate-200 rounded-lg p-3 mt-3">
                        <span className="font-semibold">
                          Explanation:
                        </span>

                        <p className="mt-1 text-slate-600">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowReview(false)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              View Final Result
            </button>
          </div>

        </div>
      </AppLayout>
    );
  }

  // ---------------- FINAL RESULT ----------------
  if (result) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto p-8">

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">

            <div className="text-6xl mb-4">
              🎉
            </div>

            <h1 className="text-3xl font-bold mb-3">
              Assessment Completed
            </h1>

            <p className="text-slate-500 mb-6">
              Great job! Here is your score.
            </p>

            <div className="bg-slate-50 rounded-xl p-6 mb-6">

              <div className="text-5xl font-bold text-indigo-600">
                {result.percentage}%
              </div>

              <p className="mt-2 text-slate-600">
                {result.score} out of{" "}
                {result.total} correct
              </p>
            </div>

            <button
              onClick={() =>
                router.push("/practice")
              }
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Back to Practice
            </button>

          </div>
        </div>
      </AppLayout>
    );
  }

 const q = questions[index];

if (!q) {
  return (
    <AppLayout>
      <div className="p-10">
        Loading question...
      </div>
    </AppLayout>
  );
}

  // ---------------- QUIZ SCREEN ----------------
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6">

        <div className="mb-4 text-sm text-slate-500">
          Question {index + 1} of {questions.length}
        </div>

        <div className="w-full bg-slate-200 h-2 rounded-full mb-6">
          <div
            className="bg-indigo-600 h-2 rounded-full"
            style={{
              width: `${
                ((index + 1) / questions.length) *
                100
              }%`,
            }}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">

          <h2 className="text-lg font-semibold mb-6">
            {q.question_text}
          </h2>

          <div className="space-y-3">

            {["A", "B", "C", "D"].map((opt) => {
              const value =
                q[`option_${opt.toLowerCase()}`];

              return (
                <button
                  key={opt}
                  onClick={() =>
                    selectAnswer(opt)
                  }
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    answers[q.id] === opt
                      ? "bg-indigo-100 border-indigo-500"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-semibold mr-2">
                    {opt}.
                  </span>
                  {value}
                </button>
              );
            })}

          </div>
        </div>

        <div className="flex justify-between mt-6">

          <button
            onClick={prev}
            disabled={index === 0}
            className="px-4 py-2 bg-slate-200 rounded-lg disabled:opacity-40"
          >
            Previous
          </button>

          {index === questions.length - 1 ? (
            <button
              onClick={submitQuiz}
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg"
            >
              {submitting
                ? "Submitting..."
                : "Submit Assessment"}
            </button>
          ) : (
            <button
              onClick={next}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
              Next
            </button>
          )}

        </div>

      </div>
    </AppLayout>
  );
}