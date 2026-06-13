"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

const T = {
  purple: "#7c3aed", purpleBg: "#f3e8ff", purpleBorder: "#e9d5ff",
  cyan: "#0891b2",   cyanBg: "#e0f7fa",
  green: "#16a34a",  greenBg: "#f0fdf4",
  orange: "#ea580c", orangeBg: "#fff7ed",
  red: "#dc2626",    redBg: "#fef2f2",
  textPrimary: "#1e1b4b", textSecondary: "#6b7280", textMuted: "#9ca3af",
};

function scoreColor(pct) {
  if (pct >= 80) return T.green;
  if (pct >= 60) return T.cyan;
  if (pct >= 50) return T.orange;
  return T.red;
}
function scoreBg(pct) {
  if (pct >= 80) return T.greenBg;
  if (pct >= 60) return T.cyanBg;
  if (pct >= 50) return T.orangeBg;
  return T.redBg;
}
function scoreLabel(pct) {
  if (pct >= 80) return "Outstanding! 🌟";
  if (pct >= 60) return "Good work! 👍";
  if (pct >= 50) return "Just passed 😅";
  return "Keep practising 💪";
}

export default function ReviewPage() {
  const { id } = useParams();
  const router  = useRouter();

  const [questions, setQuestions]   = useState([]);
  const [attempt, setAttempt]       = useState(null);
  const [answers, setAnswers]       = useState({}); // { questionId: selectedAnswer }
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("all"); // all | correct | wrong

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();

    // Assessment meta
    const { data: aData } = await supabase
      .from("assessments").select("*").eq("id", id).single();
    setAssessment(aData);

    // Questions
    const { data: qs } = await supabase
      .from("assessment_questions").select("*").eq("assessment_id", id);
    setQuestions(qs || []);

    // Latest attempt
    const { data: att } = await supabase
      .from("assessment_attempts").select("*")
      .eq("user_id", user.id).eq("assessment_id", id)
      .order("completed_at", { ascending: false }).limit(1).single();
    setAttempt(att);

    // Try to load stored answers from assessment_attempt_answers
    if (att) {
      const { data: ansRows } = await supabase
        .from("assessment_attempt_answers").select("question_id, selected_answer")
        .eq("attempt_id", att.id);

      if (ansRows?.length) {
        const map = {};
        ansRows.forEach(r => { map[r.question_id] = r.selected_answer; });
        setAnswers(map);
      } else {
        // Fallback: assessment_progress answers jsonb
        const { data: progress } = await supabase
          .from("assessment_progress").select("answers")
          .eq("assessment_id", id).eq("user_id", user.id)
          .eq("is_completed", true)
          .order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (progress?.answers) setAnswers(progress.answers);
      }
    }

    setLoading(false);
  }

  if (loading || !attempt || questions.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f3e8ff,#e0f2fe,#fce7f3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, color: T.textSecondary }}>Loading review…</div>
        </div>
      </div>
    );
  }

  const pct      = parseFloat(attempt.percentage) || 0;
  const passed   = pct >= 50;
  const correct  = questions.filter(q => answers[q.id] === q.correct_answer);
  const wrong    = questions.filter(q => answers[q.id] && answers[q.id] !== q.correct_answer);
  const skipped  = questions.filter(q => !answers[q.id]);

  const filtered = filter === "correct" ? correct
    : filter === "wrong" ? wrong
    : questions;

  const OPT_LABELS = ["A", "B", "C", "D"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rv-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 50%, #fce7f3 100%);
          font-family: 'Inter', system-ui, sans-serif;
          color: #1e1b4b; padding: 40px 20px 72px;
        }
        .rv-inner { max-width: 720px; margin: 0 auto; }

        /* Back */
        .rv-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; color: #7c3aed;
          background: white; border: 1.5px solid #e9d5ff;
          border-radius: 10px; padding: 7px 14px; cursor: pointer;
          margin-bottom: 28px; box-shadow: 0 2px 8px rgba(124,58,237,0.08);
          transition: background 0.15s, transform 0.15s;
        }
        .rv-back:hover { background: #f3e8ff; transform: translateX(-2px); }

        /* Hero result card */
        .rv-hero {
          background: white; border-radius: 22px; padding: 32px 28px;
          box-shadow: 0 8px 32px rgba(124,58,237,0.1);
          border: 1.5px solid #e9d5ff; margin-bottom: 24px;
          position: relative; overflow: hidden;
        }
        .rv-hero::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px;
          background: linear-gradient(90deg, #7c3aed, #0891b2);
          border-radius: 22px 22px 0 0;
        }
        .rv-hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
        .rv-hero-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #7c3aed; margin-bottom: 6px; }
        .rv-hero-title { font-size: 20px; font-weight: 800; color: #1e1b4b; letter-spacing: -0.01em; margin-bottom: 4px; }
        .rv-hero-date { font-size: 12px; color: #9ca3af; }

        .rv-score-ring {
          width: 90px; height: 90px; border-radius: 50%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          font-weight: 800; flex-shrink: 0;
          border: 4px solid;
        }
        .rv-score-ring-pct { font-size: 22px; line-height: 1; }
        .rv-score-ring-lbl { font-size: 10px; font-weight: 600; margin-top: 2px; opacity: 0.7; }

        .rv-stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px,1fr)); gap: 12px; }
        .rv-stat {
          background: #f9f7ff; border-radius: 14px; padding: 14px 16px;
          border: 1px solid #e9d5ff; text-align: center;
        }
        .rv-stat-val { font-size: 22px; font-weight: 800; line-height: 1; }
        .rv-stat-lbl { font-size: 11px; color: #9ca3af; margin-top: 5px; font-weight: 500; }

        .rv-verdict {
          margin-top: 16px; padding: 12px 16px; border-radius: 12px;
          display: flex; align-items: center; gap: 10px;
          font-size: 14px; font-weight: 700;
        }

        /* Filters */
        .rv-filters { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
        .rv-filter-btn {
          padding: 7px 16px; border-radius: 99px; border: 1.5px solid #e9d5ff;
          font-size: 12px; font-weight: 600; cursor: pointer;
          background: white; color: #6b7280; transition: all 0.15s;
        }
        .rv-filter-btn.active { background: #7c3aed; border-color: #7c3aed; color: white; }
        .rv-filter-btn:hover:not(.active) { border-color: #7c3aed; color: #7c3aed; }

        /* Question cards */
        .rv-list { display: flex; flex-direction: column; gap: 14px; }
        .rv-q-card {
          background: white; border-radius: 18px; padding: 22px 24px;
          box-shadow: 0 2px 12px rgba(124,58,237,0.07);
          border: 1.5px solid;
        }
        .rv-q-card.correct { border-color: #bbf7d0; }
        .rv-q-card.wrong   { border-color: #fca5a5; }
        .rv-q-card.skipped { border-color: #e9d5ff; }

        .rv-q-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .rv-q-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 99px;
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
        }
        .rv-q-num { font-size: 12px; color: #9ca3af; font-weight: 600; margin-left: auto; }

        .rv-q-text { font-size: 15px; font-weight: 700; color: #1e1b4b; line-height: 1.55; margin-bottom: 16px; }

        .rv-opts { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .rv-opt {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px; border-radius: 11px; font-size: 13px;
        }
        .rv-opt-letter {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800;
        }
        .rv-opt-text { flex: 1; line-height: 1.45; }
        .rv-opt-tag { font-size: 11px; font-weight: 700; flex-shrink: 0; }

        /* Correct option */
        .rv-opt.is-correct { background: #dcfce7; }
        .rv-opt.is-correct .rv-opt-letter { background: #16a34a; color: white; }
        .rv-opt.is-correct .rv-opt-text   { color: #15803d; font-weight: 600; }

        /* User selected wrong */
        .rv-opt.is-wrong { background: #fee2e2; }
        .rv-opt.is-wrong .rv-opt-letter { background: #dc2626; color: white; }
        .rv-opt.is-wrong .rv-opt-text   { color: #b91c1c; font-weight: 600; }

        /* Neutral */
        .rv-opt.neutral { background: #f9fafb; }
        .rv-opt.neutral .rv-opt-letter { background: #f3f4f6; color: #9ca3af; }
        .rv-opt.neutral .rv-opt-text   { color: #6b7280; }

        /* Explanation */
        .rv-explanation {
          padding: 12px 14px; border-radius: 11px;
          background: linear-gradient(135deg, #f3e8ff, #e0f7fa);
          border: 1px solid #e9d5ff;
          font-size: 13px; color: #374151; line-height: 1.65;
        }
        .rv-explanation strong { color: #7c3aed; }

        /* Skipped notice */
        .rv-skipped-note {
          padding: 10px 14px; border-radius: 10px;
          background: #fefce8; border: 1px solid #fef08a;
          font-size: 12px; color: #a16207; font-weight: 600;
        }

        /* Empty state */
        .rv-empty { text-align: center; padding: 48px 24px; background: white; border-radius: 18px; border: 1.5px solid #f3f0ff; }
      `}</style>

      <div className="rv-root">
        <div className="rv-inner">

          {/* BACK */}
          <button className="rv-back" onClick={() => router.back()}>← Back</button>

          {/* HERO RESULT CARD */}
          <div className="rv-hero">
            <div className="rv-hero-top">
              <div>
                <div className="rv-hero-eyebrow">📋 Assessment Review</div>
                <div className="rv-hero-title">{assessment?.title || "Assessment"}</div>
                <div className="rv-hero-date">
                  Completed {new Date(attempt.completed_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div className="rv-score-ring" style={{
                borderColor: scoreColor(pct),
                color: scoreColor(pct),
                background: scoreBg(pct),
              }}>
                <div className="rv-score-ring-pct">{Math.round(pct)}%</div>
                <div className="rv-score-ring-lbl">Score</div>
              </div>
            </div>

            <div className="rv-stat-row">
              <div className="rv-stat">
                <div className="rv-stat-val" style={{ color: T.purple }}>{attempt.score}/{attempt.total_questions}</div>
                <div className="rv-stat-lbl">Score</div>
              </div>
              <div className="rv-stat">
                <div className="rv-stat-val" style={{ color: T.green }}>{correct.length}</div>
                <div className="rv-stat-lbl">Correct</div>
              </div>
              <div className="rv-stat">
                <div className="rv-stat-val" style={{ color: T.red }}>{wrong.length}</div>
                <div className="rv-stat-lbl">Wrong</div>
              </div>
              {skipped.length > 0 && (
                <div className="rv-stat">
                  <div className="rv-stat-val" style={{ color: T.orange }}>{skipped.length}</div>
                  <div className="rv-stat-lbl">Skipped</div>
                </div>
              )}
            </div>

            <div className="rv-verdict" style={{ background: passed ? T.greenBg : T.redBg, color: passed ? T.green : T.red }}>
              <span style={{ fontSize: 20 }}>{passed ? "✅" : "❌"}</span>
              <span>{passed ? "PASSED" : "FAILED"} — {scoreLabel(pct)}</span>
            </div>
          </div>

          {/* FILTER TABS */}
          <div className="rv-filters">
            {[
              ["all",     `All Questions (${questions.length})`],
              ["correct", `✓ Correct (${correct.length})`],
              ["wrong",   `✗ Wrong (${wrong.length})`],
            ].map(([val, label]) => (
              <button key={val} className={`rv-filter-btn${filter === val ? " active" : ""}`} onClick={() => setFilter(val)}>
                {label}
              </button>
            ))}
          </div>

          {/* QUESTIONS */}
          {filtered.length === 0 ? (
            <div className="rv-empty">
              <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>
                {filter === "wrong" ? "No wrong answers!" : "Nothing here"}
              </div>
            </div>
          ) : (
            <div className="rv-list">
              {filtered.map((q, i) => {
                const selected    = answers[q.id];
                const isCorrect   = selected === q.correct_answer;
                const isSkipped   = !selected;
                const correctKey  = q.correct_answer?.toUpperCase();
                const selectedKey = selected?.toUpperCase();

                const cardClass = isSkipped ? "skipped" : isCorrect ? "correct" : "wrong";

                return (
                  <div key={q.id} className={`rv-q-card ${cardClass}`}>

                    <div className="rv-q-header">
                      <div className="rv-q-badge" style={
                        isSkipped
                          ? { background: T.orangeBg, color: T.orange }
                          : isCorrect
                            ? { background: T.greenBg, color: T.green }
                            : { background: T.redBg, color: T.red }
                      }>
                        {isSkipped ? "⊘ Skipped" : isCorrect ? "✓ Correct" : "✗ Wrong"}
                      </div>
                      <div className="rv-q-num">Q{questions.indexOf(q) + 1}</div>
                    </div>

                    <div className="rv-q-text">{q.question_text}</div>

                    <div className="rv-opts">
                      {OPT_LABELS.map(label => {
                        const optText   = q[`option_${label.toLowerCase()}`];
                        const isCorrectOpt = correctKey === label;
                        const isSelected   = selectedKey === label;
                        const isWrongSel   = isSelected && !isCorrectOpt;

                        let cls = "neutral";
                        if (isCorrectOpt) cls = "is-correct";
                        else if (isWrongSel) cls = "is-wrong";

                        return (
                          <div key={label} className={`rv-opt ${cls}`}>
                            <div className="rv-opt-letter">{label}</div>
                            <div className="rv-opt-text">{optText}</div>
                            <div className="rv-opt-tag">
                              {isCorrectOpt && "✓ Correct"}
                              {isWrongSel   && "✗ Your answer"}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {isSkipped && (
                      <div className="rv-skipped-note">⚠️ This question was not answered.</div>
                    )}

                    {q.explanation && (
                      <div className="rv-explanation">
                        <strong>💡 Explanation:</strong> {q.explanation}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </>
  );
}