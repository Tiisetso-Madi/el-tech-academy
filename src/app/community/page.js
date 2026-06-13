"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";
import { useRouter } from "next/navigation";

const CARD_ACCENTS = [
  { bg: "#f3e8ff", color: "#7c3aed", border: "#e9d5ff", icon: "💬" },
  { bg: "#e0f7fa", color: "#0891b2", border: "#bae6fd", icon: "🎓" },
  { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa", icon: "📚" },
  { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", icon: "✏️" },
  { bg: "#fdf2f8", color: "#db2777", border: "#fbcfe8", icon: "🏆" },
  { bg: "#fefce8", color: "#ca8a04", border: "#fef08a", icon: "🔬" },
];

export default function CommunityPage() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { loadGrades(); }, []);

  async function loadGrades() {
    const { data } = await supabase
      .from("community_grades").select("*").order("name");
    setGrades(data || []);
    setLoading(false);
  }

  return (
    <AppLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .cp-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 50%, #fce7f3 100%);
          font-family: 'Inter', system-ui, sans-serif;
          padding: 48px 24px 72px;
        }
        .cp-inner { max-width: 900px; margin: 0 auto; }

        /* Header */
        .cp-eyebrow {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          background: linear-gradient(90deg, #7c3aed, #0891b2);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }
        .cp-title {
          font-size: clamp(28px, 4vw, 40px); font-weight: 800;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #0891b2 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
        }
        .cp-sub {
          font-size: 15px; color: #6b7280; margin-bottom: 40px;
        }

        /* Grid */
        .cp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 18px;
        }

        /* Card */
        .cp-card {
          background: white; border-radius: 20px;
          padding: 28px 24px; cursor: pointer;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 16px rgba(124,58,237,0.08);
          border: 1.5px solid transparent;
          transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
        }
        .cp-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 36px rgba(124,58,237,0.16);
        }
        .cp-card-bar {
          position: absolute; top: 0; left: 0; right: 0;
          height: 4px; border-radius: 20px 20px 0 0;
        }
        .cp-card-icon {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; margin-bottom: 16px;
        }
        .cp-card-name {
          font-size: 18px; font-weight: 700;
          color: #1e1b4b; margin-bottom: 6px;
        }
        .cp-card-sub {
          font-size: 13px; color: #9ca3af; margin-bottom: 16px;
        }
        .cp-card-cta {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 700;
          padding: 6px 14px; border-radius: 99px;
        }

        /* Skeleton */
        .cp-skeleton {
          background: linear-gradient(90deg, #f3f0ff 25%, #ede9fe 50%, #f3f0ff 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 20px; height: 150px;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Empty */
        .cp-empty {
          background: white; border-radius: 20px;
          border: 1.5px solid #f3f0ff;
          text-align: center; padding: 64px 24px;
          box-shadow: 0 2px 12px rgba(124,58,237,0.06);
          grid-column: 1 / -1;
        }
        .cp-empty-icon { font-size: 44px; margin-bottom: 14px; }
        .cp-empty-title { font-size: 18px; font-weight: 700; color: #1e1b4b; margin-bottom: 8px; }
        .cp-empty-sub { font-size: 13px; color: #9ca3af; }
      `}</style>

      <div className="cp-root">
        <div className="cp-inner">

          {/* HEADER */}
          <div className="cp-eyebrow">Community</div>
          <h1 className="cp-title">💬 Community</h1>
          <p className="cp-sub">Choose your grade to ask questions and join discussions</p>

          {/* GRID */}
          <div className="cp-grid">

            {loading && [...Array(4)].map((_, i) => (
              <div key={i} className="cp-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}

            {!loading && grades.length === 0 && (
              <div className="cp-empty">
                <div className="cp-empty-icon">💬</div>
                <div className="cp-empty-title">No grades available yet</div>
                <div className="cp-empty-sub">Check back soon — grades will appear here once added.</div>
              </div>
            )}

            {!loading && grades.map((g, i) => {
              const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
              return (
                <div
                  key={g.id}
                  className="cp-card"
                  style={{ borderColor: accent.border }}
                  onClick={() => router.push(`/community/grade/${g.id}`)}
                >
                  <div className="cp-card-bar" style={{ background: accent.color }} />
                  <div className="cp-card-icon" style={{ background: accent.bg }}>
                    {accent.icon}
                  </div>
                  <div className="cp-card-name">{g.name}</div>
                  <div className="cp-card-sub">Open discussion space</div>
                  <div className="cp-card-cta" style={{ background: accent.bg, color: accent.color }}>
                    Enter grade →
                  </div>
                </div>
              );
            })}

          </div>

        </div>
      </div>
    </AppLayout>
  );
}