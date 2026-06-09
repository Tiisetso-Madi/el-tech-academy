"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setUser(user);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log("PROFILE ERROR:", error);
    }

    setProfile(data);
    setLoading(false);
  }

  function updateField(field, value) {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveProfile() {
    if (!user || !profile) return;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        school: profile.school,
        province: profile.province,
        grade: profile.grade,
        updated_at: new Date(),
      })
      .eq("id", user.id);

    if (error) {
      console.log("SAVE ERROR:", error);
      setSaving(false);
      return;
    }

    setSaving(false);
    setIsEditing(false);
    loadProfile();
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 text-slate-500">Loading profile...</div>
      </AppLayout>
    );
  }

  if (!user || !profile) {
    return (
      <AppLayout>
        <div className="p-6 text-red-500">You are not logged in</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6">

        {/* HEADER */}
        <h1 className="text-2xl font-bold mb-1">
          👤 My Profile
        </h1>

        <p className="text-slate-500 mb-6">
          View your details and performance
        </p>

        {/* =========================
            VIEW MODE (DEFAULT)
        ========================= */}
        {!isEditing && (
          <div className="bg-white border rounded-xl p-6 space-y-4">

            <div>
              <p className="text-slate-500 text-sm">Name</p>
              <p className="font-semibold">
                {profile.first_name} {profile.last_name}
              </p>
            </div>

            <div>
              <p className="text-slate-500 text-sm">School</p>
              <p className="font-semibold">{profile.school || "-"}</p>
            </div>

            <div>
              <p className="text-slate-500 text-sm">Province</p>
              <p className="font-semibold">{profile.province || "-"}</p>
            </div>

            <div>
              <p className="text-slate-500 text-sm">Grade</p>
              <p className="font-semibold">{profile.grade || "-"}</p>
            </div>

            <div>
              <p className="text-slate-500 text-sm">Email</p>
              <p className="font-semibold">{profile.email}</p>
            </div>

          </div>
        )}

        {/* =========================
            EDIT MODE
        ========================= */}
        {isEditing && (
          <div className="bg-white border rounded-xl p-6 space-y-4">

            <input
              className="w-full border p-2 rounded"
              placeholder="First Name"
              value={profile.first_name || ""}
              onChange={(e) =>
                updateField("first_name", e.target.value)
              }
            />

            <input
              className="w-full border p-2 rounded"
              placeholder="Last Name"
              value={profile.last_name || ""}
              onChange={(e) =>
                updateField("last_name", e.target.value)
              }
            />

            <input
              className="w-full border p-2 rounded"
              placeholder="School"
              value={profile.school || ""}
              onChange={(e) =>
                updateField("school", e.target.value)
              }
            />

            <input
              className="w-full border p-2 rounded"
              placeholder="Province"
              value={profile.province || ""}
              onChange={(e) =>
                updateField("province", e.target.value)
              }
            />

            <input
              type="number"
              className="w-full border p-2 rounded"
              placeholder="Grade"
              value={profile.grade || ""}
              onChange={(e) =>
                updateField("grade", e.target.value)
              }
            />

          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="mt-6 flex gap-3">

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-indigo-600 text-white px-5 py-2 rounded"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="bg-green-600 text-white px-5 py-2 rounded"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                onClick={() => setIsEditing(false)}
                className="bg-slate-200 text-slate-700 px-5 py-2 rounded"
              >
                Cancel
              </button>
            </>
          )}

        </div>

      </div>
    </AppLayout>
  );
}