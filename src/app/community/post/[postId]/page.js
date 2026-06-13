"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";

export default function DiscussionThread() {
  const { postId } = useParams();
  const router = useRouter();

  const [post, setPost] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [answerText, setAnswerText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [votingId, setVotingId] = useState(null);

  useEffect(() => {
    if (postId) loadThread();
  }, [postId]);

  async function loadThread() {
    setLoading(true);

    const { data: postData } = await supabase
      .from("community_posts").select("*").eq("id", postId).single();
    setPost(postData);

    const { data: answersData, error: answersError } = await supabase
      .from("community_answers").select("*").eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (answersError) { console.log("ANSWERS ERROR:", answersError); setLoading(false); return; }

    const userIds = [...new Set((answersData || []).map(a => a.user_id))];
    const { data: profiles } = await supabase
      .from("profiles").select("id, first_name, last_name").in("id", userIds);
    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = `${p.first_name} ${p.last_name}`; });

    const { data: votesData } = await supabase.from("community_answer_votes").select("*");
    const votesMap = {};
    (votesData || []).forEach(v => { votesMap[v.answer_id] = (votesMap[v.answer_id] || 0) + v.vote; });

    const enriched = (answersData || []).map(a => ({
      ...a,
      full_name: profileMap[a.user_id] || "Anonymous",
      score: votesMap[a.id] || 0,
    }));

    setAnswers(enriched);
    setLoading(false);
  }

  async function addAnswer() {
    if (!answerText.trim()) return;
    setPosting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPosting(false); return; }
    await supabase.from("community_answers").insert({ post_id: postId, user_id: user.id, content: answerText });
    setAnswerText("");
    setPosting(false);
    loadThread();
  }

  async function vote(answerId, value) {
    setVotingId(answerId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setVotingId(null); return; }
    const { data: existing } = await supabase
      .from("community_answer_votes").select("*")
      .eq("answer_id", answerId).eq("user_id", user.id).maybeSingle();
    if (existing) {
      await supabase.from("community_answer_votes").update({ vote: value }).eq("id", existing.id);
    } else {
      await supabase.from("community_answer_votes").insert({ answer_id: answerId, user_id: user.id, vote: value });
    }
    setVotingId(null);
    loadThread();
  }

  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function getInitials(name) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }

  const AVATAR_COLORS = ["#7c3aed", "#0891b2", "#ea580c", "#16a34a", "#db2777", "#ca8a04"];
  function avatarColor(name) {
    let hash = 0;
    for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  if (loading) {
    return (
      <AppLayout>
        <style>{`
          .dt-root { min-height:100vh; background: linear-gradient(135deg,#f3e8ff 0%,#e0f2fe 50%,#fce7f3 100%); font-family:'Inter',system-ui,sans-serif; padding:48px 24px; }
          .dt-skeleton { background:linear-gradient(90deg,#f3f0ff 25%,#ede9fe 50%,#f3f0ff 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:20px; }
          @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        `}</style>
        <div className="dt-root">
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="dt-skeleton" style={{ height: 40, width: 80 }} />
            <div className="dt-skeleton" style={{ height: 160 }} />
            <div className="dt-skeleton" style={{ height: 120 }} />
            <div className="dt-skeleton" style={{ height: 100 }} />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f3e8ff,#e0f2fe,#fce7f3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif" }}>
          <div style={{ background: "white", borderRadius: 20, padding: "48px 32px", textAlign: "center", boxShadow: "0 4px 24px rgba(124,58,237,0.1)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b", marginBottom: 8 }}>Discussion not found</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24 }}>This post may have been removed.</div>
            <button onClick={() => router.back()} style={{ padding: "10px 24px", borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#0891b2)", color: "white", fontWeight: 700, border: "none", cursor: "pointer" }}>Go Back</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .dt-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 50%, #fce7f3 100%);
          font-family: 'Inter', system-ui, sans-serif;
          padding: 40px 24px 72px;
        }
        .dt-inner { max-width: 760px; margin: 0 auto; }

        /* Back */
        .dt-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; color: #7c3aed;
          background: white; border: 1.5px solid #e9d5ff;
          border-radius: 10px; padding: 7px 14px; cursor: pointer;
          margin-bottom: 28px; border: none;
          box-shadow: 0 2px 8px rgba(124,58,237,0.08);
          transition: background 0.15s, transform 0.15s;
        }
        .dt-back:hover { background: #f3e8ff; transform: translateX(-2px); }

        /* Post card */
        .dt-post {
          background: white; border-radius: 20px;
          border: 1.5px solid #e9d5ff;
          box-shadow: 0 4px 20px rgba(124,58,237,0.09);
          padding: 32px; margin-bottom: 20px;
          position: relative; overflow: hidden;
        }
        .dt-post::before {
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #7c3aed, #0891b2);
          border-radius: 20px 20px 0 0;
        }
        .dt-post-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: #f3e8ff; color: #7c3aed;
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 4px 12px;
          border-radius: 99px; margin-bottom: 14px;
        }
        .dt-post-title {
          font-size: clamp(20px, 3vw, 26px); font-weight: 800;
          color: #1e1b4b; letter-spacing: -0.02em;
          margin-bottom: 14px; line-height: 1.3;
        }
        .dt-post-body {
          font-size: 15px; color: #374151;
          line-height: 1.75; white-space: pre-line;
        }
        .dt-post-meta {
          display: flex; align-items: center; gap: 16px;
          margin-top: 20px; padding-top: 16px;
          border-top: 1px solid #f3f0ff;
          font-size: 12px; color: #9ca3af;
        }

        /* Answer box */
        .dt-answer-box {
          background: white; border-radius: 20px;
          border: 1.5px solid #e9d5ff;
          box-shadow: 0 4px 16px rgba(124,58,237,0.07);
          padding: 24px; margin-bottom: 28px;
        }
        .dt-answer-box-title {
          font-size: 14px; font-weight: 700; color: #1e1b4b;
          margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
        }
        .dt-textarea {
          width: 100%; border: 1.5px solid #e9d5ff;
          border-radius: 12px; padding: 14px 16px;
          font-size: 14px; color: #1e1b4b;
          font-family: 'Inter', system-ui, sans-serif;
          outline: none; resize: vertical; min-height: 100px;
          background: #faf8ff; box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
          margin-bottom: 14px;
        }
        .dt-textarea:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
          background: white;
        }
        .dt-textarea::placeholder { color: #c4b5fd; }
        .dt-submit-btn {
          padding: 11px 28px; border-radius: 12px;
          background: linear-gradient(135deg, #16a34a, #0891b2);
          color: white; font-weight: 700; font-size: 14px;
          border: none; cursor: pointer;
          box-shadow: 0 4px 14px rgba(22,163,74,0.25);
          transition: opacity 0.15s, transform 0.15s;
        }
        .dt-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .dt-submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }

        /* Answers section */
        .dt-answers-header {
          font-size: 15px; font-weight: 700; color: #1e1b4b;
          margin-bottom: 16px; display: flex; align-items: center; gap: 10px;
        }
        .dt-answers-count {
          background: #f3e8ff; color: #7c3aed;
          font-size: 12px; font-weight: 700;
          padding: 3px 10px; border-radius: 99px;
        }
        .dt-feed { display: flex; flex-direction: column; gap: 14px; }

        /* Answer card */
        .dt-answer-card {
          background: white; border-radius: 18px;
          border: 1.5px solid #f3f0ff;
          box-shadow: 0 2px 12px rgba(124,58,237,0.06);
          padding: 22px 24px;
          transition: box-shadow 0.18s;
        }
        .dt-answer-card:hover { box-shadow: 0 6px 20px rgba(124,58,237,0.12); }

        /* Top-answer highlight */
        .dt-answer-card.top-answer {
          border-color: #bbf7d0;
          box-shadow: 0 2px 16px rgba(22,163,74,0.1);
        }
        .dt-top-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: #f0fdf4; color: #16a34a;
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 3px 10px;
          border-radius: 99px; margin-bottom: 12px;
        }

        .dt-answer-author {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 12px;
        }
        .dt-avatar {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; color: white; flex-shrink: 0;
        }
        .dt-author-name { font-size: 13px; font-weight: 700; color: #1e1b4b; }
        .dt-author-time { font-size: 11px; color: #9ca3af; }

        .dt-answer-body {
          font-size: 14px; color: #374151;
          line-height: 1.72; white-space: pre-line;
          margin-bottom: 16px;
        }

        /* Vote bar */
        .dt-vote-bar {
          display: flex; align-items: center; gap: 10px;
          padding-top: 14px; border-top: 1px solid #f3f0ff;
        }
        .dt-vote-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 14px; border-radius: 10px;
          font-size: 13px; font-weight: 600;
          border: none; cursor: pointer;
          transition: transform 0.15s, opacity 0.15s;
        }
        .dt-vote-btn:hover:not(:disabled) { transform: scale(1.06); }
        .dt-vote-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .dt-vote-up { background: #f0fdf4; color: #16a34a; }
        .dt-vote-down { background: #fef2f2; color: #dc2626; }
        .dt-score {
          font-size: 13px; font-weight: 700; margin-left: 4px;
          padding: 5px 12px; border-radius: 99px;
        }

        /* Empty */
        .dt-empty {
          background: white; border-radius: 18px;
          border: 1.5px solid #f3f0ff; text-align: center;
          padding: 48px 24px;
          box-shadow: 0 2px 12px rgba(124,58,237,0.05);
        }
        .dt-empty-icon { font-size: 36px; margin-bottom: 12px; }
        .dt-empty-title { font-size: 16px; font-weight: 700; color: #1e1b4b; margin-bottom: 6px; }
        .dt-empty-sub { font-size: 13px; color: #9ca3af; }
      `}</style>

      <div className="dt-root">
        <div className="dt-inner">

          {/* BACK */}
          <button className="dt-back" onClick={() => router.back()}>← Back</button>

          {/* POST */}
          <div className="dt-post">
            <div className="dt-post-badge">💬 Discussion</div>
            <div className="dt-post-title">{post.title}</div>
            <div className="dt-post-body">{post.content}</div>
            <div className="dt-post-meta">
              <span>🕐 {timeAgo(post.created_at)}</span>
              <span>💬 {answers.length} answer{answers.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* ANSWER BOX */}
          <div className="dt-answer-box">
            <div className="dt-answer-box-title">✦ Write an Answer</div>
            <textarea
              className="dt-textarea"
              placeholder="Share your knowledge or solution…"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
            />
            <button
              className="dt-submit-btn"
              onClick={addAnswer}
              disabled={posting || !answerText.trim()}
            >
              {posting ? "Posting…" : "✓ Post Answer"}
            </button>
          </div>

          {/* ANSWERS */}
          <div className="dt-answers-header">
            Answers
            <span className="dt-answers-count">{answers.length}</span>
          </div>

          {answers.length === 0 ? (
            <div className="dt-empty">
              <div className="dt-empty-icon">💡</div>
              <div className="dt-empty-title">No answers yet</div>
              <div className="dt-empty-sub">Be the first to help out!</div>
            </div>
          ) : (
            <div className="dt-feed">
              {answers.map((a, i) => {
                const isTop = answers.length > 1 && a.score === Math.max(...answers.map(x => x.score)) && a.score > 0;
                const color = avatarColor(a.full_name);
                return (
                  <div key={a.id} className={`dt-answer-card${isTop ? " top-answer" : ""}`}>
                    {isTop && <div className="dt-top-badge">⭐ Top Answer</div>}

                    <div className="dt-answer-author">
                      <div className="dt-avatar" style={{ background: color }}>
                        {getInitials(a.full_name)}
                      </div>
                      <div>
                        <div className="dt-author-name">{a.full_name}</div>
                        <div className="dt-author-time">{timeAgo(a.created_at)}</div>
                      </div>
                    </div>

                    <div className="dt-answer-body">{a.content}</div>

                    <div className="dt-vote-bar">
                      <button
                        className="dt-vote-btn dt-vote-up"
                        onClick={() => vote(a.id, 1)}
                        disabled={votingId === a.id}
                      >
                        👍 Helpful
                      </button>
                      <button
                        className="dt-vote-btn dt-vote-down"
                        onClick={() => vote(a.id, -1)}
                        disabled={votingId === a.id}
                      >
                        👎
                      </button>
                      <span
                        className="dt-score"
                        style={{
                          background: a.score > 0 ? "#f0fdf4" : a.score < 0 ? "#fef2f2" : "#f3f4f6",
                          color: a.score > 0 ? "#16a34a" : a.score < 0 ? "#dc2626" : "#6b7280",
                        }}
                      >
                        {a.score > 0 ? `+${a.score}` : a.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}