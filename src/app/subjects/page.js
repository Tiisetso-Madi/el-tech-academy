"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const router = useRouter();

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    const { data } = await supabase
      .from("subjects")
      .select("*")
      .order("name");

    if (data) {
      setSubjects(data);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">
        📚 Subjects
      </h1>

      <div className="grid md:grid-cols-3 gap-5">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            onClick={() =>
              router.push(`/subjects/${subject.id}`)
            }
            className="
              cursor-pointer
              bg-white
              rounded-2xl
              shadow
              p-6
              hover:shadow-xl
              hover:-translate-y-1
              transition
            "
          >
            <h2 className="text-xl font-bold">
              {subject.name}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}