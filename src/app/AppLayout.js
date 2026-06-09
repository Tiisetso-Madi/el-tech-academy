"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import MenuItem from "@/app/MenuItem";

import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  AcademicCapIcon,
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
  UserIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

export default function AppLayout({ children }) {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------- AUTH ----------------
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }

    loadUser();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 flex">

      {/* SIDEBAR */}
      <aside
        className={`
          bg-gradient-to-b from-purple-700 via-indigo-700 to-cyan-600
          text-white min-h-screen transition-all duration-300
          ${sidebarOpen ? "w-72" : "w-20"}
        `}
      >
        <div className="p-5">

          {/* TOP */}
          <div className="flex justify-between items-center mb-10">
            {sidebarOpen && (
              <h1 className="text-2xl font-bold">EL-Tech Academy</h1>
            )}

            <button onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* MENU */}
          <nav className="space-y-2">

            <MenuItem icon={<HomeIcon className="h-6 w-6" />} text="Home" open={sidebarOpen} onClick={() => router.push("/dashboard")} />
            <MenuItem icon={<AcademicCapIcon className="h-6 w-6" />} text="Subjects" open={sidebarOpen} onClick={() => router.push("/subjects")} />
            <MenuItem icon={<ClipboardDocumentListIcon className="h-6 w-6" />} text="Practice" open={sidebarOpen} onClick={() => router.push("/practice")} />
            <MenuItem icon={<TrophyIcon className="h-6 w-6" />} text="Competitions" open={sidebarOpen} onClick={() => router.push("/competitions")} />
            <MenuItem icon={<UserGroupIcon className="h-6 w-6" />} text="Community" open={sidebarOpen} onClick={() => router.push("/community")} />
            <MenuItem icon={<ChartBarIcon className="h-6 w-6" />} text="Results" open={sidebarOpen} onClick={() => router.push("/results")} />

  {/* ✅ ADD THIS */}
  <MenuItem
    icon={<TrophyIcon className="h-6 w-6" />}
    text="Leaderboard"
    open={sidebarOpen}
    onClick={() => router.push("/leaderboard")}
  />

            <MenuItem icon={<UserIcon className="h-6 w-6" />} text="Profile" open={sidebarOpen} onClick={() => router.push("/profile")} />
            <MenuItem icon={<Cog6ToothIcon className="h-6 w-6" />} text="Settings" open={sidebarOpen} onClick={() => router.push("/settings")} />

          </nav>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="mt-10 w-full bg-red-500 hover:bg-red-600 py-3 rounded-xl"
          >
            {sidebarOpen ? "Logout" : "🚪"}
          </button>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <section className="flex-1">
        {children}
      </section>

    </main>
  );
}