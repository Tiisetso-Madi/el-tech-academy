"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";

export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);

  const [stats, setStats] = useState({
    assessments: 0,
    average: 0,
    highest: 0,
    passRate: 0,
    questionsAnswered: 0,
  });

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

   const { data, error } = await supabase
  .from("quiz_attempts")
  .select(`
    *,
    quizzes (
      title,
      pass_mark
    )
  `)
  .eq("user_id", user.id)
  .order("completed_at", { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    const attemptsData = data || [];

    setAttempts(attemptsData);

    const totalAssessments = attemptsData.length;

    const totalPercentage = attemptsData.reduce(
      (sum, item) => sum + (item.percentage || 0),
      0
    );

    const average =
      totalAssessments > 0
        ? Math.round(totalPercentage / totalAssessments)
        : 0;

    const highest =
      totalAssessments > 0
        ? Math.max(...attemptsData.map((x) => x.percentage || 0))
        : 0;

    const passed = attemptsData.filter(
      (x) =>
        (x.percentage || 0) >=
        (x.quizzes?.pass_mark || 50)
    ).length;

    const passRate =
      totalAssessments > 0
        ? Math.round((passed / totalAssessments) * 100)
        : 0;

    const questionsAnswered = attemptsData.reduce(
      (sum, item) => sum + (item.total_questions || 0),
      0
    );

    setStats({
      assessments: totalAssessments,
      average,
      highest,
      passRate,
      questionsAnswered,
    });

    setLoading(false);
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8">
          <p>Loading results...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            📊 My Results
          </h1>

          <p className="text-slate-500 mt-1">
            Track your assessment performance
          </p>
        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">
              Assessments
            </p>

            <p className="text-2xl font-bold mt-1">
              {stats.assessments}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">
              Average
            </p>

            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {stats.average}%
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">
              Highest
            </p>

            <p className="text-2xl font-bold text-green-600 mt-1">
              {stats.highest}%
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">
              Pass Rate
            </p>

            <p className="text-2xl font-bold text-purple-600 mt-1">
              {stats.passRate}%
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">
              Questions
            </p>

            <p className="text-2xl font-bold text-orange-600 mt-1">
              {stats.questionsAnswered}
            </p>
          </div>

        </div>

        {/* RESULTS TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-semibold text-slate-700">
              Assessment History
            </h2>
          </div>

          {attempts.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No assessments written yet.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">
                  <tr>

                    <th className="text-left p-4 text-sm text-slate-600">
                      Quiz
                    </th>

                    <th className="text-left p-4 text-sm text-slate-600">
                      Score
                    </th>

                    <th className="text-left p-4 text-sm text-slate-600">
                      Percentage
                    </th>

                    <th className="text-left p-4 text-sm text-slate-600">
                      Result
                    </th>

                    <th className="text-left p-4 text-sm text-slate-600">
                      Date
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {attempts.map((attempt) => {
                    const passed =
                      attempt.percentage >=
                      (attempt.quizzes?.pass_mark || 50);

                    return (
                      <tr
                        key={attempt.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="p-4">
                          {attempt.quizzes?.title}
                        </td>

                        <td className="p-4">
                          {attempt.score} / {attempt.total_questions}
                        </td>

                        <td className="p-4 font-medium">
                          {attempt.percentage}%
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              passed
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {passed ? "PASS" : "FAIL"}
                          </span>
                        </td>

                        <td className="p-4 text-slate-500 text-sm">
                          {new Date(
                            attempt.completed_at
                          ).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}