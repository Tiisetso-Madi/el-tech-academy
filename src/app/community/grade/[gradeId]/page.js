"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";
import { useParams, useRouter } from "next/navigation";

export default function GradeCommunity() {
  const { gradeId } = useParams(); // ✅ safe param
  const router = useRouter(); // ✅ FIXED (INSIDE COMPONENT)

  const [posts, setPosts] = useState([]);
  const [grade, setGrade] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gradeId) {
      loadData();
    }
  }, [gradeId]);

  async function loadData() {
    if (!gradeId) return;

    setLoading(true);

    // =========================
    // GET GRADE
    // =========================
    const { data: gradeData, error: gradeError } = await supabase
      .from("community_grades")
      .select("*")
      .eq("id", gradeId)
      .single();

    if (gradeError) {
      console.log("GRADE ERROR:", gradeError);
      setLoading(false);
      return;
    }

    setGrade(gradeData);

    // =========================
    // GET POSTS
    // =========================
    const { data: postsData, error: postsError } = await supabase
      .from("community_posts")
      .select("*")
      .eq("grade_id", gradeId)
      .order("created_at", { ascending: false });

    if (postsError) {
      console.log("POSTS ERROR:", postsError);
    }

    setPosts(postsData || []);
    setLoading(false);
  }

  async function createPost() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !gradeId) return;
    if (!title || !content) return;

    const { error } = await supabase.from("community_posts").insert({
      grade_id: gradeId,
      user_id: user.id,
      title,
      content,
    });

    if (error) {
      console.log("INSERT ERROR:", error);
      return;
    }

    setTitle("");
    setContent("");
    loadData();
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">

<button
  onClick={() => router.back()}
  className="mb-4 text-sm text-indigo-600 hover:underline"
>
  ← Back
</button>
        {/* HEADER */}
        <h1 className="text-2xl font-bold mb-1">
          💬 {grade?.name || "Community"}
        </h1>

        <p className="text-slate-500 mb-6">
          Discussions for learners
        </p>

        {/* ASK BOX */}
        <div className="bg-white border rounded-xl p-4 mb-6">

          <input
            className="w-full border p-2 rounded mb-2"
            placeholder="Ask a question title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full border p-2 rounded mb-2"
            placeholder="Describe your problem..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button
            onClick={createPost}
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            Start Discussion
          </button>

        </div>

        {/* DISCUSSIONS FEED */}
        {loading ? (
          <p className="text-slate-500">Loading discussions...</p>
        ) : (
          <div className="space-y-3">

            {posts.length === 0 ? (
              <p className="text-slate-500">
                No discussions yet — be the first to start one.
              </p>
            ) : (
              posts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/community/post/${p.id}`)} // ✅ NOW WORKS
                  className="bg-white border rounded-xl p-4 hover:shadow-md transition cursor-pointer"
                >

                  {/* TITLE */}
                  
                  <h2 className="font-semibold text-lg text-slate-800">
                    {p.title}
                  </h2>

                  {/* CONTENT PREVIEW */}
                  <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                    {p.content}
                  </p>

                  {/* META */}
                  <div className="flex justify-between mt-3 text-xs text-slate-500">

                    <span>
                      💬 Discussion
                    </span>

                    <span className="text-indigo-500 font-medium">
                      Open →
                    </span>

                  </div>

                </div>
              ))
            )}

          </div>
        )}

      </div>
    </AppLayout>
  );
}