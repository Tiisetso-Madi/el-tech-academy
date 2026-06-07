"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("name");

    if (!error) {
      setClasses(data);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="p-10">
        Loading classes...
      </div>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-8">
        📚 Classes
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <Link
            key={cls.id}
            href={`/classes/${cls.id}`}
            className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold">
              {cls.name}
            </h2>

            <p className="text-gray-500 mt-2">
              View Subjects
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}