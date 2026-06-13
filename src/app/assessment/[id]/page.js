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

const OPT_LABELS = ["A", "B", "C", "D"];
const OPT_COLORS = [T.purple, T.cyan, T.orange, "#8b5cf6"];
const OPT_BGS    = [T.purpleBg, T.cyanBg, T.orangeBg, "#f5f3ff"];

export default function AssessmentPage() {
  const { id } = useParams();
  const router  = useRouter();

  const [assessment, setAssessment]     = useState(null);
  const [questions, setQuestions]       = useState([]);
  const [current, setCurrent]           = useState(0);
  const [savedAnswers, setSavedAnswers] = useState({});  // { questionId: "A"|"B"|"C"|"D" }
  const [selected, setSelected]         = useState(null); // selected option on current question
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [timeLeft, setTimeLeft]         = useState(null);

  useEffect(() => { init(); }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  async function init() {
    const { data: aData } = await supabase
      .from("assessments").select("*").eq("id", id).single();
    setAssessment(aData);
    if (aData?.duration_minutes) setTimeLeft(aData.duration_minutes * 60);

    const { data: qData } = await supabase
      .from("assessment_questions").select("*").eq("assessment_id", id);
    setQuestions(qData || []);
    setLoading(false);
  }

  async function saveProgress(nextIndex, updatedAnswers) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("assessment_progress").upsert({
      user_id: user.id, assessment_id: id,
      current_question: nextIndex,
      answers: updatedAnswers,
      updated_at: new Date(),
    });
  }

  // Select an option — just highlights it, no feedback
  function handleSelect(opt) {
    setSelected(opt);
  }

  // Confirm selection and move to next question
  function handleNext() {
    if (!selected) return;
    const q = questions[current];
    const updatedAnswers = { ...savedAnswers, [q.id]: selected };
    setSavedAnswers(updatedAnswers);
    saveProgress(current + 1, updatedAnswers);
    setSelected(null);
    setCurrent(c => c + 1);
  }

  // Submit — calculate score and store attempt
  async function submit() {
    if (!selected && !savedAnswers[questions[current].id]) return;
    setSubmitting(true);

    // Include current question's answer if not yet saved
    const q = questions[current];
    const finalAnswers = selected
      ? { ...savedAnswers, [q.id]: selected }
      : savedAnswers;

    const { data: { user } } = await supabase.auth.getUser();

    // Calculate score now, at the end
    const score = questions.reduce((acc, question) => {
      return acc + (finalAnswers[question.id] === question.correct_answer ? 1 : 0);
    }, 0);

    const percentage = (score / questions.length) * 100;

    const { data: attempt, error: attemptError } = await supabase
      .from("assessment_attempts")
      .insert({
        user_id: user.id, assessment_id: id,
        score, total_questions: questions.length,
        percentage: Number(percentage.toFixed(2)),
        completed_at: new Date(),
      }).select().single();

    if (attemptError) { console.error(attemptError); setSubmitting(false); return; }

    const answerRows = Object.entries(finalAnswers).map(([qId, ans]) => {
      const question = questions.find(q => q.id === qId);
      return {
        attempt_id: attempt.id, user_id: user.id,
        assessment_id: id, question_id: qId,
        selected_answer: ans, correct_answer: question?.correct_answer,
        is_correct: ans === question?.correct_answer,
      };
    });

    await supabase.from("assessment_attempt_answers").insert(answerRows);
    router.push(`/assessment/${id}/result?score=${score}&total=${questions.length}&percentage=${percentage}`);
  }

  function formatTime(s) {
    if (s === null) return null;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  const pct = questions.length > 0 ? Math.round((current / questions.length) * 100) : 0;
  const isLast = current === questions.length - 1;
  const answeredCount = Object.keys(savedAnswers).length + (selected ? 1 : 0);
  const timerWarning = timeLeft !== null && timeLeft < 120;

  if (loading || !assessment || questions.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f3e8ff,#e0f2fe,#fce7f3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 14, color: T.textSecondary }}>Loading assessment…</div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const opts = OPT_LABELS.map((label, i) => ({
    label, text: q[`option_${label.toLowerCase()}`],
    color: OPT_COLORS[i], bg: OPT_BGS[i],
  }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .as-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 50%, #fce7f3 100%);
          font-family: 'Inter', system-ui, sans-serif;
          color: #1e1b4b; padding: 32px 20px 64px;
        }
        .as-inner { max-width: 680px; margin: 0 auto; }

        /* Top bar */
        .as-topbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 28px; gap: 12px; flex-wrap: wrap;
        }
        .as-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #7c3aed; margin-bottom: 4px; }
        .as-title { font-size: 18px; font-weight: 800; color: #1e1b4b; letter-spacing: -0.01em; }
        .as-timer {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 12px;
          font-size: 15px; font-weight: 800;
          border: 1.5px solid; flex-shrink: 0; transition: all 0.3s;
        }

        /* Progress */
        .as-progress-wrap { margin-bottom: 20px; }
        .as-progress-labels { display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; margin-bottom: 8px; font-weight: 600; }
        .as-progress-track { height: 8px; background: white; border-radius: 99px; overflow: hidden; box-shadow: 0 1px 4px rgba(124,58,237,0.1); }
        .as-progress-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg,#7c3aed,#0891b2); transition: width 0.5s cubic-bezier(.4,0,.2,1); }

        /* Stats strip */
        .as-strip { display: flex; gap: 10px; margin-bottom: 22px; flex-wrap: wrap; }
        .as-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 700;
          background: white; border: 1.5px solid #e9d5ff;
          box-shadow: 0 2px 6px rgba(124,58,237,0.07);
        }

        /* Card */
        .as-card {
          background: white; border-radius: 22px; padding: 30px 28px;
          box-shadow: 0 8px 32px rgba(124,58,237,0.1);
          border: 1.5px solid #e9d5ff;
          animation: fadeUp 0.22s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .as-q-num { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #7c3aed; margin-bottom: 10px; }
        .as-q-text { font-size: 17px; font-weight: 700; color: #1e1b4b; line-height: 1.55; margin-bottom: 24px; }

        /* Options */
        .as-options { display: flex; flex-direction: column; gap: 10px; }
        .as-opt {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px; border-radius: 14px;
          border: 2px solid transparent;
          cursor: pointer; transition: all 0.18s;
          background: #f9f7ff;
        }
        .as-opt:hover { border-color: #c4b5fd; background: #f3e8ff; transform: translateX(3px); }
        .as-opt.selected {
          border-color: #7c3aed;
          background: #f3e8ff;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
          transform: translateX(3px);
        }
        .as-opt-letter {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; flex-shrink: 0;
          transition: all 0.18s;
        }
        .as-opt-text { font-size: 14px; font-weight: 500; color: #374151; flex: 1; line-height: 1.5; }
        .as-opt-check { font-size: 16px; flex-shrink: 0; color: #7c3aed; }

        /* Actions */
        .as-actions { margin-top: 22px; display: flex; gap: 10px; justify-content: space-between; align-items: center; }
        .as-skip { font-size: 13px; color: #9ca3af; background: none; border: none; cursor: pointer; font-weight: 500; }
        .as-skip:hover { color: #6b7280; }

        .as-next-btn {
          padding: 12px 28px; border-radius: 13px;
          background: linear-gradient(135deg, #7c3aed, #0891b2);
          color: white; font-weight: 700; font-size: 14px;
          border: none; cursor: pointer;
          box-shadow: 0 4px 16px rgba(124,58,237,0.28);
          transition: opacity 0.15s, transform 0.15s;
          opacity: 1;
        }
        .as-next-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
        .as-next-btn:not(:disabled):hover { opacity: 0.9; transform: translateY(-1px); }

        .as-submit-btn {
          padding: 12px 28px; border-radius: 13px;
          background: linear-gradient(135deg, #16a34a, #0891b2);
          color: white; font-weight: 700; font-size: 14px;
          border: none; cursor: pointer;
          box-shadow: 0 4px 16px rgba(22,163,74,0.28);
          transition: opacity 0.15s, transform 0.15s;
        }
        .as-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .as-submit-btn:not(:disabled):hover { opacity: 0.9; transform: translateY(-1px); }

        /* Dot navigator */
        .as-dots { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 24px; justify-content: center; }
        .as-dot { width: 10px; height: 10px; border-radius: 50%; transition: all 0.2s; }
      `}</style>

      <div className="as-root">
        <div className="as-inner">

          {/* TOP BAR */}
          <div className="as-topbar">
            <div>
              <div className="as-eyebrow">📊 Assessment</div>
              <div className="as-title">{assessment.title}</div>
            </div>
            {timeLeft !== null && (
              <div className="as-timer" style={{
                background: timerWarning ? T.redBg : T.purpleBg,
                borderColor: timerWarning ? "#fca5a5" : T.purpleBorder,
                color: timerWarning ? T.red : T.purple,
              }}>
                {timerWarning ? "⚠️" : "⏱️"} {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {/* PROGRESS */}
          <div className="as-progress-wrap">
            <div className="as-progress-labels">
              <span>Question {current + 1} of {questions.length}</span>
              <span style={{ color: T.purple }}>{pct}% complete</span>
            </div>
            <div className="as-progress-track">
              <div className="as-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* STATS STRIP */}
          <div className="as-strip">
            <div className="as-chip">
              <span style={{ color: T.purple }}>✦</span>
              <span style={{ color: T.purple }}>{answeredCount} of {questions.length} answered</span>
            </div>
            <div className="as-chip">
              <span style={{ color: T.cyan }}>◎</span>
              <span style={{ color: T.cyan }}>{questions.length - answeredCount} remaining</span>
            </div>
            {assessment.duration_minutes && (
              <div className="as-chip">
                <span style={{ color: T.orange }}>⏱️</span>
                <span style={{ color: T.orange }}>{assessment.duration_minutes} min total</span>
              </div>
            )}
          </div>

          {/* QUESTION CARD */}
          <div className="as-card" key={current}>
            <div className="as-q-num">Question {current + 1}</div>
            <div className="as-q-text">{q.question_text}</div>

            <div className="as-options">
              {opts.map(({ label, text, color, bg }) => {
                const isSelected = selected === label;
                return (
                  <div
                    key={label}
                    className={`as-opt${isSelected ? " selected" : ""}`}
                    onClick={() => handleSelect(label)}
                  >
                    <div className="as-opt-letter" style={{
                      background: isSelected ? T.purpleBg : bg,
                      color: isSelected ? T.purple : color,
                    }}>
                      {label}
                    </div>
                    <div className="as-opt-text" style={{ color: isSelected ? T.textPrimary : "#374151", fontWeight: isSelected ? 600 : 500 }}>
                      {text}
                    </div>
                    {isSelected && <div className="as-opt-check">✓</div>}
                  </div>
                );
              })}
            </div>

            {/* ACTIONS */}
            <div className="as-actions">
              <span style={{ fontSize: 12, color: T.textMuted }}>
                {selected ? "Ready to continue" : "Select an answer to continue"}
              </span>
              {!isLast ? (
                <button
                  className="as-next-btn"
                  onClick={handleNext}
                  disabled={!selected}
                >
                  Next →
                </button>
              ) : (
                <button
                  className="as-submit-btn"
                  onClick={submit}
                  disabled={submitting || !selected}
                >
                  {submitting ? "Submitting…" : "✓ Submit Assessment"}
                </button>
              )}
            </div>
          </div>

          {/* DOT NAVIGATOR */}
          <div className="as-dots">
            {questions.map((ques, i) => {
              const isAnswered = !!savedAnswers[ques.id];
              const isCurrent  = i === current;
              return (
                <div key={i} className="as-dot" style={{
                  background: isCurrent
                    ? T.purple
                    : isAnswered
                      ? T.cyan
                      : "#e9d5ff",
                  transform: isCurrent ? "scale(1.5)" : "scale(1)",
                }} />
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}