"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import AppLayout from "@/app/AppLayout";

const T = {
  purple: "#7c3aed", purpleBg: "#f3e8ff", purpleBorder: "#e9d5ff",
  cyan: "#0891b2",   cyanBg: "#e0f7fa",
  green: "#16a34a",  greenBg: "#f0fdf4",
  orange: "#ea580c", orangeBg: "#fff7ed",
  red: "#dc2626",    redBg: "#fef2f2",
  textPrimary: "#1e1b4b", textSecondary: "#6b7280", textMuted: "#9ca3af",
};

const OPT_COLORS = [T.purple, T.cyan, T.orange, "#8b5cf6"];
const OPT_BGS    = [T.purpleBg, T.cyanBg, T.orangeBg, "#f5f3ff"];
const OPT_LABELS = ["A", "B", "C", "D"];

function getTheme(pct) {
  if (pct >= 80) return { color: T.green,  bg: T.greenBg,  emoji: "🌟", label: "Outstanding!",  sub: "You absolutely nailed it. Keep up the excellent work!" };
  if (pct >= 60) return { color: T.cyan,   bg: T.cyanBg,   emoji: "👍", label: "Good Work!",    sub: "Solid performance. A little more practice and you'll be at the top." };
  if (pct >= 50) return { color: T.orange, bg: T.orangeBg, emoji: "😅", label: "Just Passed",   sub: "You made it! Review your answers to strengthen the weak areas." };
  return           { color: T.red,    bg: T.redBg,    emoji: "💪", label: "Keep Going!",  sub: "Don't give up — review your answers and try again. You've got this!" };
}

// ── Shared loading skeleton ──────────────────────────────────────────────────
function PageSkeleton({ children }) {
  return (
    <AppLayout>
      <style>{`
        .qz-sk{background:linear-gradient(90deg,#f3f0ff 25%,#ede9fe 50%,#f3f0ff 75%);background-size:200% 100%;animation:sh 1.4s infinite;border-radius:14px}
        @keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .qz-sk-root{min-height:100vh;background:linear-gradient(135deg,#f3e8ff 0%,#e0f2fe 50%,#fce7f3 100%);padding:40px 20px;font-family:'Inter',system-ui,sans-serif}
      `}</style>
      <div className="qz-sk-root">
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          {children}
        </div>
      </div>
    </AppLayout>
  );
}

export default function QuizPage() {
  const { quizId } = useParams();
  const router     = useRouter();

  const [questions, setQuestions]   = useState([]);
  const [index, setIndex]           = useState(0);
  const [answers, setAnswers]       = useState({});
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => { if (quizId) loadQuestions(); }, [quizId]);

  // Animate score counter on result
  useEffect(() => {
    if (!result) return;
    let start = 0;
    const step = Math.ceil(result.percentage / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= result.percentage) { setDisplayPct(result.percentage); clearInterval(timer); }
      else setDisplayPct(start);
    }, 30);
    return () => clearInterval(timer);
  }, [result]);

  async function loadQuestions() {
    const { data, error } = await supabase
      .from("quiz_questions").select("*").eq("quiz_id", quizId);
    if (error) { console.log(error); return; }
    const shuffled = (data || []).sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setLoading(false);
  }

  function selectAnswer(option) {
    setAnswers(prev => ({ ...prev, [questions[index].id]: option }));
  }

  async function submitQuiz() {
    try {
      setSubmitting(true);
      let score = 0;
      const { data: { user } } = await supabase.auth.getUser();

      const { data: attempt, error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({ user_id: user.id, quiz_id: quizId, score: 0, total_questions: questions.length, percentage: 0 })
        .select().single();
      if (attemptError) { console.log(attemptError); return; }

      for (const q of questions) {
        const selected = answers[q.id];
        const correct  = selected === q.correct_answer;
        if (correct) score++;
        await supabase.from("quiz_attempt_answers").insert({
          attempt_id: attempt.id, question_id: q.id,
          selected_answer: selected || "unanswered", is_correct: correct,
        });
      }

      const percentage = Math.round((score / questions.length) * 100);
      await supabase.from("quiz_attempts").update({ score, percentage }).eq("id", attempt.id);
      setResult({ score, percentage, total: questions.length });
      setShowReview(true);
    } catch (err) { console.log(err); }
    finally { setSubmitting(false); }
  }

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageSkeleton>
        <div className="qz-sk" style={{ height: 40, width: 200 }} />
        <div className="qz-sk" style={{ height: 10 }} />
        <div className="qz-sk" style={{ height: 280 }} />
        {[...Array(4)].map((_,i) => <div key={i} className="qz-sk" style={{ height: 60 }} />)}
      </PageSkeleton>
    );
  }

  // ── NO QUESTIONS ─────────────────────────────────────────────────────────
  if (!questions || questions.length === 0) {
    return (
      <AppLayout>
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f3e8ff,#e0f2fe,#fce7f3)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter',system-ui,sans-serif" }}>
          <div style={{ background: "white", borderRadius: 22, padding: "48px 36px", textAlign: "center", maxWidth: 400, boxShadow: "0 8px 32px rgba(124,58,237,0.1)", border: "1.5px solid #e9d5ff" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>📭</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary, marginBottom: 8 }}>No Questions Found</div>
            <div style={{ fontSize: 14, color: T.textSecondary, marginBottom: 28, lineHeight: 1.6 }}>This quiz doesn't have any questions yet. Check back soon!</div>
            <button onClick={() => router.push("/practice")} style={{ padding: "12px 28px", borderRadius: 12, background: `linear-gradient(135deg,${T.purple},${T.cyan})`, color: "white", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
              ← Back to Practice
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── REVIEW SCREEN ────────────────────────────────────────────────────────
  if (showReview && result) {
    const correct = questions.filter(q => answers[q.id] === q.correct_answer);
    const wrong   = questions.filter(q => answers[q.id] && answers[q.id] !== q.correct_answer);

    return (
      <AppLayout>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          .rv-root { min-height:100vh; background:linear-gradient(135deg,#f3e8ff 0%,#e0f2fe 50%,#fce7f3 100%); font-family:'Inter',system-ui,sans-serif; padding:40px 20px 72px; color:#1e1b4b; }
          .rv-inner { max-width:720px; margin:0 auto; }
          .rv-hero { background:white; border-radius:22px; padding:28px; box-shadow:0 8px 32px rgba(124,58,237,0.1); border:1.5px solid #e9d5ff; margin-bottom:20px; position:relative; overflow:hidden; }
          .rv-hero::before { content:''; position:absolute; top:0; left:0; right:0; height:5px; background:linear-gradient(90deg,#7c3aed,#0891b2); border-radius:22px 22px 0 0; }
          .rv-stat-row { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:18px; }
          .rv-stat { background:#f9f7ff; border-radius:13px; padding:12px; border:1px solid #e9d5ff; text-align:center; }
          .rv-stat-val { font-size:20px; font-weight:800; line-height:1; }
          .rv-stat-lbl { font-size:11px; color:#9ca3af; margin-top:4px; font-weight:500; }
          .rv-list { display:flex; flex-direction:column; gap:12px; }
          .rv-q-card { background:white; border-radius:18px; padding:22px 24px; box-shadow:0 2px 12px rgba(124,58,237,0.07); border:1.5px solid; }
          .rv-q-card.correct { border-color:#bbf7d0; }
          .rv-q-card.wrong   { border-color:#fca5a5; }
          .rv-q-badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:99px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; margin-bottom:10px; }
          .rv-q-text { font-size:15px; font-weight:700; color:#1e1b4b; line-height:1.55; margin-bottom:14px; }
          .rv-opts { display:flex; flex-direction:column; gap:7px; margin-bottom:10px; }
          .rv-opt { display:flex; align-items:center; gap:11px; padding:10px 13px; border-radius:10px; font-size:13px; }
          .rv-opt-letter { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; flex-shrink:0; }
          .rv-opt.is-correct { background:#dcfce7; }
          .rv-opt.is-correct .rv-opt-letter { background:#16a34a; color:white; }
          .rv-opt.is-correct .rv-opt-text { color:#15803d; font-weight:600; }
          .rv-opt.is-wrong { background:#fee2e2; }
          .rv-opt.is-wrong .rv-opt-letter { background:#dc2626; color:white; }
          .rv-opt.is-wrong .rv-opt-text { color:#b91c1c; font-weight:600; }
          .rv-opt.neutral { background:#f9fafb; }
          .rv-opt.neutral .rv-opt-letter { background:#f3f4f6; color:#9ca3af; }
          .rv-opt.neutral .rv-opt-text { color:#6b7280; }
          .rv-opt-tag { font-size:10px; font-weight:700; margin-left:auto; flex-shrink:0; }
          .rv-explanation { padding:12px 14px; border-radius:10px; background:linear-gradient(135deg,#f3e8ff,#e0f7fa); border:1px solid #e9d5ff; font-size:13px; color:#374151; line-height:1.65; }
          .rv-explanation strong { color:#7c3aed; }
          .rv-btn-primary { padding:13px 28px; border-radius:13px; background:linear-gradient(135deg,#7c3aed,#0891b2); color:white; font-weight:700; font-size:14px; border:none; cursor:pointer; box-shadow:0 4px 16px rgba(124,58,237,0.28); transition:opacity .15s,transform .15s; }
          .rv-btn-primary:hover { opacity:.9; transform:translateY(-1px); }
        `}</style>
        <div className="rv-root">
          <div className="rv-inner">

            {/* Hero */}
            <div className="rv-hero">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.purple, marginBottom: 6 }}>📝 Quiz Review</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary, marginBottom: 4 }}>Review Your Answers</div>
              <div style={{ fontSize: 13, color: T.textSecondary }}>Check each question before seeing your final result.</div>
              <div className="rv-stat-row">
                <div className="rv-stat"><div className="rv-stat-val" style={{ color: T.purple }}>{result.score}/{result.total}</div><div className="rv-stat-lbl">Score</div></div>
                <div className="rv-stat"><div className="rv-stat-val" style={{ color: T.green }}>{correct.length}</div><div className="rv-stat-lbl">Correct</div></div>
                <div className="rv-stat"><div className="rv-stat-val" style={{ color: T.red }}>{wrong.length}</div><div className="rv-stat-lbl">Wrong</div></div>
              </div>
            </div>

            {/* Questions */}
            <div className="rv-list" style={{ marginBottom: 24 }}>
              {questions.map((q, i) => {
                const selected   = answers[q.id];
                const isCorrect  = selected === q.correct_answer;
                const correctKey = q.correct_answer?.toUpperCase();
                const selectedKey = selected?.toUpperCase();

                return (
                  <div key={q.id} className={`rv-q-card ${isCorrect ? "correct" : "wrong"}`}>
                    <div className="rv-q-badge" style={isCorrect ? { background: T.greenBg, color: T.green } : { background: T.redBg, color: T.red }}>
                      {isCorrect ? "✓ Correct" : "✗ Wrong"}
                    </div>
                    <div className="rv-q-text">{i + 1}. {q.question_text}</div>
                    <div className="rv-opts">
                      {OPT_LABELS.map(label => {
                        const optText      = q[`option_${label.toLowerCase()}`];
                        const isCorrectOpt = correctKey === label;
                        const isWrongSel   = selectedKey === label && !isCorrectOpt;
                        const cls = isCorrectOpt ? "is-correct" : isWrongSel ? "is-wrong" : "neutral";
                        return (
                          <div key={label} className={`rv-opt ${cls}`}>
                            <div className="rv-opt-letter">{label}</div>
                            <div className="rv-opt-text" style={{ flex: 1 }}>{optText}</div>
                            <div className="rv-opt-tag" style={{ color: isCorrectOpt ? T.green : isWrongSel ? T.red : "transparent" }}>
                              {isCorrectOpt ? "✓ Correct" : isWrongSel ? "✗ Yours" : ""}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <div className="rv-explanation"><strong>💡 Explanation:</strong> {q.explanation}</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="rv-btn-primary" onClick={() => setShowReview(false)}>
                View Final Result →
              </button>
            </div>

          </div>
        </div>
      </AppLayout>
    );
  }

  // ── FINAL RESULT ─────────────────────────────────────────────────────────
  if (result) {
    const theme  = getTheme(result.percentage);
    const passed = result.percentage >= 50;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (displayPct / 100) * circumference;

    return (
      <AppLayout>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          .rs-root { min-height:100vh; background:linear-gradient(135deg,#f3e8ff 0%,#e0f2fe 50%,#fce7f3 100%); font-family:'Inter',system-ui,sans-serif; display:flex; align-items:center; justify-content:center; padding:32px 20px; }
          .rs-card { background:white; border-radius:24px; padding:36px 32px; box-shadow:0 12px 48px rgba(124,58,237,0.12); border:1.5px solid #e9d5ff; max-width:480px; width:100%; text-align:center; position:relative; overflow:hidden; animation:fadeUp .3s cubic-bezier(.4,0,.2,1); }
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          .rs-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:20px 0; }
          .rs-stat { background:#f9f7ff; border-radius:13px; padding:13px 10px; border:1px solid #e9d5ff; }
          .rs-stat-val { font-size:20px; font-weight:800; line-height:1; }
          .rs-stat-lbl { font-size:11px; color:#9ca3af; margin-top:4px; font-weight:500; }
          .rs-verdict { display:inline-flex; align-items:center; gap:8px; padding:9px 22px; border-radius:99px; font-size:14px; font-weight:800; margin-bottom:8px; }
          .rs-btns { display:flex; flex-direction:column; gap:10px; margin-top:24px; }
          .rs-btn-primary { width:100%; padding:13px; border-radius:13px; background:linear-gradient(135deg,#7c3aed,#0891b2); color:white; font-weight:700; font-size:14px; border:none; cursor:pointer; box-shadow:0 4px 16px rgba(124,58,237,0.28); transition:opacity .15s,transform .15s; }
          .rs-btn-primary:hover { opacity:.9; transform:translateY(-1px); }
          .rs-btn-row { display:flex; gap:10px; }
          .rs-btn-sec { flex:1; padding:11px; border-radius:12px; background:white; border:1.5px solid #e9d5ff; color:#7c3aed; font-weight:600; font-size:13px; cursor:pointer; transition:background .15s,transform .15s; }
          .rs-btn-sec:hover { background:#f3e8ff; transform:translateY(-1px); }
          .rs-confetti-dot { position:absolute; width:7px; height:7px; border-radius:50%; animation:fall 2.5s ease-in forwards; opacity:0; }
          @keyframes fall { 0%{opacity:1;transform:translateY(-20px) rotate(0)} 100%{opacity:0;transform:translateY(220px) rotate(360deg)} }
        `}</style>
        <div className="rs-root">
          <div className="rs-card">
            {/* Top bar */}
            <div style={{ position:"absolute", top:0, left:0, right:0, height:5, background:`linear-gradient(90deg,${theme.color},${T.cyan})`, borderRadius:"24px 24px 0 0" }} />

            {/* Confetti */}
            {passed && [T.purple, T.cyan, T.green, T.orange, "#f59e0b", T.red].map((color, i) => (
              <div key={i} className="rs-confetti-dot" style={{ background: color, left: `${10 + i * 15}%`, animationDelay: `${i * 0.18}s`, animationDuration: `${2 + i * 0.25}s` }} />
            ))}

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.color, marginBottom: 6 }}>📝 Quiz Complete</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 24, background: `linear-gradient(135deg,${theme.color},${T.cyan})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              {passed ? "Well Done! 🎉" : "Quiz Done"}
            </div>

            {/* Ring */}
            <div style={{ display:"flex", justifyContent:"center", position:"relative", marginBottom: 20 }}>
              <svg width="170" height="170" viewBox="0 0 180 180">
                <circle cx="90" cy="90" r={radius} fill="none" stroke="#f3f0ff" strokeWidth="12" />
                <circle cx="90" cy="90" r={radius} fill="none" stroke={theme.color} strokeWidth="12"
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
                  transform="rotate(-90 90 90)" style={{ transition:"stroke-dashoffset 0.05s linear" }} />
              </svg>
              <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
                <div style={{ fontSize: 34, fontWeight: 800, color: theme.color, lineHeight: 1 }}>{displayPct}%</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: theme.color, opacity: 0.7, marginTop: 3 }}>Score</div>
                <div style={{ fontSize: 22, marginTop: 4 }}>{theme.emoji}</div>
              </div>
            </div>

            <div className="rs-verdict" style={{ background: theme.bg, color: theme.color }}>
              {passed ? "✅ PASSED" : "❌ FAILED"} — {theme.label}
            </div>
            <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6, marginBottom: 4, maxWidth: 340, margin: "6px auto 0" }}>{theme.sub}</p>

            <div className="rs-stats">
              <div className="rs-stat"><div className="rs-stat-val" style={{ color: T.purple }}>{result.score}/{result.total}</div><div className="rs-stat-lbl">Score</div></div>
              <div className="rs-stat"><div className="rs-stat-val" style={{ color: T.green }}>{result.score}</div><div className="rs-stat-lbl">Correct</div></div>
              <div className="rs-stat"><div className="rs-stat-val" style={{ color: T.red }}>{result.total - result.score}</div><div className="rs-stat-lbl">Wrong</div></div>
            </div>

            <div className="rs-btns">
              <button className="rs-btn-primary" onClick={() => setShowReview(true)}>📋 Review Answers</button>
              <div className="rs-btn-row">
                <button className="rs-btn-sec" onClick={() => { setResult(null); setAnswers({}); setIndex(0); loadQuestions(); }}>🔄 Retry</button>
                <button className="rs-btn-sec" onClick={() => router.push("/practice")}>← Practice</button>
              </div>
            </div>

          </div>
        </div>
      </AppLayout>
    );
  }

  // ── QUIZ SCREEN ──────────────────────────────────────────────────────────
  const q = questions[index];
  if (!q) return <PageSkeleton><div className="qz-sk" style={{ height: 200 }} /></PageSkeleton>;

  const pct = Math.round(((index) / questions.length) * 100);
  const answeredCount = Object.keys(answers).length;

  return (
    <AppLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        .qz-root { min-height:100vh; background:linear-gradient(135deg,#f3e8ff 0%,#e0f2fe 50%,#fce7f3 100%); font-family:'Inter',system-ui,sans-serif; color:#1e1b4b; padding:32px 20px 64px; }
        .qz-inner { max-width:680px; margin:0 auto; }

        /* Top */
        .qz-topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; gap:12px; flex-wrap:wrap; }
        .qz-eyebrow { font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#7c3aed; margin-bottom:4px; }
        .qz-title { font-size:17px; font-weight:800; color:#1e1b4b; }
        .qz-counter { background:white; border:1.5px solid #e9d5ff; border-radius:10px; padding:6px 14px; font-size:12px; font-weight:700; color:#7c3aed; box-shadow:0 2px 6px rgba(124,58,237,0.07); white-space:nowrap; }

        /* Progress */
        .qz-prog-wrap { margin-bottom:18px; }
        .qz-prog-labels { display:flex; justify-content:space-between; font-size:12px; color:#6b7280; margin-bottom:7px; font-weight:600; }
        .qz-prog-track { height:8px; background:white; border-radius:99px; overflow:hidden; box-shadow:0 1px 4px rgba(124,58,237,0.1); }
        .qz-prog-fill { height:100%; border-radius:99px; background:linear-gradient(90deg,#7c3aed,#0891b2); transition:width .5s cubic-bezier(.4,0,.2,1); }

        /* Strip */
        .qz-strip { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
        .qz-chip { display:inline-flex; align-items:center; gap:5px; padding:6px 13px; border-radius:99px; font-size:12px; font-weight:700; background:white; border:1.5px solid #e9d5ff; box-shadow:0 2px 6px rgba(124,58,237,0.07); }

        /* Card */
        .qz-card { background:white; border-radius:22px; padding:28px 26px; box-shadow:0 8px 32px rgba(124,58,237,0.1); border:1.5px solid #e9d5ff; animation:fadeUp .22s cubic-bezier(.4,0,.2,1); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .qz-q-num { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#7c3aed; margin-bottom:9px; }
        .qz-q-text { font-size:16px; font-weight:700; color:#1e1b4b; line-height:1.55; margin-bottom:22px; }

        /* Options */
        .qz-opts { display:flex; flex-direction:column; gap:10px; }
        .qz-opt { display:flex; align-items:center; gap:13px; padding:13px 15px; border-radius:13px; border:2px solid transparent; cursor:pointer; transition:all .18s; background:#f9f7ff; }
        .qz-opt:hover { border-color:#c4b5fd; background:#f3e8ff; transform:translateX(3px); }
        .qz-opt.selected { border-color:#7c3aed; background:#f3e8ff; box-shadow:0 0 0 3px rgba(124,58,237,0.1); transform:translateX(3px); }
        .qz-opt-letter { width:33px; height:33px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; flex-shrink:0; transition:all .18s; }
        .qz-opt-text { font-size:14px; flex:1; line-height:1.5; }
        .qz-opt-check { font-size:15px; color:#7c3aed; flex-shrink:0; }

        /* Nav */
        .qz-nav { display:flex; justify-content:space-between; align-items:center; margin-top:20px; gap:10px; }
        .qz-nav-hint { font-size:12px; color:#9ca3af; }
        .qz-btn-prev { padding:10px 20px; border-radius:11px; background:white; border:1.5px solid #e9d5ff; color:#6b7280; font-weight:600; font-size:13px; cursor:pointer; transition:all .15s; }
        .qz-btn-prev:disabled { opacity:.35; cursor:not-allowed; }
        .qz-btn-prev:not(:disabled):hover { border-color:#7c3aed; color:#7c3aed; }
        .qz-btn-next { padding:10px 22px; border-radius:11px; background:linear-gradient(135deg,#7c3aed,#0891b2); color:white; font-weight:700; font-size:13px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(124,58,237,0.25); transition:opacity .15s,transform .15s; }
        .qz-btn-next:hover { opacity:.9; transform:translateY(-1px); }
        .qz-btn-submit { padding:10px 22px; border-radius:11px; background:linear-gradient(135deg,#16a34a,#0891b2); color:white; font-weight:700; font-size:13px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(22,163,74,0.25); transition:opacity .15s,transform .15s; }
        .qz-btn-submit:disabled { opacity:.5; cursor:not-allowed; }
        .qz-btn-submit:not(:disabled):hover { opacity:.9; transform:translateY(-1px); }

        /* Dots */
        .qz-dots { display:flex; gap:5px; flex-wrap:wrap; margin-top:22px; justify-content:center; }
        .qz-dot { width:10px; height:10px; border-radius:50%; transition:all .2s; }
      `}</style>

      <div className="qz-root">
        <div className="qz-inner">

          {/* TOP BAR */}
          <div className="qz-topbar">
            <div>
              <div className="qz-eyebrow">📝 Quiz</div>
              <div className="qz-title">Answer each question carefully</div>
            </div>
            <div className="qz-counter">Q{index + 1} / {questions.length}</div>
          </div>

          {/* PROGRESS */}
          <div className="qz-prog-wrap">
            <div className="qz-prog-labels">
              <span>Question {index + 1} of {questions.length}</span>
              <span style={{ color: T.purple }}>{pct}% complete</span>
            </div>
            <div className="qz-prog-track">
              <div className="qz-prog-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* STRIP */}
          <div className="qz-strip">
            <div className="qz-chip"><span style={{ color: T.purple }}>✦</span><span style={{ color: T.purple }}>{answeredCount} answered</span></div>
            <div className="qz-chip"><span style={{ color: T.cyan }}>◎</span><span style={{ color: T.cyan }}>{questions.length - answeredCount} remaining</span></div>
          </div>

          {/* QUESTION CARD */}
          <div className="qz-card" key={index}>
            <div className="qz-q-num">Question {index + 1}</div>
            <div className="qz-q-text">{q.question_text}</div>

            <div className="qz-opts">
              {OPT_LABELS.map((label, i) => {
                const text       = q[`option_${label.toLowerCase()}`];
                const isSelected = answers[q.id] === label;
                return (
                  <div key={label} className={`qz-opt${isSelected ? " selected" : ""}`} onClick={() => selectAnswer(label)}>
                    <div className="qz-opt-letter" style={{ background: isSelected ? T.purpleBg : OPT_BGS[i], color: isSelected ? T.purple : OPT_COLORS[i] }}>{label}</div>
                    <div className="qz-opt-text" style={{ color: isSelected ? T.textPrimary : "#374151", fontWeight: isSelected ? 600 : 500 }}>{text}</div>
                    {isSelected && <div className="qz-opt-check">✓</div>}
                  </div>
                );
              })}
            </div>

            {/* NAV */}
            <div className="qz-nav">
              <button className="qz-btn-prev" onClick={() => setIndex(i => i - 1)} disabled={index === 0}>← Prev</button>
              <span className="qz-nav-hint">{answers[q.id] ? "Ready" : "Select an answer"}</span>
              {index < questions.length - 1 ? (
                <button className="qz-btn-next" onClick={() => setIndex(i => i + 1)}>Next →</button>
              ) : (
                <button className="qz-btn-submit" onClick={submitQuiz} disabled={submitting}>
                  {submitting ? "Submitting…" : "✓ Submit Quiz"}
                </button>
              )}
            </div>
          </div>

          {/* DOT NAVIGATOR */}
          <div className="qz-dots">
            {questions.map((ques, i) => (
              <div
                key={i}
                className="qz-dot"
                onClick={() => setIndex(i)}
                style={{
                  background: i === index ? T.purple : answers[ques.id] ? T.cyan : "#e9d5ff",
                  transform: i === index ? "scale(1.5)" : "scale(1)",
                  cursor: "pointer",
                }}
                title={`Q${i + 1}${answers[ques.id] ? " ✓" : ""}`}
              />
            ))}
          </div>

        </div>
      </div>
    </AppLayout>
  );
}