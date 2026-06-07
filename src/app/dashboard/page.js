"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import MenuItem from "@/app/MenuItem";
import { supabase } from "@/lib/supabase";
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


export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
const [sidebarOpen, setSidebarOpen] = useState(true);

  const [activeMenu, setActiveMenu] = useState("home");
  


  // ----------------------------
  // AUTH CHECK
  // ----------------------------
  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // ----------------------------
      // LOAD PROFILE
      // ----------------------------
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error) {
        setProfile(data);
      }

      setLoading(false);
    }

    loadUser();
  }, [router]);

  // ----------------------------
  // LOGOUT
  // ----------------------------
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // ----------------------------
  // LOADING STATE
  // ----------------------------
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  // ----------------------------
  // UI
  // ----------------------------
return (
  <main className="min-h-screen bg-slate-100 flex relative">
    {/* SIDEBAR */}
 <aside
  className={`
    bg-gradient-to-b
    from-purple-700
    via-indigo-700
    to-cyan-600
    text-white
    min-h-screen
    transition-all
    duration-300
    ${sidebarOpen ? "w-72" : "w-20"}
  `}
>
  <div className="p-5">

    {/* Logo */}
    <div className="flex items-center justify-between mb-10">

      {sidebarOpen && (
        <h1 className="text-2xl font-extrabold">
          EL-Tech Academy
        </h1>
      )}

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 rounded-lg hover:bg-white/20"
      >
        {sidebarOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

    </div>

    {/* Menu */}
    <nav className="space-y-2">

  <MenuItem
  icon={<HomeIcon className="h-6 w-6" />}
  text="Home"
  open={sidebarOpen}
  onClick={() => router.push("/dashboard")}
/>

<MenuItem
  icon={<AcademicCapIcon className="h-6 w-6" />}
  text="Subjects"
  open={sidebarOpen}
  active={activeMenu === "subjects"}
  onClick={() => router.push("/subjects")}
/>
<MenuItem
  icon={<ClipboardDocumentListIcon className="h-6 w-6" />}
  text="Practice"
  open={sidebarOpen}
  onClick={() => router.push("/practice")}
/>

<MenuItem
  icon={<TrophyIcon className="h-6 w-6" />}
  text="Competitions"
  open={sidebarOpen}
  onClick={() => router.push("/competitions")}
/>

<MenuItem
  icon={<UserGroupIcon className="h-6 w-6" />}
  text="Community"
  open={sidebarOpen}
  onClick={() => router.push("/community")}
/>

<MenuItem
  icon={<ChartBarIcon className="h-6 w-6" />}
  text="Results"
  open={sidebarOpen}
  onClick={() => router.push("/results")}
/>

<MenuItem
  icon={<TrophyIcon className="h-6 w-6" />}
  text="Leaderboard"
  open={sidebarOpen}
  onClick={() => router.push("/leaderboard")}
/>

<MenuItem
  icon={<UserIcon className="h-6 w-6" />}
  text="Profile"
  open={sidebarOpen}
  onClick={() => router.push("/profile")}
/>

<MenuItem
  icon={<Cog6ToothIcon className="h-6 w-6" />}
  text="Settings"
  open={sidebarOpen}
  onClick={() => router.push("/settings")}
/>
    </nav>

    <button
      onClick={handleLogout}
      className="mt-10 w-full bg-red-500 hover:bg-red-600 rounded-xl py-3"
    >
      {sidebarOpen ? "Logout" : "🚪"}
    </button>

  </div>
</aside>

    {/* MAIN AREA */}
    <section className="flex-1">

      <header className="bg-white shadow-sm px-8 py-5 flex justify-between items-center">
       
      

        <div>
          <h2 className="text-2xl font-bold">
            Welcome back, {profile?.first_name || "Student"} 👋
          </h2>

          <p className="text-gray-500">
            Continue building your Mathematics skills.
          </p>
        </div>

        <div className="bg-purple-100 px-4 py-2 rounded-full">
          Grade {profile?.grade || 12}
        </div>
      </header>

      <div className="p-8">

        {activeMenu === "home" && (
          <>
            <div className="grid md:grid-cols-4 gap-5 mb-8">

              <div className="bg-white rounded-2xl p-6 shadow">
                <h3 className="text-gray-500 text-sm">
                  Topics Completed
                </h3>
                <p className="text-3xl font-bold mt-2">
                  4/10
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow">
                <h3 className="text-gray-500 text-sm">
                  Questions Answered
                </h3>
                <p className="text-3xl font-bold mt-2">
                  250
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow">
                <h3 className="text-gray-500 text-sm">
                  Average
                </h3>
                <p className="text-3xl font-bold mt-2">
                  78%
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow">
                <h3 className="text-gray-500 text-sm">
                  Streak
                </h3>
                <p className="text-3xl font-bold mt-2">
                  🔥 12 Days
                </p>
              </div>

            </div>

            <div className="bg-white rounded-2xl p-6 shadow mb-6">
              <h3 className="text-xl font-bold mb-4">
                Continue Learning
              </h3>

              <div className="bg-purple-50 rounded-xl p-5">
                <div className="flex justify-between">
                  <span>Algebraic Expressions</span>
                  <span>80%</span>
                </div>

                <div className="w-full h-3 bg-gray-200 rounded-full mt-3">
                  <div className="h-3 w-4/5 bg-purple-600 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl p-6">
              <h3 className="text-2xl font-bold">
                🏆 June Mathematics Challenge
              </h3>

              <p className="mt-2">
                Participate and win prizes.
              </p>
            </div>
          </>
        )}

        {activeMenu === "classes" && (
          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold mb-6">
              📚 Classes
            </h2>

            <div className="grid md:grid-cols-2 gap-4">

              <div className="border p-4 rounded-xl">
                Grade 8 Mathematics
              </div>

              <div className="border p-4 rounded-xl">
                Grade 9 Mathematics
              </div>

              <div className="border p-4 rounded-xl">
                Grade 10 Mathematics
              </div>

              <div className="border p-4 rounded-xl">
                Grade 11 Mathematics
              </div>

              <div className="border p-4 rounded-xl">
                Grade 12 Mathematics
              </div>

            </div>
          </div>
        )}

        {activeMenu === "competitions" && (
          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">
              🏆 Competitions
            </h2>

            <p>
              Monthly Mathematics Challenges coming soon.
            </p>
          </div>
        )}

        {activeMenu === "results" && (
          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">
              📊 My Results
            </h2>

            <div className="space-y-3">
              <div>Algebra Quiz - 85%</div>
              <div>Functions Quiz - 78%</div>
              <div>Finance Quiz - 91%</div>
            </div>
          </div>
        )}

        {activeMenu === "leaderboard" && (
          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">
              🏅 Leaderboard
            </h2>

            <div className="space-y-3">
              <div>🥇 Sarah - 96%</div>
              <div>🥈 John - 94%</div>
              <div>🥉 Tiisetso - 92%</div>
            </div>
          </div>
        )}

      </div>

    </section>
  </main>
);
}