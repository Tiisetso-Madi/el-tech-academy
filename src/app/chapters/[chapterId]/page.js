"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRef } from "react";



export default function ChapterPage() {
  const { chapterId } = useParams();
  const router = useRouter();
const [user, setUser] = useState(null);
const [resources, setResources] = useState([]);

  const [lessonCompleted, setLessonCompleted] = useState(false);
const [saving, setSaving] = useState(false);
  

const [mode, setMode] = useState("draw"); // "draw" | "type"
const [text, setText] = useState("");
const canvasRef = useRef(null);
const isDrawing = useRef(false);

  
  const [showScratchpad, setShowScratchpad] = useState(false);
const [scratchText, setScratchText] = useState("");

  const [chapter, setChapter] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // quiz states
  const [quiz, setQuiz] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
useEffect(() => {
  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  };

  loadUser();
}, []);
  useEffect(() => {
    if (chapterId) loadData();
  }, [chapterId]);

  useEffect(() => {
  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  };

  

  getUser();

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user || null);
    }
  );

  return () => {
    listener?.subscription.unsubscribe();
  };
}, []);

  useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const dpr = window.devicePixelRatio || 1;

  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.scale(dpr, dpr);
}, []);

  async function loadData() {
    const { data: chapterData } = await supabase
      .from("chapters")
      .select("*")
      .eq("id", chapterId)
      .single();

    setChapter(chapterData);

    const { data: lessonsData } = await supabase
      .from("lessons")
      .select("*")
      .eq("chapter_id", chapterId)
      .order("display_order");

    setLessons(lessonsData || []);
    setCurrentIndex(0);

    if (lessonsData?.length > 0) {
      loadQuiz(lessonsData[0].id);
    }
  }

async function loadQuiz(lessonId) {

  const { data: resourcesData } = await supabase
  .from("lesson_resources")
  .select("*")
  .eq("lesson_id", lessonId)
  .order("display_order");

setResources(resourcesData || []);
  const { data } = await supabase
    .from("lesson_quizzes")
    .select("*")
    .eq("lesson_id", lessonId);

  setQuiz(data || []);
  setQuizIndex(0);
  setSelectedAnswer(null);
  setFeedback(null);

  if (!user?.id) return;

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .single();

  setLessonCompleted(progress?.completed || false);
}

  function nextLesson() {
    const next = currentIndex + 1;

    if (next < lessons.length) {
      setCurrentIndex(next);
      loadQuiz(lessons[next].id);
    }
  }

  function prevLesson() {
    const prev = currentIndex - 1;

    if (prev >= 0) {
      setCurrentIndex(prev);
      loadQuiz(lessons[prev].id);
    }
  }

  const currentLesson = lessons[currentIndex];
  const currentQuestion = quiz[quizIndex];

async function checkAnswer(answer) {
  setSelectedAnswer(answer);

  if (!currentQuestion) return;

  // 🧠 STOP HERE IF USER NOT READY
  if (!user?.id) {
    setFeedback("⏳ Please wait for login to load...");
    return;
  }

  const isCorrect = answer === currentQuestion.correct_answer;

  if (!isCorrect) {
    setFeedback(`❌ Wrong. ${currentQuestion.explanation || ""}`);
    return;
  }

  setFeedback("✅ Correct!");

  if (lessonCompleted || saving) return;

  setLessonCompleted(true);
  setSaving(true);

  const { error } = await supabase.from("lesson_progress").upsert({
    user_id: user.id,
    lesson_id: currentLesson.id,
    completed: true,
    completed_at: new Date().toISOString(),
  });

  console.log("SUPABASE ERROR:", error);

  setSaving(false);
}

  function nextQuestion() {
    if (quizIndex < quiz.length - 1) {
      setQuizIndex(quizIndex + 1);
      setSelectedAnswer(null);
      setFeedback(null);
    }
  }

function getPos(e) {
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}
function startDraw(e) {
  const ctx = canvasRef.current.getContext("2d");
  isDrawing.current = true;

  const pos = getPos(e);

  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
  if (!isDrawing.current) return;

  const ctx = canvasRef.current.getContext("2d");
  const pos = getPos(e);

  ctx.lineWidth = 1.5;
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.strokeStyle = "#000";

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

function stopDraw() {
  isDrawing.current = false;
}

  return (
    <div className="p-8 min-h-screen bg-slate-100">

       {/* BACK */}
  <button
    onClick={() => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    }}
    className="mb-6 text-purple-600 font-semibold hover:underline"
  >
    ← Back
  </button>

 



      

      <h1 className="text-4xl font-bold mb-6">
        {chapter?.name}
      </h1>

      {/* NAV LESSON */}
      <div className="flex justify-between mb-6">
        <button onClick={prevLesson}>⬅ Prev Lesson</button>

        <span>
          Lesson {currentIndex + 1} / {lessons.length}
        </span>

        <button onClick={nextLesson}>Next Lesson ➡</button>
      </div>

      {/* LESSON */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-2xl font-bold mb-3">
          {currentLesson?.title}
        </h2>

        <div className="whitespace-pre-line text-gray-700">
          {currentLesson?.notes}
        </div>


{currentLesson?.image_url && (
  <div className="mt-4">
    <img
      src={currentLesson.image_url}
      alt={currentLesson.image_caption || "Lesson Example"}
      className="rounded-lg border max-w-full"
    />

    {currentLesson.image_caption && (
      <p className="text-sm text-gray-500 mt-2">
        {currentLesson.image_caption}
      </p>
    )}
  </div>
)}



      </div>

      {/* QUIZ CARD */}

      {/* LESSON RESOURCES */}
{resources.length > 0 && (
  <div className="bg-white p-6 rounded-xl shadow mb-6">

    <h3 className="text-xl font-bold mb-4">
      📚 Additional Resources
    </h3>

    {/* PDFs */}
    {resources.some(r => r.resource_type === "pdf") && (
      <div className="mb-5">
        <h4 className="font-semibold mb-2">
          📄 PDF Notes
        </h4>

        {resources
          .filter(r => r.resource_type === "pdf")
          .map(resource => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="block text-blue-600 hover:underline mb-1"
            >
              {resource.title}
            </a>
          ))}
      </div>
    )}

    {/* Videos */}
    {resources.some(r => r.resource_type === "video") && (
      <div className="mb-5">
        <h4 className="font-semibold mb-2">
          🎥 Videos
        </h4>

        {resources
          .filter(r => r.resource_type === "video")
          .map(resource => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="block text-blue-600 hover:underline mb-1"
            >
              {resource.title}
            </a>
          ))}
      </div>
    )}

    {/* Links */}
    {resources.some(r => r.resource_type === "link") && (
      <div>
        <h4 className="font-semibold mb-2">
          🔗 Useful Links
        </h4>

        {resources
          .filter(r => r.resource_type === "link")
          .map(resource => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="block text-blue-600 hover:underline mb-1"
            >
              {resource.title}
            </a>
          ))}
      </div>
    )}

  </div>
)}

<div className="bg-white p-6 rounded-xl shadow">

  <h3 className="text-xl font-bold mb-4">
    🧠 Quick Check
  </h3>

  {/* SCRATCHPAD BUTTON */}
  <button
    onClick={() => setShowScratchpad(!showScratchpad)}
    className="mb-3 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
  >
    ✏️ Working Board
  </button>

  {/* SCRATCHPAD */}
  {showScratchpad && (
    <div className="mt-3 border rounded-lg p-3 bg-gray-50">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">
          ✏️ Working Space
        </span>

        <button
          onClick={() => setShowScratchpad(false)}
          className="text-red-500 font-bold"
        >
          ✕
        </button>
      </div>

      {/* MODE TOGGLE */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setMode("draw")}
          className={`px-3 py-1 rounded ${
            mode === "draw"
              ? "bg-purple-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Draw
        </button>

        <button
          onClick={() => setMode("type")}
          className={`px-3 py-1 rounded ${
            mode === "type"
              ? "bg-purple-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Type
        </button>
      </div>

      {/* DRAW MODE */}
      {mode === "draw" && (
        <canvas
          ref={canvasRef}
  width={1000}
  height={500}
  className="border w-full bg-white touch-none"

          onMouseDown={(e) => startDraw(e.nativeEvent)}
          onMouseMove={(e) => draw(e.nativeEvent)}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}

          onTouchStart={(e) => {
            e.preventDefault();
            const t = e.touches[0];
            startDraw({
              clientX: t.clientX,
              clientY: t.clientY,
            });
          }}

          onTouchMove={(e) => {
            e.preventDefault();
            const t = e.touches[0];
            draw({
              clientX: t.clientX,
              clientY: t.clientY,
            });
          }}

          onTouchEnd={stopDraw}
        />
      )}

      {/* TYPE MODE */}
      {mode === "type" && (
        <textarea
          value={scratchText}
          onChange={(e) => setScratchText(e.target.value)}
          placeholder="Work out your steps here..."
          className="w-full h-32 p-2 border rounded resize-none"
        />
      )}

      {/* ACTIONS */}
      <div className="flex justify-between mt-2">
        <button
          onClick={() => {
            setScratchText("");

            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext("2d");
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }}
          className="text-sm text-gray-600 hover:text-black"
        >
          Clear
        </button>

        <span className="text-xs text-gray-400">
          Not saved
        </span>
      </div>
    </div>
  )}

  {/* QUIZ CONTENT (UNCHANGED) */}
  {!currentQuestion ? (
    <p className="text-gray-500">
      No quiz for this lesson yet.
    </p>
  ) : (
    <div>
      <p className="font-semibold mb-4">
        {currentQuestion.question}
      </p>

  {["A","B","C","D"].map((opt) => (
  <button
    key={opt}
    onClick={() => checkAnswer(opt)}
    className="block w-full text-left p-2 border rounded mb-2"
  >
    <div>
      {currentQuestion[`option_${opt.toLowerCase()}`]}
    </div>

    {currentQuestion[
      `option_${opt.toLowerCase()}_image`
    ] && (
      <img
        src={
          currentQuestion[
            `option_${opt.toLowerCase()}_image`
          ]
        }
        className="mt-2 max-h-40 rounded"
      />
    )}
  </button>
))}

      {feedback && (
        <p className="mt-3 font-semibold">
          {feedback}
        </p>
      )}

      <button
        onClick={nextQuestion}
        disabled={quizIndex >= quiz.length - 1}
        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-40"
      >
        Next Question ➡
      </button>
    </div>
  )}
</div>

    </div>
  );
}