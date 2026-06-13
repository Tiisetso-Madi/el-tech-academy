"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const T = {
  purple: "#7c3aed", purpleBg: "#f3e8ff", purpleBorder: "#e9d5ff",
  cyan: "#0891b2",   cyanBg: "#e0f7fa",
  green: "#16a34a",  greenBg: "#f0fdf4",
  orange: "#ea580c", orangeBg: "#fff7ed",
  red: "#dc2626",    redBg: "#fef2f2",
  textPrimary: "#1e1b4b", textSecondary: "#6b7280", textMuted: "#9ca3af",
};

function getTheme(pct) {
  if (pct >= 80) return { color: T.green,  bg: T.greenBg,  border: "#bbf7d0", emoji: "🌟", label: "Outstanding!", sub: "You absolutely nailed it. Keep up the excellent work!" };
  if (pct >= 60) return { color: T.cyan,   bg: T.cyanBg,   border: "#a5f3fc", emoji: "👍", label: "Good Work!",    sub: "Solid performance. A little more practice and you'll be at the top." };
  if (pct >= 50) return { color: T.orange, bg: T.orangeBg, border: "#fed7aa", emoji: "😅", label: "Just Passed",   sub: "You made it! Review your answers to strengthen the weak areas." };
  return           { color: T.red,    bg: T.redBg,    border: "#fca5a5", emoji: "💪", label: "Keep Going!",  sub: "Don't give up — review your answers and try again. You've got this!" };
}

export default function ResultPage() {
  const params     = useSearchParams();
  const router     = useRouter();
  const { id }     = useParams();

  const score      = parseInt(params.get("score") || "0");
  const total      = parseInt(params.get("total") || "0");
  const rawPct     = parseFloat(params.get("percentage") || "0");
  const pct        = Math.round(rawPct);
  const passed     = pct >= 50;

  const theme      = getTheme(pct);

  // Animate the percentage counter
  const [displayPct, setDisplayPct] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(pct / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= pct) { setDisplayPct(pct); clearInterval(timer); }
      else setDisplayPct(start);
    }, 30);
    return () => clearInterval(timer);
  }, [pct]);

  // Circular progress ring
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (displayPct / 100) * circumference;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rr-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 50%, #fce7f3 100%);
          font-family: 'Inter', system-ui, sans-serif;
          color: #1e1b4b;
          display: flex; align-items: center; justify-content: center;
          padding: 32px 20px;
        }
        .rr-inner {
          max-width: 520px; width: 100%;
          display: flex; flex-direction: column; gap: 16px;
          animation: fadeUp 0.3s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* Main card */
        .rr-card {
          background: white; border-radius: 24px; padding: 36px 32px;
          box-shadow: 0 12px 48px rgba(124,58,237,0.12);
          border: 1.5px solid #e9d5ff;
          text-align: center; position: relative; overflow: hidden;
        }
        .rr-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px;
          border-radius: 24px 24px 0 0;
        }

        .rr-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; margin-bottom: 6px;
        }
        .rr-title {
          font-size: 26px; font-weight: 800; letter-spacing: -0.02em;
          margin-bottom: 28px;
        }

        /* Ring */
        .rr-ring-wrap {
          display: flex; justify-content: center; margin-bottom: 24px;
          position: relative;
        }
        .rr-ring-inner {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .rr-ring-pct {
          font-size: 36px; font-weight: 800; line-height: 1; letter-spacing: -0.03em;
        }
        .rr-ring-lbl { font-size: 12px; font-weight: 600; opacity: 0.65; margin-top: 2px; }
        .rr-ring-emoji { font-size: 26px; margin-top: 4px; }

        /* Verdict */
        .rr-verdict {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 24px; border-radius: 99px;
          font-size: 15px; font-weight: 800; margin-bottom: 8px;
        }
        .rr-sub {
          font-size: 14px; color: #6b7280; line-height: 1.6; max-width: 340px; margin: 0 auto 24px;
        }

        /* Stats row */
        .rr-stats {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 28px;
        }
        .rr-stat {
          background: #f9f7ff; border-radius: 14px; padding: 14px 10px;
          border: 1px solid #e9d5ff;
        }
        .rr-stat-val { font-size: 22px; font-weight: 800; line-height: 1; }
        .rr-stat-lbl { font-size: 11px; color: #9ca3af; margin-top: 5px; font-weight: 500; }

        /* Buttons */
        .rr-btns { display: flex; flex-direction: column; gap: 10px; }
        .rr-btn-primary {
          width: 100%; padding: 14px; border-radius: 14px;
          background: linear-gradient(135deg, #7c3aed, #0891b2);
          color: white; font-weight: 700; font-size: 15px;
          border: none; cursor: pointer;
          box-shadow: 0 4px 16px rgba(124,58,237,0.28);
          transition: opacity 0.15s, transform 0.15s;
        }
        .rr-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

        .rr-btn-row { display: flex; gap: 10px; }
        .rr-btn-secondary {
          flex: 1; padding: 12px; border-radius: 12px;
          background: white; border: 1.5px solid #e9d5ff;
          color: #7c3aed; font-weight: 600; font-size: 14px;
          cursor: pointer; transition: background 0.15s, transform 0.15s;
        }
        .rr-btn-secondary:hover { background: #f3e8ff; transform: translateY(-1px); }

        /* Confetti dots */
        .rr-confetti {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none; overflow: hidden; border-radius: 24px;
        }
        .rr-dot {
          position: absolute; width: 8px; height: 8px; border-radius: 50%;
          animation: fall 2.5s ease-in forwards;
          opacity: 0;
        }
        @keyframes fall {
          0%   { opacity: 1; transform: translateY(-20px) rotate(0deg); }
          100% { opacity: 0; transform: translateY(220px) rotate(360deg); }
        }
      `}</style>

      <div className="rr-root">
        <div className="rr-inner">

          {/* MAIN CARD */}
          <div className="rr-card">

            {/* Top gradient bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: `linear-gradient(90deg, ${theme.color}, ${T.cyan})`, borderRadius: "24px 24px 0 0" }} />

            {/* Confetti for passing */}
            {passed && (
              <div className="rr-confetti">
                {[T.purple, T.cyan, T.green, T.orange, "#f59e0b", T.pink].map((color, i) => (
                  <div key={i} className="rr-dot" style={{
                    background: color,
                    left: `${10 + i * 16}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: `${2 + i * 0.3}s`,
                  }} />
                ))}
              </div>
            )}

            <div className="rr-eyebrow" style={{ color: theme.color }}>📊 Assessment Complete</div>
            <div className="rr-title"
              style={{
                background: `linear-gradient(135deg, ${theme.color}, ${T.cyan})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
              {passed ? "Well Done! 🎉" : "Assessment Done"}
            </div>

            {/* CIRCULAR RING */}
            <div className="rr-ring-wrap">
              <svg width="180" height="180" viewBox="0 0 180 180">
                {/* Track */}
                <circle cx="90" cy="90" r={radius} fill="none" stroke="#f3f0ff" strokeWidth="12" />
                {/* Progress */}
                <circle
                  cx="90" cy="90" r={radius} fill="none"
                  stroke={theme.color} strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 90 90)"
                  style={{ transition: "stroke-dashoffset 0.05s linear" }}
                />
              </svg>
              <div className="rr-ring-inner">
                <div className="rr-ring-pct" style={{ color: theme.color }}>{displayPct}%</div>
                <div className="rr-ring-lbl" style={{ color: theme.color }}>Score</div>
                <div className="rr-ring-emoji">{theme.emoji}</div>
              </div>
            </div>

            {/* VERDICT */}
            <div className="rr-verdict" style={{ background: theme.bg, color: theme.color }}>
              {passed ? "✅ PASSED" : "❌ FAILED"} — {theme.label}
            </div>
            <p className="rr-sub">{theme.sub}</p>

            {/* STATS */}
            <div className="rr-stats">
              <div className="rr-stat">
                <div className="rr-stat-val" style={{ color: T.purple }}>{score}/{total}</div>
                <div className="rr-stat-lbl">Score</div>
              </div>
              <div className="rr-stat">
                <div className="rr-stat-val" style={{ color: T.green }}>{score}</div>
                <div className="rr-stat-lbl">Correct</div>
              </div>
              <div className="rr-stat">
                <div className="rr-stat-val" style={{ color: T.red }}>{total - score}</div>
                <div className="rr-stat-lbl">Wrong</div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="rr-btns">
              <button className="rr-btn-primary" onClick={() => router.push(`/assessment/${id}/review`)}>
                📋 Review My Answers
              </button>
              <div className="rr-btn-row">
                <button className="rr-btn-secondary" onClick={() => router.push(`/assessment/${id}`)}>
                  🔄 Retry
                </button>
                <button className="rr-btn-secondary" onClick={() => router.push("/dashboard")}>
                  ← Back
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}