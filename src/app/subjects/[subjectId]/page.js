"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function SubjectPage() {
  const { subjectId } = useParams();

  const [chapters, setChapters] = useState([]);
  const router = useRouter();

  useEffect(() => {
    loadChapters();
  }, []);

  async function loadChapters() {
    const { data } = await supabase
      .from("chapters")
      .select("*")
      .eq("subject_id", subjectId);

    if (data) {
      setChapters(data);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">
        Chapters
      </h1>

      <div className="grid md:grid-cols-2 gap-4">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            onClick={() =>
              router.push(`/chapters/${chapter.id}`)
            }
            className="
              bg-white
              p-6
              rounded-xl
              shadow
              cursor-pointer
            "
          >
            {chapter.name}
          </div>
        ))}
      </div>
    </div>
  );
}