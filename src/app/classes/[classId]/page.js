"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// Landing page accent colours — cycling per card
const CARD_ACCENTS = [
  { bg: "#f3e8ff", color: "#7c3aed", border: "#e9d5ff" }, // purple
  { bg: "#e0f7fa", color: "#0891b2", border: "#bae6fd" }, // cyan
  { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" }, // orange
  { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" }, // green
  { bg: "#fdf2f8", color: "#db2777", border: "#fbcfe8" }, // pink
  { bg: "#fefce8", color: "#ca8a04", border: "#fef08a" }, // yellow
];

const ICONS = ["📚", "🎯", "📐", "🔬", "📊", "✏️", "🧮", "🗺️", "🎨", "🔭"];

export default function SubjectsPage({ params }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSubjects(); }, []);

  async function loadSubjects() {
    const { data } = await supabase
      .from("subjects")
      .select("*")
      .eq("class_id", params.classId);
    setSubjects(data || []);
    setLoading(false);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .sp-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 50%, #fce7f3 100%);
          font-family: 'Inter', system-ui, sans-serif;
          padding: 48px 24px 72px;
        }
        .sp-inner { max-width: 1100px; margin: 0 auto; }

        /* Header */
        .sp-eyebrow {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          background: linear-gradient(90deg, #7c3aed, #0891b2);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }
        .sp-title {
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 800; letter-spacing: -0.02em;
          background: linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #0891b2 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
        }
        .sp-sub {
          font-size: 15px; color: #6b7280; margin-bottom: 40px;
        }

        /* Grid */
        .sp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 18px;
        }

        /* Card */
        .sp-card {
          background: white;
          border-radius: 20px;
          padding: 28px 24px;
          text-decoration: none;
          display: block;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(124,58,237,0.08);
          border: 1.5px solid transparent;
          transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
        }
        .sp-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(124,58,237,0.16);
        }
        .sp-card-accent-bar {
          position: absolute; top: 0; left: 0; right: 0;
          height: 4px; border-radius: 20px 20px 0 0;
        }
        .sp-card-icon {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; margin-bottom: 16px;
        }
        .sp-card-name {
          font-size: 17px; font-weight: 700;
          color: #1e1b4b; margin-bottom: 8px;
          line-height: 1.3;
        }
        .sp-card-cta {
          font-size: 12px; font-weight: 600;
          display: inline-flex; align-items: center; gap: 4px;
          margin-top: 12px;
        }

        /* Empty state */
        .sp-empty {
          text-align: center; padding: 64px 24px;
          background: white; border-radius: 24px;
          box-shadow: 0 4px 16px rgba(124,58,237,0.07);
        }
        .sp-empty-icon { font-size: 48px; margin-bottom: 16px; }
        .sp-empty-title { font-size: 20px; font-weight: 700; color: #1e1b4b; margin-bottom: 8px; }
        .sp-empty-sub { font-size: 14px; color: #9ca3af; }

        /* Loading skeleton */
        .sp-skeleton {
          background: linear-gradient(90deg, #f3f0ff 25%, #ede9fe 50%, #f3f0ff 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 20px; height: 140px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="sp-root">
        <div className="sp-inner">

          {/* Header */}
          <div className="sp-eyebrow">Your Subjects</div>
          <h1 className="sp-title">Subjects</h1>
          <p className="sp-sub">
            {loading ? "Loading your subjects…" : `${subjects.length} subject${subjects.length !== 1 ? "s" : ""} available`}
          </p>

          {/* Loading skeletons */}
          {loading && (
            <div className="sp-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="sp-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && subjects.length === 0 && (
            <div className="sp-empty">
              <div className="sp-empty-icon">📭</div>
              <div className="sp-empty-title">No subjects yet</div>
              <div className="sp-empty-sub">Subjects will appear here once they're added to your class.</div>
            </div>
          )}

          {/* Subject cards */}
          {!loading && subjects.length > 0 && (
            <div className="sp-grid">
              {subjects.map((subject, i) => {
                const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
                const icon = ICONS[i % ICONS.length];
                return (
                  <Link
                    key={subject.id}
                    href={`/subjects/${subject.id}`}
                    className="sp-card"
                    style={{ borderColor: accent.border }}
                  >
                    <div className="sp-card-accent-bar" style={{ background: accent.color }} />
                    <div className="sp-card-icon" style={{ background: accent.bg }}>
                      {icon}
                    </div>
                    <div className="sp-card-name">{subject.name}</div>
                    <div className="sp-card-cta" style={{ color: accent.color }}>
                      Open subject <span>→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </>
  );
}