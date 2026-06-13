"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";

// ─── Palette ────────────────────────────────────────────────────────────────
const T = {
  purple: "#7c3aed", purpleBg: "#f3e8ff", purpleBorder: "#e9d5ff",
  cyan: "#0891b2",   cyanBg: "#e0f7fa",
  orange: "#ea580c", orangeBg: "#fff7ed",
  green: "#16a34a",  greenBg: "#f0fdf4",
  pink: "#db2777",   pinkBg: "#fdf2f8",
  red: "#dc2626",    redBg: "#fef2f2",
  textPrimary: "#1e1b4b", textSecondary: "#6b7280", textMuted: "#9ca3af",
};

function getScoreColor(pct) {
  if (pct >= 80) return T.green;
  if (pct >= 60) return T.cyan;
  if (pct >= 50) return T.orange;
  return T.red;
}
function getScoreBg(pct) {
  if (pct >= 80) return T.greenBg;
  if (pct >= 60) return T.cyanBg;
  if (pct >= 50) return T.orangeBg;
  return T.redBg;
}
function formatDate(d) {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric", month: "short", year: "numeric",
  });
}
function formatDateTime(d) {
  return new Date(d).toLocaleString("en-ZA", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState({ total: 0, average: 0, highest: 0, passRate: 0, questionsAnswered: 0 });
  const [filter, setFilter] = useState("all"); // all | quiz | assessment
  const [selected, setSelected] = useState(null); // attempt for modal
  const [detail, setDetail] = useState(null);    // loaded Q&A detail
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { loadResults(); }, []);

  async function loadResults() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: quizData } = await supabase
      .from("quiz_attempts")
      .select("*, quizzes(title, pass_mark)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    const { data: assessmentData } = await supabase
      .from("assessment_attempts")
      .select("*, assessments(title, description)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    const quizzes = (quizData || []).map(x => ({
      ...x, type: "quiz", title: x.quizzes?.title, pass_mark: x.quizzes?.pass_mark || 50,
    }));
    const assessments = (assessmentData || []).map(x => ({
      ...x, type: "assessment", title: x.assessments?.title, pass_mark: 50,
    }));

    const all = [...quizzes, ...assessments].sort(
      (a, b) => new Date(b.completed_at) - new Date(a.completed_at)
    );
    setAttempts(all);

    const total = all.length;
    const average = total > 0 ? Math.round(all.reduce((s, x) => s + (parseFloat(x.percentage) || 0), 0) / total) : 0;
    const highest = total > 0 ? Math.round(Math.max(...all.map(x => parseFloat(x.percentage) || 0))) : 0;
    const passed = all.filter(x => (parseFloat(x.percentage) || 0) >= (x.pass_mark || 50)).length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const questionsAnswered = all.reduce((s, x) => s + (x.total_questions || 0), 0);

    setStats({ total, average, highest, passRate, questionsAnswered });
    setLoading(false);
  }

async function openDetail(attempt) {
  setSelected(attempt);
  setDetail(null);
  setDetailLoading(true);

  if (attempt.type === "quiz") {
    const { data: answerRows } = await supabase
      .from("quiz_attempt_answers")
      .select("selected_answer, quiz_questions(question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)")
      .eq("attempt_id", attempt.id);

    const enriched = (answerRows || []).map(r => ({
      question: r.quiz_questions.question_text,
      options: {
        A: r.quiz_questions.option_a,
        B: r.quiz_questions.option_b,
        C: r.quiz_questions.option_c,
        D: r.quiz_questions.option_d,
      },
      learnerAnswer: r.selected_answer,
      correctAnswer: r.quiz_questions.correct_answer,
      explanation: r.quiz_questions.explanation,
    }));

    setDetail({ questions: enriched });
  } 
else {
  const { data: answerRows, error } = await supabase
    .from("assessment_attempt_answers")
    .select(`
      selected_answer,
      correct_answer,
      is_correct,
      assessment_questions!fk_aaa_question(
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        explanation
      )
    `)
    .eq("attempt_id", attempt.id);

    console.log("ANSWERS ERROR:", error);
console.log("ANSWERS DATA:", answerRows);

  if (error) {
    console.error(error);
    setDetail({ questions: [] });
    setDetailLoading(false);
    return;
  }

  const enriched = (answerRows || []).map(r => ({
    question: r.assessment_questions?.question_text,
    options: {
      A: r.assessment_questions?.option_a,
      B: r.assessment_questions?.option_b,
      C: r.assessment_questions?.option_c,
      D: r.assessment_questions?.option_d,
    },
    learnerAnswer: r.selected_answer,
    correctAnswer: r.correct_answer,
    is_correct: r.is_correct,
    explanation: r.assessment_questions?.explanation,
  }));

  setDetail({ questions: enriched });
}

  setDetailLoading(false);
}

  function closeModal() { setSelected(null); setDetail(null); }

  const filtered = filter === "all" ? attempts : attempts.filter(a => a.type === filter);

  // ── LOADING ──
  if (loading) {
    return (
      <AppLayout>
        <style>{`
          .rp-root { min-height:100vh; background:linear-gradient(135deg,#f3e8ff 0%,#e0f2fe 50%,#fce7f3 100%); font-family:'Inter',system-ui,sans-serif; padding:48px 24px; }
          .rp-skel { background:linear-gradient(90deg,#f3f0ff 25%,#ede9fe 50%,#f3f0ff 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:16px; }
          @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        `}</style>
        <div className="rp-root">
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="rp-skel" style={{ height: 48, width: 240 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14 }}>
              {[...Array(5)].map((_,i) => <div key={i} className="rp-skel" style={{ height: 90 }} />)}
            </div>
            {[...Array(5)].map((_,i) => <div key={i} className="rp-skel" style={{ height: 72 }} />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .rp-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 50%, #fce7f3 100%);
          font-family: 'Inter', system-ui, sans-serif;
          color: #1e1b4b; padding: 48px 24px 72px;
        }
        .rp-inner { max-width: 1100px; margin: 0 auto; }

        /* Header */
        .rp-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          background: linear-gradient(90deg,#7c3aed,#0891b2);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px;
        }
        .rp-title {
          font-size: clamp(26px,3.5vw,38px); font-weight: 800; letter-spacing: -0.02em;
          background: linear-gradient(135deg,#7c3aed 0%,#db2777 50%,#0891b2 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 6px;
        }
        .rp-sub { font-size: 14px; color: #6b7280; margin-bottom: 36px; }

        /* Stat cards */
        .rp-stat-grid {
          display: grid; grid-template-columns: repeat(auto-fit,minmax(170px,1fr));
          gap: 14px; margin-bottom: 28px;
        }
        .rp-stat-card {
          background: white; border-radius: 18px; padding: 20px 18px;
          box-shadow: 0 4px 16px rgba(124,58,237,0.08);
          border: 1px solid rgba(233,213,255,0.5);
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .rp-stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(124,58,237,0.14); }
        .rp-stat-icon { font-size: 20px; margin-bottom: 12px; }
        .rp-stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 5px; }
        .rp-stat-value { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }

        /* Filter tabs */
        .rp-filters { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .rp-filter-btn {
          padding: 8px 18px; border-radius: 99px; border: 1.5px solid #e9d5ff;
          font-size: 13px; font-weight: 600; cursor: pointer;
          background: white; color: #6b7280; transition: all 0.15s;
        }
        .rp-filter-btn.active { background: #7c3aed; border-color: #7c3aed; color: white; }
        .rp-filter-btn:hover:not(.active) { border-color: #7c3aed; color: #7c3aed; }

        /* Results list */
        .rp-list { display: flex; flex-direction: column; gap: 10px; }
        .rp-row {
          background: white; border-radius: 16px; padding: 18px 22px;
          box-shadow: 0 2px 10px rgba(124,58,237,0.06);
          border: 1.5px solid #f3f0ff;
          display: grid; align-items: center;
          grid-template-columns: auto 1fr auto auto auto auto;
          gap: 16px; cursor: pointer;
          transition: transform 0.16s, box-shadow 0.16s, border-color 0.16s;
        }
        .rp-row:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,0.13); border-color: #e9d5ff; }
        @media(max-width:640px) { .rp-row { grid-template-columns: auto 1fr auto; gap: 10px; } .rp-row .hide-sm { display:none; } }

        .rp-type-badge {
          padding: 4px 10px; border-radius: 99px; font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;
        }
        .rp-row-title { font-size: 14px; font-weight: 700; color: #1e1b4b; }
        .rp-row-date { font-size: 11px; color: #9ca3af; margin-top: 2px; }
        .rp-score-pill {
          font-size: 15px; font-weight: 800; padding: 6px 14px;
          border-radius: 99px; white-space: nowrap;
        }
        .rp-fraction { font-size: 12px; color: #9ca3af; text-align: center; white-space: nowrap; }
        .rp-pass-badge {
          padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;
        }
        .rp-chevron { font-size: 16px; color: #c4b5fd; transition: transform 0.15s; }
        .rp-row:hover .rp-chevron { transform: translateX(3px); color: #7c3aed; }

        /* Empty */
        .rp-empty {
          background: white; border-radius: 20px; text-align: center;
          padding: 56px 24px; box-shadow: 0 2px 12px rgba(124,58,237,0.06);
        }

        /* ── MODAL ── */
        .rp-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(15,7,40,0.55); backdrop-filter: blur(4px);
          display: flex; align-items: flex-start; justify-content: center;
          padding: 32px 16px; overflow-y: auto;
        }
        .rp-modal {
          background: white; border-radius: 24px; width: 100%; max-width: 760px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.2);
          animation: modalIn 0.22s cubic-bezier(.4,0,.2,1);
          overflow: hidden;
        }
        @keyframes modalIn {
          from { opacity:0; transform:translateY(20px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .rp-modal-header {
          background: linear-gradient(135deg,#f3e8ff,#e0f7fa);
          padding: 28px 28px 24px; border-bottom: 1px solid #e9d5ff;
          position: relative;
        }
        .rp-modal-close {
          position: absolute; top: 20px; right: 20px;
          width: 32px; height: 32px; border-radius: 99px;
          background: white; border: 1.5px solid #e9d5ff;
          font-size: 16px; color: #7c3aed; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .rp-modal-close:hover { background: #f3e8ff; }
        .rp-modal-type { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #7c3aed; margin-bottom: 6px; }
        .rp-modal-title { font-size: 20px; font-weight: 800; color: #1e1b4b; margin-bottom: 16px; }
        .rp-modal-stats { display: flex; gap: 16px; flex-wrap: wrap; }
        .rp-modal-stat {
          background: white; border-radius: 12px; padding: 12px 16px;
          border: 1px solid #e9d5ff; text-align: center; flex: 1; min-width: 90px;
        }
        .rp-modal-stat-val { font-size: 22px; font-weight: 800; line-height: 1; }
        .rp-modal-stat-lbl { font-size: 11px; color: #9ca3af; margin-top: 4px; font-weight: 500; }

        .rp-modal-body { padding: 24px 28px; max-height: 60vh; overflow-y: auto; }

        /* Question review */
        .rp-q-item {
          border-radius: 14px; padding: 18px; margin-bottom: 12px;
          border: 1.5px solid;
        }
        .rp-q-item.correct { background: #f0fdf4; border-color: #bbf7d0; }
        .rp-q-item.wrong   { background: #fef2f2; border-color: #fecaca; }
        .rp-q-num { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .rp-q-text { font-size: 14px; font-weight: 600; color: #1e1b4b; margin-bottom: 12px; line-height: 1.5; }
        .rp-q-options { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
        .rp-q-opt {
          padding: 8px 12px; border-radius: 9px; font-size: 13px;
          display: flex; align-items: center; gap: 8px;
        }
        .rp-q-opt.selected-correct { background: #dcfce7; color: #16a34a; font-weight: 700; }
        .rp-q-opt.selected-wrong   { background: #fee2e2; color: #dc2626; font-weight: 700; }
        .rp-q-opt.correct-ans      { background: #dcfce7; color: #16a34a; font-weight: 600; }
        .rp-q-opt.neutral          { background: #f9fafb; color: #6b7280; }
        .rp-q-explanation {
          font-size: 12px; color: #6b7280; line-height: 1.6;
          background: white; border-radius: 8px; padding: 10px 12px;
          border: 1px solid #e9d5ff; margin-top: 8px;
        }
        .rp-q-explanation strong { color: #7c3aed; }

        .rp-loading-detail {
          padding: 48px; text-align: center; color: #9ca3af; font-size: 14px;
        }
      `}</style>

      <div className="rp-root">
        <div className="rp-inner">

          {/* HEADER */}
          <div className="rp-eyebrow">My Performance</div>
          <h1 className="rp-title">📊 Results</h1>
          <p className="rp-sub">Track your progress across quizzes and assessments</p>

          {/* STAT CARDS */}
          <div className="rp-stat-grid">
            {[
              { icon: "📋", label: "Total Attempts", value: stats.total, color: T.purple },
              { icon: "🎯", label: "Average Score", value: `${stats.average}%`, color: getScoreColor(stats.average) },
              { icon: "🏆", label: "Highest Score", value: `${stats.highest}%`, color: T.green },
              { icon: "✅", label: "Pass Rate", value: `${stats.passRate}%`, color: stats.passRate >= 70 ? T.green : T.orange },
              { icon: "❓", label: "Questions Done", value: stats.questionsAnswered, color: T.cyan },
            ].map(({ icon, label, value, color }) => (
              <div key={label} className="rp-stat-card">
                <div className="rp-stat-icon">{icon}</div>
                <div className="rp-stat-label">{label}</div>
                <div className="rp-stat-value" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* FILTERS */}
          <div className="rp-filters">
            {[["all","All Results"],["quiz","Quizzes"],["assessment","Assessments"]].map(([val, label]) => (
              <button key={val} className={`rp-filter-btn${filter === val ? " active" : ""}`} onClick={() => setFilter(val)}>
                {label} {val === "all" ? `(${attempts.length})` : `(${attempts.filter(a => a.type === val).length})`}
              </button>
            ))}
          </div>

          {/* RESULTS LIST */}
          {filtered.length === 0 ? (
            <div className="rp-empty">
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.textPrimary, marginBottom: 6 }}>No results yet</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>Complete a quiz or assessment to see your results here.</div>
            </div>
          ) : (
            <div className="rp-list">
              {filtered.map((attempt) => {
                const pct = parseFloat(attempt.percentage) || 0;
                const passed = pct >= (attempt.pass_mark || 50);
                const color = getScoreColor(pct);
                const bg = getScoreBg(pct);
                const isQuiz = attempt.type === "quiz";
                return (
                  <div key={attempt.id} className="rp-row" onClick={() => openDetail(attempt)}>
                    {/* Type badge */}
                    <span className="rp-type-badge" style={{
                      background: isQuiz ? T.purpleBg : T.pinkBg,
                      color: isQuiz ? T.purple : T.pink,
                    }}>
                      {isQuiz ? "📝 Quiz" : "📊 Assessment"}
                    </span>

                    {/* Title + date */}
                    <div>
                      <div className="rp-row-title">{attempt.title || "Untitled"}</div>
                      <div className="rp-row-date">{formatDate(attempt.completed_at)}</div>
                    </div>

                    {/* Fraction */}
                    <div className="rp-fraction hide-sm">
                      {attempt.score} / {attempt.total_questions}
                    </div>

                    {/* Score pill */}
                    <div className="rp-score-pill" style={{ background: bg, color }}>
                      {Math.round(pct)}%
                    </div>

                    {/* Pass/fail */}
                    <div className="rp-pass-badge hide-sm" style={{
                      background: passed ? T.greenBg : T.redBg,
                      color: passed ? T.green : T.red,
                    }}>
                      {passed ? "✓ Pass" : "✗ Fail"}
                    </div>

                    <div className="rp-chevron">›</div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      {selected && (
        <div className="rp-overlay" onClick={closeModal}>
          <div className="rp-modal" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="rp-modal-header">
              <button className="rp-modal-close" onClick={closeModal}>✕</button>
              <div className="rp-modal-type">
                {selected.type === "quiz" ? "📝 Quiz Result" : "📊 Assessment Result"}
              </div>
              <div className="rp-modal-title">{selected.title || "Untitled"}</div>

              <div className="rp-modal-stats">
                {[
                  { label: "Score", val: `${selected.score}/${selected.total_questions}`, color: T.purple },
                  { label: "Percentage", val: `${Math.round(parseFloat(selected.percentage))}%`, color: getScoreColor(parseFloat(selected.percentage)) },
                  { label: "Result", val: parseFloat(selected.percentage) >= (selected.pass_mark || 50) ? "PASS ✓" : "FAIL ✗", color: parseFloat(selected.percentage) >= (selected.pass_mark || 50) ? T.green : T.red },
                  { label: "Completed", val: formatDateTime(selected.completed_at), color: T.textSecondary },
                ].map(({ label, val, color }) => (
                  <div key={label} className="rp-modal-stat">
                    <div className="rp-modal-stat-val" style={{ color }}>{val}</div>
                    <div className="rp-modal-stat-lbl">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal body */}
            <div className="rp-modal-body">
              {detailLoading ? (
                <div className="rp-loading-detail">Loading question breakdown…</div>
              ) : !detail?.questions?.length ? (
                <div className="rp-loading-detail" style={{ color: T.textMuted }}>No question detail available for this attempt.</div>
              ) : (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.textSecondary, marginBottom: 16 }}>
                    Question Breakdown — {detail.questions.filter(q => q.learnerAnswer?.toUpperCase() === q.correctAnswer?.toUpperCase()).length}
                  </div>

                  {detail.questions.map((q, i) => {
  const learner = q.learnerAnswer?.toUpperCase();
  const correct = q.correctAnswer?.toUpperCase();

  const opts = ["A", "B", "C", "D"];

  return (
    <div key={i} className={`rp-q-item ${learner === correct ? "correct" : "wrong"}`}>

      <div className="rp-q-num">
        Question {i + 1}
      </div>

      <div className="rp-q-text">
        {q.question}
      </div>

      {/* ─── ANSWER COMPARISON HEADER ─── */}
      <div style={{
        marginBottom: 10,
        fontSize: 12,
        fontWeight: 600,
        display: "flex",
        gap: 12,
        flexWrap: "wrap"
      }}>
        <span style={{ color: T.orange }}>
          🧑 Your Answer: {learner || "No answer"}
        </span>

        <span style={{ color: T.green }}>
          ✅ Correct Answer: {correct}
        </span>
      </div>

      {/* ─── OPTIONS ─── */}
      <div className="rp-q-options">
        {opts.map(key => {
          const val = q.options[key];

          const isLearner = learner === key;
          const isCorrect = correct === key;

          let cls = "neutral";
          if (isLearner && isCorrect) cls = "selected-correct";
          else if (isLearner && !isCorrect) cls = "selected-wrong";
          else if (!isLearner && isCorrect) cls = "correct-ans";

          return (
            <div key={key} className={`rp-q-opt ${cls}`}>
              <span style={{ fontWeight: 800 }}>{key}.</span>
              <span>{val}</span>

              {isLearner && (
                <span style={{ marginLeft: "auto" }}>
                  {isCorrect ? "✓" : "✗ your answer"}
                </span>
              )}

              {!isLearner && isCorrect && (
                <span style={{ marginLeft: "auto" }}>
                  correct
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── EXPLANATION ─── */}
      {q.explanation && (
        <div className="rp-q-explanation">
          <strong>💡 Why:</strong> {q.explanation}
        </div>
      )}
    </div>
  );
})}
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </AppLayout>
  );
}