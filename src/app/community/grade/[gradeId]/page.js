"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";
import { useParams, useRouter } from "next/navigation";

export default function GradeCommunity() {
  const { gradeId } = useParams();
  const router = useRouter();

  const [posts, setPosts] = useState([]);
  const [grade, setGrade] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (gradeId) loadData();
  }, [gradeId]);

  async function loadData() {
    if (!gradeId) return;
    setLoading(true);

    const { data: gradeData, error: gradeError } = await supabase
      .from("community_grades").select("*").eq("id", gradeId).single();
    if (gradeError) { console.log("GRADE ERROR:", gradeError); setLoading(false); return; }
    setGrade(gradeData);

    const { data: postsData, error: postsError } = await supabase
      .from("community_posts").select("*").eq("grade_id", gradeId)
      .order("created_at", { ascending: false });
    if (postsError) console.log("POSTS ERROR:", postsError);

    setPosts(postsData || []);
    setLoading(false);
  }

  async function createPost() {
    if (!title.trim() || !content.trim()) return;
    setPosting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !gradeId) { setPosting(false); return; }

    const { error } = await supabase.from("community_posts").insert({
      grade_id: gradeId, user_id: user.id, title, content,
    });
    if (error) { console.log("INSERT ERROR:", error); setPosting(false); return; }

    setTitle(""); setContent(""); setShowForm(false);
    setPosting(false);
    loadData();
  }

  function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <AppLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .cm-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 50%, #fce7f3 100%);
          font-family: 'Inter', system-ui, sans-serif;
          padding: 40px 24px 72px;
        }
        .cm-inner { max-width: 760px; margin: 0 auto; }

        /* Back */
        .cm-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; color: #7c3aed;
          background: white; border: 1.5px solid #e9d5ff;
          border-radius: 10px; padding: 7px 14px;
          cursor: pointer; text-decoration: none;
          margin-bottom: 28px;
          transition: background 0.15s, transform 0.15s;
          box-shadow: 0 2px 8px rgba(124,58,237,0.08);
        }
        .cm-back:hover { background: #f3e8ff; transform: translateX(-2px); }

        /* Header */
        .cm-header { margin-bottom: 32px; }
        .cm-eyebrow {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          background: linear-gradient(90deg, #7c3aed, #0891b2);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
        }
        .cm-title {
          font-size: clamp(24px, 3.5vw, 34px); font-weight: 800;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #0891b2 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 6px;
        }
        .cm-sub { font-size: 14px; color: #6b7280; }

        /* Top bar */
        .cm-topbar {
          display: flex; align-items: center;
          justify-content: space-between; gap: 12px;
          margin-bottom: 24px; flex-wrap: wrap;
        }
        .cm-count {
          font-size: 13px; color: #9ca3af; font-weight: 500;
        }
        .cm-ask-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 22px; border-radius: 12px;
          background: linear-gradient(135deg, #7c3aed, #0891b2);
          color: white; font-weight: 700; font-size: 14px;
          border: none; cursor: pointer;
          box-shadow: 0 4px 16px rgba(124,58,237,0.28);
          transition: opacity 0.15s, transform 0.15s;
        }
        .cm-ask-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        /* Ask form */
        .cm-form-wrap {
          background: white; border-radius: 20px;
          border: 1.5px solid #e9d5ff;
          box-shadow: 0 8px 32px rgba(124,58,237,0.1);
          padding: 28px; margin-bottom: 28px;
          animation: slideDown 0.2s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cm-form-title {
          font-size: 16px; font-weight: 700; color: #1e1b4b; margin-bottom: 18px;
          display: flex; align-items: center; gap: 8px;
        }
        .cm-form-title span {
          font-size: 18px;
        }
        .cm-input, .cm-textarea {
          width: 100%; border: 1.5px solid #e9d5ff;
          border-radius: 12px; padding: 12px 16px;
          font-size: 14px; color: #1e1b4b;
          font-family: 'Inter', system-ui, sans-serif;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          background: #faf8ff;
          box-sizing: border-box;
        }
        .cm-input { margin-bottom: 12px; }
        .cm-textarea { resize: vertical; min-height: 110px; margin-bottom: 16px; }
        .cm-input:focus, .cm-textarea:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
          background: white;
        }
        .cm-input::placeholder, .cm-textarea::placeholder { color: #c4b5fd; }
        .cm-form-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .cm-cancel-btn {
          padding: 10px 20px; border-radius: 10px;
          border: 1.5px solid #e9d5ff; color: #9ca3af;
          font-weight: 600; font-size: 14px; cursor: pointer;
          background: white; transition: background 0.15s;
        }
        .cm-cancel-btn:hover { background: #f9f5ff; }
        .cm-submit-btn {
          padding: 10px 24px; border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #0891b2);
          color: white; font-weight: 700; font-size: 14px;
          border: none; cursor: pointer;
          box-shadow: 0 4px 12px rgba(124,58,237,0.25);
          transition: opacity 0.15s;
        }
        .cm-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cm-submit-btn:hover:not(:disabled) { opacity: 0.9; }

        /* Posts feed */
        .cm-feed { display: flex; flex-direction: column; gap: 14px; }

        .cm-post-card {
          background: white; border-radius: 18px;
          border: 1.5px solid #f3f0ff;
          box-shadow: 0 2px 12px rgba(124,58,237,0.06);
          padding: 22px 24px; cursor: pointer;
          transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
          position: relative; overflow: hidden;
        }
        .cm-post-card::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 4px;
          background: linear-gradient(180deg, #7c3aed, #0891b2);
          border-radius: 18px 0 0 18px;
          opacity: 0; transition: opacity 0.18s;
        }
        .cm-post-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(124,58,237,0.14);
          border-color: #e9d5ff;
        }
        .cm-post-card:hover::before { opacity: 1; }

        .cm-post-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .cm-post-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: #f3e8ff; color: #7c3aed;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          padding: 4px 10px; border-radius: 99px;
          margin-bottom: 10px;
        }
        .cm-post-title {
          font-size: 16px; font-weight: 700;
          color: #1e1b4b; line-height: 1.4; margin-bottom: 8px;
        }
        .cm-post-preview {
          font-size: 13px; color: #6b7280;
          line-height: 1.6; margin-bottom: 16px;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .cm-post-footer {
          display: flex; align-items: center;
          justify-content: space-between;
          font-size: 12px; color: #9ca3af;
        }
        .cm-post-meta { display: flex; align-items: center; gap: 14px; }
        .cm-post-open {
          font-size: 12px; font-weight: 700; color: #7c3aed;
          display: flex; align-items: center; gap: 4px;
        }

        /* Empty / loading */
        .cm-empty {
          background: white; border-radius: 20px;
          border: 1.5px solid #f3f0ff;
          text-align: center; padding: 56px 24px;
          box-shadow: 0 2px 12px rgba(124,58,237,0.06);
        }
        .cm-empty-icon { font-size: 44px; margin-bottom: 14px; }
        .cm-empty-title { font-size: 18px; font-weight: 700; color: #1e1b4b; margin-bottom: 8px; }
        .cm-empty-sub { font-size: 13px; color: #9ca3af; }

        .cm-skeleton {
          background: linear-gradient(90deg, #f3f0ff 25%, #ede9fe 50%, #f3f0ff 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 18px; height: 110px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="cm-root">
        <div className="cm-inner">

          {/* BACK */}
          <button className="cm-back" onClick={() => router.back()}>
            ← Back
          </button>

          {/* HEADER */}
          <div className="cm-header">
            <div className="cm-eyebrow">Community</div>
            <h1 className="cm-title">💬 {grade?.name || "Community"}</h1>
            <p className="cm-sub">Discussions and questions from learners</p>
          </div>

          {/* TOP BAR */}
          <div className="cm-topbar">
            <span className="cm-count">
              {!loading && `${posts.length} discussion${posts.length !== 1 ? "s" : ""}`}
            </span>
            <button className="cm-ask-btn" onClick={() => setShowForm(v => !v)}>
              {showForm ? "✕ Cancel" : "✦ Ask a Question"}
            </button>
          </div>

          {/* ASK FORM */}
          {showForm && (
            <div className="cm-form-wrap">
              <div className="cm-form-title">
                <span>✦</span> Start a New Discussion
              </div>
              <input
                className="cm-input"
                placeholder="What's your question?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="cm-textarea"
                placeholder="Describe your problem in detail…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="cm-form-actions">
                <button className="cm-cancel-btn" onClick={() => { setShowForm(false); setTitle(""); setContent(""); }}>
                  Cancel
                </button>
                <button
                  className="cm-submit-btn"
                  onClick={createPost}
                  disabled={posting || !title.trim() || !content.trim()}
                >
                  {posting ? "Posting…" : "Post Discussion"}
                </button>
              </div>
            </div>
          )}

          {/* FEED */}
          {loading ? (
            <div className="cm-feed">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="cm-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="cm-empty">
              <div className="cm-empty-icon">💬</div>
              <div className="cm-empty-title">No discussions yet</div>
              <div className="cm-empty-sub">Be the first to start a conversation!</div>
            </div>
          ) : (
            <div className="cm-feed">
              {posts.map((p) => (
                <div
                  key={p.id}
                  className="cm-post-card"
                  onClick={() => router.push(`/community/post/${p.id}`)}
                >
                  <div className="cm-post-badge">💬 Discussion</div>
                  <div className="cm-post-title">{p.title}</div>
                  <div className="cm-post-preview">{p.content}</div>
                  <div className="cm-post-footer">
                    <div className="cm-post-meta">
                      <span>🕐 {timeAgo(p.created_at)}</span>
                    </div>
                    <div className="cm-post-open">Open thread →</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}