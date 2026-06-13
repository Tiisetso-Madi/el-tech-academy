"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";

// ─── Palette ────────────────────────────────────────────────────────────────
const T = {
  bg: "linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 50%, #fce7f3 100%)",
  purple: "#7c3aed", purpleBg: "#f3e8ff",
  cyan: "#0891b2",   cyanBg: "#e0f7fa",
  orange: "#ea580c", orangeBg: "#fff7ed",
  green: "#16a34a",  greenBg: "#f0fdf4",
  pink: "#db2777",   pinkBg: "#fdf2f8",
  textPrimary: "#1e1b4b", textSecondary: "#6b7280", textMuted: "#9ca3af",
};

function getScoreColor(pct) {
  if (pct >= 80) return T.green;
  if (pct >= 50) return T.purple;
  return T.orange;
}
function getScoreBg(pct) {
  if (pct >= 80) return T.greenBg;
  if (pct >= 50) return T.purpleBg;
  return T.orangeBg;
}
function today() {
  return new Date().toLocaleDateString("en-ZA", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });
}
function formatClassTime(dt) {
  return new Date(dt).toLocaleString("en-ZA", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}
function daysUntil(dt) {
  const diff = (new Date(dt) - Date.now()) / 86400000;
  if (diff < 0) return null;
  if (diff < 1) return "Today";
  if (diff < 2) return "Tomorrow";
  return `In ${Math.ceil(diff)} days`;
}

// ─── Calendar helpers ───────────────────────────────────────────────────────
function buildCalendar(year, month) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  return { first, days };
}

const MONTH_NAMES = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

// ─── Main ────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    quizzesTaken: 0, avgScore: 0, answersCount: 0, votes: 0, streak: 0,
    assessmentsTaken: 0, avgAssessmentScore: 0,
  });
  const [upcomingClasses, setUpcomingClasses] = useState([]);

  // Calendar state
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profileData } = await supabase
      .from("profiles").select("*").eq("id", user.id).single();
    setProfile(profileData);

    // Quizzes
    const { data: quizzes } = await supabase
      .from("quiz_attempts")
      .select("score, percentage, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });
    const quizzesTaken = quizzes?.length || 0;
    const avgScore = quizzesTaken > 0
      ? Math.round(quizzes.reduce((s, q) => s + (q.percentage || 0), 0) / quizzesTaken) : 0;

    // Assessments
    const { data: assessments } = await supabase
      .from("assessment_attempts")
      .select("score, percentage, completed_at")
      .eq("user_id", user.id);
    const assessmentsTaken = assessments?.length || 0;
    const avgAssessmentScore = assessmentsTaken > 0
      ? Math.round(assessments.reduce((s, a) => s + (parseFloat(a.percentage) || 0), 0) / assessmentsTaken) : 0;

    // Community answers
    const { data: answers } = await supabase
      .from("community_answers").select("id").eq("user_id", user.id);
    const answersCount = answers?.length || 0;

    // Votes
    const { data: votes } = await supabase
      .from("community_answer_votes")
      .select("vote, answer_id, community_answers(user_id)");
    let totalVotes = 0;
    (votes || []).forEach(v => {
      if (v.community_answers?.user_id === user.id) totalVotes += v.vote || 0;
    });

    // Streak — combined quiz + assessment activity
    function calculateCurrentStreak(quizAttempts, assessAttempts) {
      const allDates = [
        ...(quizAttempts || []).map(a => a.completed_at),
        ...(assessAttempts || []).map(a => a.completed_at),
      ];
      if (!allDates.length) return 0;
      const days = [...new Set(allDates.map(d =>
        new Date(d).toISOString().split("T")[0]
      ))].sort((a, b) => new Date(b) - new Date(a));
      let streak = 0;
      let expectedDate = new Date(); expectedDate.setHours(0, 0, 0, 0);
      for (let i = 0; i < days.length; i++) {
        const current = new Date(days[i]); current.setHours(0, 0, 0, 0);
        if (i === 0) {
          const diff = (expectedDate - current) / 86400000;
          if (diff === 0 || diff === 1) { streak = 1; expectedDate = new Date(current); }
          else return 0;
        } else {
          const next = new Date(expectedDate); next.setDate(next.getDate() - 1);
          if (current.getTime() === next.getTime()) { streak++; expectedDate = current; }
          else break;
        }
      }
      return streak;
    }

    // Live classes
    const { data: classes } = await supabase
      .from("live_classes")
      .select("*")
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(5);
    setUpcomingClasses(classes || []);

    setStats({
      quizzesTaken, avgScore, answersCount, votes: totalVotes,
      streak: calculateCurrentStreak(quizzes, assessments),
      assessmentsTaken, avgAssessmentScore,
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif", color: T.textSecondary, fontSize: 14 }}>
          Loading your dashboard…
        </div>
      </AppLayout>
    );
  }

  const firstName = profile?.first_name || "Student";
  const scoreColor = getScoreColor(stats.avgScore);
  const scoreBg = getScoreBg(stats.avgScore);
  const assessColor = getScoreColor(stats.avgAssessmentScore);
  const assessBg = getScoreBg(stats.avgAssessmentScore);

  // Calendar
  const { first, days } = buildCalendar(calYear, calMonth);
  const classDays = new Set(
    upcomingClasses
      .filter(c => {
        const d = new Date(c.start_time);
        return d.getFullYear() === calYear && d.getMonth() === calMonth;
      })
      .map(c => new Date(c.start_time).getDate())
  );
  const todayDate = now.getDate();
  const isCurrentMonth = now.getFullYear() === calYear && now.getMonth() === calMonth;

  return (
    <AppLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .db-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 50%, #fce7f3 100%);
          font-family: 'Inter', system-ui, sans-serif;
          color: #1e1b4b;
        }
        .db-inner { max-width: 1200px; margin: 0 auto; padding: 40px 24px 72px; }

        /* Header */
        .db-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          flex-wrap: wrap; gap: 16px; margin-bottom: 36px;
        }
        .db-eyebrow {
          background: linear-gradient(90deg, #7c3aed, #0891b2);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; margin-bottom: 8px; display: block;
        }
        .db-greeting {
          font-size: 30px; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em;
          background: linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #0891b2 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .db-sub { margin-top: 6px; font-size: 14px; color: #6b7280; }
        .db-date-badge {
          background: white; border: 1px solid #e9d5ff; border-radius: 12px;
          padding: 8px 18px; font-size: 13px; color: #7c3aed; font-weight: 500;
          white-space: nowrap; box-shadow: 0 2px 8px rgba(124,58,237,0.08);
        }

        /* Stat grid — 6 cards */
        .db-stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px; margin-bottom: 24px;
        }
        .db-stat-card {
          background: white; border-radius: 20px; padding: 22px 20px;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 16px rgba(124,58,237,0.08);
          border: 1px solid rgba(233,213,255,0.5);
          transition: transform 0.18s, box-shadow 0.18s; cursor: default;
        }
        .db-stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(124,58,237,0.16); }
        .db-card-icon-wrap {
          width: 42px; height: 42px; border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; margin-bottom: 14px;
        }
        .db-card-label {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 5px;
        }
        .db-card-value { font-size: 30px; font-weight: 800; line-height: 1; letter-spacing: -0.03em; }
        .db-card-sub { margin-top: 7px; font-size: 11px; color: #9ca3af; }
        @keyframes pulse-orange {
          0%,100% { box-shadow: 0 4px 16px rgba(234,88,12,0.1); }
          50% { box-shadow: 0 4px 28px rgba(234,88,12,0.3); }
        }
        .db-streak-pulse { animation: pulse-orange 2.4s ease-in-out infinite; }

        /* Bottom layout: left col (panels) + right col (calendar + classes) */
        .db-bottom {
          display: grid; grid-template-columns: 1fr 380px; gap: 16px; align-items: start;
        }
        @media (max-width: 900px) { .db-bottom { grid-template-columns: 1fr; } }

        .db-left { display: flex; flex-direction: column; gap: 16px; }

        /* Panels */
        .db-panel {
          background: white; border-radius: 20px; padding: 26px;
          box-shadow: 0 4px 16px rgba(124,58,237,0.07);
          border: 1px solid rgba(233,213,255,0.4);
        }
        .db-panel-title { font-size: 15px; font-weight: 700; color: #1e1b4b; margin-bottom: 3px; }
        .db-panel-sub { font-size: 13px; color: #9ca3af; margin-bottom: 20px; }

        /* Score bars */
        .db-score-wrap { margin-bottom: 13px; }
        .db-score-labels {
          display: flex; justify-content: space-between;
          font-size: 12px; color: #6b7280; margin-bottom: 6px;
        }
        .db-score-track { height: 8px; background: #f3f4f6; border-radius: 99px; overflow: hidden; }
        .db-score-fill { height: 100%; border-radius: 99px; transition: width 0.8s cubic-bezier(.4,0,.2,1); }

        /* Tags */
        .db-tag {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 600;
        }

        /* Community rows */
        .db-community-row {
          display: flex; align-items: center; gap: 13px;
          padding: 11px 0; border-bottom: 1px solid #f3f0ff;
        }
        .db-community-icon {
          width: 36px; height: 36px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; flex-shrink: 0;
        }
        .db-community-label { font-size: 13px; color: #6b7280; flex: 1; }
        .db-community-value { font-size: 18px; font-weight: 800; color: #1e1b4b; }

        /* ── RIGHT COLUMN ── */
        .db-right { display: flex; flex-direction: column; gap: 16px; }

        /* Calendar */
        .db-calendar {
          background: white; border-radius: 20px; padding: 22px;
          box-shadow: 0 4px 16px rgba(124,58,237,0.07);
          border: 1px solid rgba(233,213,255,0.4);
        }
        .db-cal-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        .db-cal-title { font-size: 14px; font-weight: 700; color: #1e1b4b; }
        .db-cal-nav {
          background: #f3e8ff; border: none; border-radius: 8px;
          width: 28px; height: 28px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; color: #7c3aed; transition: background 0.15s;
        }
        .db-cal-nav:hover { background: #e9d5ff; }
        .db-cal-grid {
          display: grid; grid-template-columns: repeat(7,1fr); gap: 3px;
          text-align: center;
        }
        .db-cal-dow {
          font-size: 10px; font-weight: 700; color: #9ca3af;
          text-transform: uppercase; padding: 4px 0; letter-spacing: 0.05em;
        }
        .db-cal-day {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 500; color: #374151;
          cursor: default; margin: auto;
          position: relative;
        }
        .db-cal-day.today {
          background: linear-gradient(135deg, #7c3aed, #0891b2);
          color: white; font-weight: 800;
        }
        .db-cal-day.has-class { color: #7c3aed; font-weight: 700; }
        .db-cal-day.has-class::after {
          content: ''; position: absolute; bottom: 3px; left: 50%;
          transform: translateX(-50%);
          width: 4px; height: 4px; border-radius: 50%;
          background: #7c3aed;
        }
        .db-cal-day.today.has-class::after { background: white; }
        .db-cal-day.empty { opacity: 0; pointer-events: none; }

        /* Upcoming classes list */
        .db-classes {
          background: white; border-radius: 20px; padding: 22px;
          box-shadow: 0 4px 16px rgba(124,58,237,0.07);
          border: 1px solid rgba(233,213,255,0.4);
        }
        .db-class-item {
          display: flex; gap: 12px; align-items: flex-start;
          padding: 12px 0; border-bottom: 1px solid #f3f0ff;
        }
        .db-class-item:last-child { border-bottom: none; padding-bottom: 0; }
        .db-class-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #0891b2);
          flex-shrink: 0; margin-top: 4px;
        }
        .db-class-title { font-size: 13px; font-weight: 700; color: #1e1b4b; margin-bottom: 3px; }
        .db-class-time { font-size: 11px; color: #9ca3af; margin-bottom: 5px; }
        .db-class-badge {
          display: inline-block; font-size: 10px; font-weight: 700;
          padding: 2px 8px; border-radius: 99px;
          background: #f3e8ff; color: #7c3aed;
        }
        .db-join-btn {
          margin-left: auto; flex-shrink: 0;
          display: inline-flex; align-items: center; gap: 4px;
          padding: 6px 12px; border-radius: 8px;
          background: linear-gradient(135deg, #7c3aed, #0891b2);
          color: white; font-size: 11px; font-weight: 700;
          text-decoration: none; border: none; cursor: pointer;
          transition: opacity 0.15s;
        }
        .db-join-btn:hover { opacity: 0.85; }
        .db-no-classes {
          text-align: center; padding: 24px 0;
          font-size: 13px; color: #9ca3af;
        }
        .db-no-classes-icon { font-size: 28px; margin-bottom: 8px; }
      `}</style>

      <div className="db-root">
        <div className="db-inner">

          {/* HEADER */}
          <div className="db-header">
            <div>
              <span className="db-eyebrow">Dashboard</span>
              <h1 className="db-greeting">Welcome back, {firstName} 👋</h1>
              <p className="db-sub">Here's where you stand today — keep the momentum going.</p>
            </div>
            <div className="db-date-badge">{today()}</div>
          </div>

          {/* 6 STAT CARDS */}
          <div className="db-stat-grid">

            <div className="db-stat-card">
              <div className="db-card-icon-wrap" style={{ background: T.purpleBg }}>📝</div>
              <div className="db-card-label">Quizzes Taken</div>
              <div className="db-card-value" style={{ color: T.purple }}>{stats.quizzesTaken}</div>
              <div className="db-card-sub">total attempts</div>
            </div>

            <div className="db-stat-card">
              <div className="db-card-icon-wrap" style={{ background: scoreBg }}>🎯</div>
              <div className="db-card-label">Quiz Avg Score</div>
              <div className="db-card-value" style={{ color: scoreColor }}>{stats.avgScore}%</div>
              <div className="db-card-sub">{stats.avgScore >= 80 ? "Excellent!" : stats.avgScore >= 50 ? "Keep pushing" : "Room to grow"}</div>
            </div>

            <div className="db-stat-card">
              <div className="db-card-icon-wrap" style={{ background: T.pinkBg }}>📊</div>
              <div className="db-card-label">Assessments</div>
              <div className="db-card-value" style={{ color: T.pink }}>{stats.assessmentsTaken}</div>
              <div className="db-card-sub">completed</div>
            </div>

            <div className="db-stat-card">
              <div className="db-card-icon-wrap" style={{ background: assessBg }}>🏆</div>
              <div className="db-card-label">Assess. Avg</div>
              <div className="db-card-value" style={{ color: assessColor }}>{stats.avgAssessmentScore}%</div>
              <div className="db-card-sub">{stats.avgAssessmentScore >= 80 ? "Outstanding!" : stats.avgAssessmentScore >= 50 ? "Good effort" : "Keep practising"}</div>
            </div>

            <div className="db-stat-card">
              <div className="db-card-icon-wrap" style={{ background: T.cyanBg }}>💬</div>
              <div className="db-card-label">Answers Given</div>
              <div className="db-card-value" style={{ color: T.cyan }}>{stats.answersCount}</div>
              <div className="db-card-sub">community contributions</div>
            </div>

            <div className={`db-stat-card${stats.streak > 0 ? " db-streak-pulse" : ""}`}>
              <div className="db-card-icon-wrap" style={{ background: T.orangeBg }}>🔥</div>
              <div className="db-card-label">Day Streak</div>
              <div className="db-card-value" style={{ color: T.orange }}>{stats.streak}</div>
              <div className="db-card-sub">{stats.streak > 0 ? "days in a row 🔥" : "Start one today!"}</div>
            </div>

          </div>

          {/* BOTTOM: panels left, calendar+classes right */}
          <div className="db-bottom">

            {/* LEFT */}
            <div className="db-left">

              {/* Performance */}
              <div className="db-panel">
                <div className="db-panel-title">Performance Overview</div>
                <div className="db-panel-sub">Quizzes vs assessments at a glance</div>
                {[
                  { label: "Quiz Average", pct: stats.avgScore, color: scoreColor },
                  { label: "Assessment Average", pct: stats.avgAssessmentScore, color: T.pink },
                  { label: "Completion Rate", pct: Math.min(100, (stats.quizzesTaken + stats.assessmentsTaken) * 5), color: T.purple },
                  { label: "Community Activity", pct: Math.min(100, stats.answersCount * 5), color: T.cyan },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="db-score-wrap">
                    <div className="db-score-labels">
                      <span>{label}</span>
                      <span style={{ color, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div className="db-score-track">
                      <div className="db-score-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { label: `${stats.quizzesTaken} quizzes`, color: T.purple, bg: T.purpleBg },
                    { label: `${stats.assessmentsTaken} assessments`, color: T.pink, bg: T.pinkBg },
                    { label: `${stats.avgScore}% quiz avg`, color: scoreColor, bg: scoreBg },
                    ...(stats.streak > 0 ? [{ label: `🔥 ${stats.streak}d streak`, color: T.orange, bg: T.orangeBg }] : []),
                  ].map(({ label, color, bg }) => (
                    <span key={label} className="db-tag" style={{ background: bg, color }}>{label}</span>
                  ))}
                </div>
              </div>

              {/* Community */}
              <div className="db-panel">
                <div className="db-panel-title">Community Impact</div>
                <div className="db-panel-sub">Your contributions and recognition</div>
                {[
                  { icon: "💬", bg: T.purpleBg, label: "Answers submitted", value: stats.answersCount },
                  { icon: "👍", bg: T.cyanBg, label: "Net votes received", value: stats.votes },
                  { icon: "🔥", bg: T.orangeBg, label: "Current streak", value: `${stats.streak}d` },
                ].map(({ icon, bg, label, value }) => (
                  <div key={label} className="db-community-row">
                    <div className="db-community-icon" style={{ background: bg }}>{icon}</div>
                    <div className="db-community-label">{label}</div>
                    <div className="db-community-value">{value}</div>
                  </div>
                ))}
                <div style={{ marginTop: 16, padding: "14px 16px", background: "linear-gradient(135deg,#f3e8ff,#e0f7fa)", borderRadius: 12, border: "1px solid #e9d5ff" }}>
                  <div style={{ fontSize: 13, color: T.purple, fontWeight: 700, marginBottom: 4 }}>
                    {stats.answersCount >= 10 ? "🌟 Active contributor" : "Start contributing!"}
                  </div>
                  <div style={{ fontSize: 12, color: T.textSecondary }}>
                    {stats.answersCount >= 10
                      ? "You're helping other learners. Keep it up!"
                      : "Answer a question in the community section to earn recognition."}
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT */}
            <div className="db-right">

              {/* Mini Calendar */}
              <div className="db-calendar">
                <div className="db-cal-header">
                  <button className="db-cal-nav" onClick={() => {
                    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                    else setCalMonth(m => m - 1);
                  }}>‹</button>
                  <span className="db-cal-title">{MONTH_NAMES[calMonth]} {calYear}</span>
                  <button className="db-cal-nav" onClick={() => {
                    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                    else setCalMonth(m => m + 1);
                  }}>›</button>
                </div>

                <div className="db-cal-grid">
                  {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                    <div key={d} className="db-cal-dow">{d}</div>
                  ))}
                  {/* Empty cells */}
                  {Array.from({ length: first }).map((_, i) => (
                    <div key={`e${i}`} className="db-cal-day empty">-</div>
                  ))}
                  {/* Day cells */}
                  {Array.from({ length: days }).map((_, i) => {
                    const day = i + 1;
                    const isToday = isCurrentMonth && day === todayDate;
                    const hasClass = classDays.has(day);
                    return (
                      <div
                        key={day}
                        className={`db-cal-day${isToday ? " today" : ""}${hasClass ? " has-class" : ""}`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>

                {classDays.size > 0 && (
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.purple }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.purple, display: "inline-block" }} />
                    {classDays.size} class{classDays.size !== 1 ? "es" : ""} this month
                  </div>
                )}
              </div>

              {/* Upcoming classes */}
              <div className="db-classes">
                <div className="db-panel-title" style={{ marginBottom: 4 }}>📅 Upcoming Classes</div>
                <div className="db-panel-sub">Free live sessions this week</div>

                {upcomingClasses.length === 0 ? (
                  <div className="db-no-classes">
                    <div className="db-no-classes-icon">📭</div>
                    No upcoming classes scheduled
                  </div>
                ) : (
                  upcomingClasses.map((cls) => {
                    const badge = daysUntil(cls.start_time);
                    return (
                      <div key={cls.id} className="db-class-item">
                        <div className="db-class-dot" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="db-class-title">{cls.title}</div>
                          <div className="db-class-time">🕐 {formatClassTime(cls.start_time)}</div>
                          {badge && <span className="db-class-badge">{badge}</span>}
                        </div>
                        <a
                          href={cls.join_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="db-join-btn"
                        >
                          Join →
                        </a>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}