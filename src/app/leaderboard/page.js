"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";

const T = {
  purple: "#7c3aed", purpleBg: "#f3e8ff", purpleBorder: "#e9d5ff",
  cyan: "#0891b2",   cyanBg: "#e0f7fa",
  orange: "#ea580c", orangeBg: "#fff7ed",
  green: "#16a34a",  greenBg: "#f0fdf4",
  gold: "#ca8a04",   goldBg: "#fefce8",
  pink: "#db2777",   pinkBg: "#fdf2f8",
  textPrimary: "#1e1b4b", textSecondary: "#6b7280", textMuted: "#9ca3af",
};

const MEDALS = ["🥇", "🥈", "🥉"];
const AVATAR_COLORS = [T.purple, T.cyan, T.orange, T.green, T.pink, "#8b5cf6", "#0891b2", "#059669"];

function avatarColor(id) {
  let hash = 0;
  for (let c of (id || "")) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(name) {
  if (!name || name === "Learner") return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}
function scoreColor(avg) {
  if (avg >= 80) return T.green;
  if (avg >= 60) return T.cyan;
  if (avg >= 50) return T.orange;
  return "#dc2626";
}

// ── Rank helper ─────────────────────────────────────────────────────────────
function buildRanked(rows) {
  const map = {};
  rows.forEach(a => {
    if (!map[a.user_id]) map[a.user_id] = { user_id: a.user_id, total: 0, count: 0 };
    map[a.user_id].total += Number(a.percentage || 0);
    map[a.user_id].count += 1;
  });
  return Object.values(map)
    .map(u => ({ ...u, avg: Math.round(u.total / u.count) }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
    .map((u, i) => ({ ...u, rank: i + 1 }));
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [myGrade, setMyGrade] = useState(null);

  // Tab: global | grade | subject | topic
  const [tab, setTab] = useState("global");
  const [gradeFilter, setGradeFilter]     = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [topicFilter, setTopicFilter]     = useState("all");

  // Data
  const [allAttempts, setAllAttempts] = useState([]); // raw, enriched
  const [profiles, setProfiles]       = useState({});
  const [grades, setGrades]           = useState([]);
  const [subjects, setSubjects]       = useState([]);
  const [topics, setTopics]           = useState([]);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Subjects + topics
    const { data: s } = await supabase.from("subjects").select("*").order("name");
    const { data: t } = await supabase.from("topics").select("*").order("name");
    setSubjects(s || []);
    setTopics(t || []);

    // All quiz attempts with topic/subject chain
    const { data: attempts, error } = await supabase
      .from("quiz_attempts")
      .select(`
        user_id, percentage,
        quizzes (
          topics (
            id, name,
            subjects ( id, name )
          )
        )
      `);
    if (error) { console.log(error); setLoading(false); return; }

    // Profiles (with grade field)
    const userIds = [...new Set((attempts || []).map(a => a.user_id))];
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, grade")
      .in("id", userIds);

    const profileMap = {};
    const gradeSet = new Set();
    (profileData || []).forEach(p => {
      profileMap[p.id] = p;
      if (p.grade) gradeSet.add(p.grade);
    });
    setProfiles(profileMap);

    // My grade (for default tab)
    const myProfile = profileMap[user.id];
    if (myProfile?.grade) {
      setMyGrade(myProfile.grade);
      setGradeFilter(myProfile.grade); // default to your own grade
    }

    // Sorted grade list
    const sortedGrades = [...gradeSet].sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, ""));
      const nb = parseInt(b.replace(/\D/g, ""));
      return na - nb;
    });
    setGrades(sortedGrades);

    setAllAttempts(attempts || []);
    setLoading(false);
  }

  function displayName(uid) {
    const p = profiles[uid];
    if (!p) return "Learner";
    return `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Learner";
  }

  // ── Build current leaderboard list ──────────────────────────────────────
  function getCurrentList() {
    let rows = allAttempts;

    // Grade filter always applies (unless "all")
    const activeGrade = tab === "grade" ? gradeFilter : "all";
    if (activeGrade !== "all") {
      rows = rows.filter(a => profiles[a.user_id]?.grade === activeGrade);
    }

    if (tab === "subject" && subjectFilter !== "all") {
      rows = rows.filter(a => a.quizzes?.topics?.subjects?.id === subjectFilter);
    }
    if (tab === "topic" && topicFilter !== "all") {
      rows = rows.filter(a => a.quizzes?.topics?.id === topicFilter);
    }

    return buildRanked(rows);
  }

  const currentList  = getCurrentList();
  const top10        = currentList.slice(0, 10);
  const userEntry    = currentList.find(u => u.user_id === userId);
  const userInTop10  = top10.some(u => u.user_id === userId);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout>
        <style>{`
          .lb-root{min-height:100vh;background:linear-gradient(135deg,#f3e8ff 0%,#e0f2fe 50%,#fce7f3 100%);font-family:'Inter',system-ui,sans-serif;padding:48px 24px}
          .lb-sk{background:linear-gradient(90deg,#f3f0ff 25%,#ede9fe 50%,#f3f0ff 75%);background-size:200% 100%;animation:sh 1.4s infinite;border-radius:14px}
          @keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}
        `}</style>
        <div className="lb-root">
          <div style={{maxWidth:820,margin:"0 auto",display:"flex",flexDirection:"column",gap:14}}>
            <div className="lb-sk" style={{height:48,width:280}} />
            <div className="lb-sk" style={{height:44}} />
            <div className="lb-sk" style={{height:140}} />
            {[...Array(6)].map((_,i)=><div key={i} className="lb-sk" style={{height:66,animationDelay:`${i*0.07}s`}}/>)}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .lb-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 50%, #fce7f3 100%);
          font-family: 'Inter', system-ui, sans-serif;
          color: #1e1b4b; padding: 48px 24px 80px;
        }
        .lb-inner { max-width: 820px; margin: 0 auto; }

        .lb-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          background: linear-gradient(90deg,#7c3aed,#0891b2);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px;
        }
        .lb-title {
          font-size: clamp(26px,3.5vw,38px); font-weight: 800; letter-spacing: -0.02em;
          background: linear-gradient(135deg,#7c3aed 0%,#db2777 50%,#0891b2 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 6px;
        }
        .lb-sub { font-size: 14px; color: #6b7280; margin-bottom: 32px; }

        /* ── Podium ── */
        .lb-podium { display:flex; align-items:flex-end; justify-content:center; gap:10px; margin-bottom:36px; }
        .lb-podium-item { display:flex; flex-direction:column; align-items:center; flex:1; max-width:150px; }
        .lb-podium-avatar {
          width:50px; height:50px; border-radius:15px;
          display:flex; align-items:center; justify-content:center;
          font-size:17px; font-weight:800; color:white;
          margin-bottom:8px; position:relative;
          box-shadow:0 4px 14px rgba(0,0,0,0.15);
        }
        .lb-podium-medal { position:absolute; top:-10px; right:-8px; font-size:17px; }
        .lb-podium-name {
          font-size:12px; font-weight:700; color:#1e1b4b; margin-bottom:4px;
          text-align:center; white-space:nowrap; overflow:hidden;
          text-overflow:ellipsis; max-width:120px;
        }
        .lb-podium-pct { font-size:13px; font-weight:800; margin-bottom:8px; }
        .lb-podium-block {
          width:100%; border-radius:12px 12px 0 0;
          display:flex; align-items:center; justify-content:center;
          font-size:18px; font-weight:800; color:rgba(255,255,255,0.85); padding:10px 0;
        }

        /* ── Tabs ── */
        .lb-tabs {
          display:flex; gap:0; background:white; border-radius:14px;
          padding:4px; margin-bottom:16px;
          box-shadow:0 2px 10px rgba(124,58,237,0.08);
          border:1px solid #e9d5ff;
        }
        .lb-tab {
          flex:1; padding:9px 10px; border-radius:10px; border:none;
          font-size:12px; font-weight:600; cursor:pointer;
          background:transparent; color:#9ca3af; transition:all 0.15s; text-align:center;
        }
        .lb-tab.active { background:linear-gradient(135deg,#7c3aed,#0891b2); color:white; box-shadow:0 2px 10px rgba(124,58,237,0.28); }
        .lb-tab:hover:not(.active) { color:#7c3aed; background:#f3e8ff; }

        /* ── Info banner ── */
        .lb-info {
          background:white; border:1.5px solid #e9d5ff; border-radius:14px;
          padding:14px 18px; margin-bottom:16px; font-size:13px; color:#6b7280;
          line-height:1.6;
        }
        .lb-info strong { color:#7c3aed; }

        /* ── Sub-filters ── */
        .lb-subfilter { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
        .lb-sf-btn {
          padding:6px 14px; border-radius:99px; border:1.5px solid #e9d5ff;
          font-size:12px; font-weight:600; cursor:pointer;
          background:white; color:#6b7280; transition:all 0.15s;
          white-space:nowrap;
        }
        .lb-sf-btn.active { background:#7c3aed; border-color:#7c3aed; color:white; }
        .lb-sf-btn:hover:not(.active) { border-color:#7c3aed; color:#7c3aed; }

        /* ── Grade badge (inside sub-filter area) ── */
        .lb-grade-badge {
          display:inline-flex; align-items:center; gap:6px;
          background:linear-gradient(135deg,#f3e8ff,#e0f7fa);
          border:1.5px solid #c4b5fd; border-radius:10px;
          padding:8px 14px; font-size:13px; font-weight:700; color:#7c3aed;
          margin-bottom:16px;
        }

        /* ── List ── */
        .lb-list { display:flex; flex-direction:column; gap:8px; }
        .lb-row {
          background:white; border-radius:16px; padding:14px 18px;
          display:flex; align-items:center; gap:12px;
          box-shadow:0 2px 10px rgba(124,58,237,0.06);
          border:1.5px solid #f3f0ff;
          transition:transform 0.15s, box-shadow 0.15s, border-color 0.15s;
        }
        .lb-row:hover { transform:translateX(3px); box-shadow:0 4px 18px rgba(124,58,237,0.12); border-color:#e9d5ff; }
        .lb-row.is-you { background:linear-gradient(135deg,#f3e8ff,#e0f7fa); border-color:#c4b5fd; }
        .lb-row.top-3 { border-color:#fef08a; }

        .lb-rank { width:32px; text-align:center; font-size:17px; font-weight:800; flex-shrink:0; }
        .lb-rank-num { font-size:13px; color:#9ca3af; font-weight:700; }
        .lb-avatar {
          width:38px; height:38px; border-radius:11px;
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; color:white; flex-shrink:0;
        }
        .lb-name-wrap { flex:1; min-width:0; }
        .lb-name { font-size:14px; font-weight:700; color:#1e1b4b; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
        .lb-you-tag { font-size:9px; font-weight:700; padding:2px 7px; border-radius:99px; background:#f3e8ff; color:#7c3aed; }
        .lb-grade-tag { font-size:9px; font-weight:600; padding:2px 7px; border-radius:99px; background:#e0f7fa; color:#0891b2; }
        .lb-sub-name { font-size:11px; color:#9ca3af; margin-top:1px; }

        .lb-bar-wrap { flex:1; max-width:100px; }
        .lb-bar-track { height:5px; background:#f3f0ff; border-radius:99px; overflow:hidden; }
        .lb-bar-fill { height:100%; border-radius:99px; transition:width 0.8s cubic-bezier(.4,0,.2,1); }

        .lb-attempts { font-size:11px; color:#9ca3af; flex-shrink:0; white-space:nowrap; }
        .lb-score { font-size:16px; font-weight:800; flex-shrink:0; min-width:50px; text-align:right; }

        /* ── Your rank ── */
        .lb-your-rank {
          margin-top:14px; padding:14px 18px;
          background:linear-gradient(135deg,#f3e8ff,#e0f7fa);
          border-radius:14px; border:1.5px solid #c4b5fd;
          display:flex; align-items:center; gap:12px;
          box-shadow:0 4px 14px rgba(124,58,237,0.1);
        }

        /* ── Empty ── */
        .lb-empty {
          background:white; border-radius:18px; text-align:center;
          padding:48px 24px; box-shadow:0 2px 10px rgba(124,58,237,0.06);
          border:1.5px solid #f3f0ff;
        }
      `}</style>

      <div className="lb-root">
        <div className="lb-inner">

          {/* HEADER */}
          <div className="lb-eyebrow">Rankings</div>
          <h1 className="lb-title">🏆 Leaderboard</h1>
          <p className="lb-sub">See how you rank — globally, by grade, subject or topic</p>

          {/* PODIUM */}
          {top10.length >= 3 && (() => {
            const order = [top10[1], top10[0], top10[2]];
            const heights = [96, 128, 76];
            const gradients = [
              "linear-gradient(135deg,#9ca3af,#6b7280)",
              "linear-gradient(135deg,#ca8a04,#f59e0b)",
              "linear-gradient(135deg,#ea580c,#fb923c)",
            ];
            return (
              <div className="lb-podium">
                {order.map((u, i) => {
                  const color = avatarColor(u.user_id);
                  const name = u.user_id === userId ? "You" : displayName(u.user_id);
                  const sc = scoreColor(u.avg);
                  return (
                    <div key={u.user_id} className="lb-podium-item">
                      <div className="lb-podium-avatar" style={{ background: u.user_id === userId ? T.purple : color }}>
                        {initials(name)}
                        <span className="lb-podium-medal">{MEDALS[u.rank - 1]}</span>
                      </div>
                      <div className="lb-podium-name">{name}</div>
                      <div className="lb-podium-pct" style={{ color: sc }}>{u.avg}%</div>
                      <div className="lb-podium-block" style={{ height: heights[i], background: gradients[i] }}>#{u.rank}</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* TABS */}
          <div className="lb-tabs">
            {[
              ["global",  "🌍 Global"],
              ["grade",   "🎓 By Grade"],
              ["subject", "📚 By Subject"],
              ["topic",   "📖 By Topic"],
            ].map(([val, label]) => (
              <button key={val} className={`lb-tab${tab === val ? " active" : ""}`} onClick={() => setTab(val)}>
                {label}
              </button>
            ))}
          </div>

          {/* INFO BANNERS per tab */}
          {tab === "global" && (
            <div className="lb-info">
              <strong>Global</strong> — all learners ranked by average quiz score across every subject and topic.
            </div>
          )}
          {tab === "grade" && (
            <div className="lb-info">
              <strong>By Grade</strong> — compete only against learners in the same grade as you. Select your grade below.
              {myGrade && <> Your grade: <strong>{myGrade}</strong>.</>}
            </div>
          )}
          {tab === "subject" && (
            <div className="lb-info">
              <strong>By Subject</strong> — see who leads in a specific subject. Only attempts in the selected subject count.
            </div>
          )}
          {tab === "topic" && (
            <div className="lb-info">
              <strong>By Topic</strong> — drill down to a single topic to find the top performer in that specific area.
            </div>
          )}

          {/* GRADE FILTER */}
          {tab === "grade" && (
            <>
              {myGrade && (
                <div className="lb-grade-badge">🎓 Your grade: {myGrade}</div>
              )}
              <div className="lb-subfilter">
                <button className={`lb-sf-btn${gradeFilter === "all" ? " active" : ""}`} onClick={() => setGradeFilter("all")}>All Grades</button>
                {grades.map(g => (
                  <button key={g} className={`lb-sf-btn${gradeFilter === g ? " active" : ""}`} onClick={() => setGradeFilter(g)}>
                    {g} {g === myGrade ? "⭐" : ""}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* SUBJECT FILTER */}
          {tab === "subject" && (
            <div className="lb-subfilter">
              <button className={`lb-sf-btn${subjectFilter === "all" ? " active" : ""}`} onClick={() => setSubjectFilter("all")}>All</button>
              {subjects.map(s => (
                <button key={s.id} className={`lb-sf-btn${subjectFilter === s.id ? " active" : ""}`} onClick={() => setSubjectFilter(s.id)}>{s.name}</button>
              ))}
            </div>
          )}

          {/* TOPIC FILTER */}
          {tab === "topic" && (
            <div className="lb-subfilter">
              <button className={`lb-sf-btn${topicFilter === "all" ? " active" : ""}`} onClick={() => setTopicFilter("all")}>All</button>
              {topics.map(t => (
                <button key={t.id} className={`lb-sf-btn${topicFilter === t.id ? " active" : ""}`} onClick={() => setTopicFilter(t.id)}>{t.name}</button>
              ))}
            </div>
          )}

          {/* LIST */}
          {top10.length === 0 ? (
            <div className="lb-empty">
              <div style={{ fontSize: 38, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, marginBottom: 6 }}>No data for this filter</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>Try a different grade, subject or topic — or complete more quizzes!</div>
            </div>
          ) : (
            <div className="lb-list">
              {top10.map((u) => {
                const isYou   = u.user_id === userId;
                const isTop   = u.rank <= 3;
                const color   = avatarColor(u.user_id);
                const name    = isYou ? "You" : displayName(u.user_id);
                const sc      = scoreColor(u.avg);
                const grade   = profiles[u.user_id]?.grade;

                return (
                  <div key={u.user_id} className={`lb-row${isYou ? " is-you" : ""}${isTop ? " top-3" : ""}`}>
                    <div className="lb-rank">
                      {isTop ? MEDALS[u.rank - 1] : <span className="lb-rank-num">#{u.rank}</span>}
                    </div>
                    <div className="lb-avatar" style={{ background: isYou ? T.purple : color }}>
                      {initials(name)}
                    </div>
                    <div className="lb-name-wrap">
                      <div className="lb-name">
                        {name}
                        {isYou && <span className="lb-you-tag">YOU</span>}
                        {grade && tab !== "grade" && <span className="lb-grade-tag">{grade}</span>}
                      </div>
                      <div className="lb-sub-name">{u.count} attempt{u.count !== 1 ? "s" : ""}</div>
                    </div>
                    <div className="lb-bar-wrap">
                      <div className="lb-bar-track">
                        <div className="lb-bar-fill" style={{ width: `${u.avg}%`, background: sc }} />
                      </div>
                    </div>
                    <div className="lb-score" style={{ color: sc }}>{u.avg}%</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* YOUR RANK (if outside top 10) */}
          {userEntry && !userInTop10 && (
            <div className="lb-your-rank">
              <div className="lb-avatar" style={{ background: T.purple, width: 42, height: 42, borderRadius: 12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"white", flexShrink:0 }}>
                {initials("You")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: T.purple, fontWeight: 700, marginBottom: 2 }}>Your Position</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary }}>
                  Rank #{userEntry.rank} — {userEntry.avg}%
                  <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500, marginLeft: 8 }}>
                    ({userEntry.count} attempt{userEntry.count !== 1 ? "s" : ""})
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: T.purple, fontWeight: 600, flexShrink: 0 }}>
                {userEntry.rank - 10} from top 10
              </div>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}