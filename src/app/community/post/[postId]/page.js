"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";

export default function DiscussionThread() {
  const { postId } = useParams();
  const router = useRouter(); // ✅ FIXED

  const [post, setPost] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [answerText, setAnswerText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postId) loadThread();
  }, [postId]);

  async function loadThread() {
    setLoading(true);

    // GET POST
    const { data: postData } = await supabase
      .from("community_posts")
      .select("*")
      .eq("id", postId)
      .single();

    setPost(postData);

    // GET ANSWERS
    const { data: answersData, error: answersError } = await supabase
      .from("community_answers")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (answersError) {
      console.log("ANSWERS ERROR:", answersError);
      setLoading(false);
      return;
    }

    // GET PROFILES
    const userIds = [...new Set((answersData || []).map(a => a.user_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds);

    const profileMap = {};
    (profiles || []).forEach(p => {
      profileMap[p.id] = `${p.first_name} ${p.last_name}`;
    });

    // GET VOTES
    const { data: votesData } = await supabase
      .from("community_answer_votes")
      .select("*");

    const votesMap = {};
    (votesData || []).forEach(v => {
      votesMap[v.answer_id] = (votesMap[v.answer_id] || 0) + v.vote;
    });

    const enriched = (answersData || []).map(a => ({
      ...a,
      full_name: profileMap[a.user_id] || "Anonymous",
      score: votesMap[a.id] || 0,
    }));

    setAnswers(enriched);
    setLoading(false);
  }

  async function addAnswer() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !answerText.trim()) return;

    await supabase.from("community_answers").insert({
      post_id: postId,
      user_id: user.id,
      content: answerText,
    });

    setAnswerText("");
    loadThread();
  }

  async function vote(answerId, value) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: existing } = await supabase
      .from("community_answer_votes")
      .select("*")
      .eq("answer_id", answerId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("community_answer_votes")
        .update({ vote: value })
        .eq("id", existing.id);
    } else {
      await supabase.from("community_answer_votes").insert({
        answer_id: answerId,
        user_id: user.id,
        vote: value,
      });
    }

    loadThread();
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">Loading discussion...</div>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <div className="p-6 text-red-500">Post not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">

          {/* BACK BUTTON */}
          <button
            onClick={() => router.back()}
            className="text-sm px-3 py-1 rounded bg-slate-100 hover:bg-slate-200"
          >
            ← Back
          </button>

          <h1 className="text-lg font-bold text-slate-700">
            Discussion
          </h1>

          <div />
        </div>

        {/* POST */}
        <div className="bg-white border rounded-xl p-5 mb-6">
          <h1 className="text-2xl font-bold">{post.title}</h1>
          <p className="text-slate-600 mt-3 whitespace-pre-line">
            {post.content}
          </p>
        </div>

        {/* ANSWER BOX */}
        <div className="bg-white border rounded-xl p-4 mb-6">
          <textarea
            className="w-full border p-2 rounded mb-2"
            placeholder="Write your answer..."
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
          />

          <button
            onClick={addAnswer}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Post Answer
          </button>
        </div>

        {/* ANSWERS */}
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-700">
            💬 Answers ({answers.length})
          </h2>

          {answers.length === 0 ? (
            <p className="text-slate-500">No answers yet.</p>
          ) : (
            answers.map((a) => (
              <div key={a.id} className="bg-white border rounded-xl p-4">

                <div className="text-sm text-slate-500 mb-2">
                  👤 {a.full_name}
                </div>

                <p className="text-slate-700 whitespace-pre-line">
                  {a.content}
                </p>

                <div className="flex items-center gap-3 mt-3">

                  <button
                    onClick={() => vote(a.id, 1)}
                    className="px-2 py-1 bg-green-100 text-green-700 rounded"
                  >
                    👍
                  </button>

                  <button
                    onClick={() => vote(a.id, -1)}
                    className="px-2 py-1 bg-red-100 text-red-700 rounded"
                  >
                    👎
                  </button>

                  <span className="text-sm text-slate-600">
                    Score: {a.score}
                  </span>

                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </AppLayout>
  );
}