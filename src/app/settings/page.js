"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/app/AppLayout";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const [prefs, setPrefs] = useState({
    default_grade: "",
    difficulty: "basic",
    notifications: true,
    public_profile: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setUser(user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

    setLoading(false);
  }

  function updateProfile(field, value) {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updatePrefs(field, value) {
    setPrefs((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveAll() {
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
  }

  // =========================
  // SOFT DELETE ACCOUNT
  // =========================
  async function deactivateAccount() {
    const confirmAction = window.confirm(
      "⚠️ Are you sure you want to deactivate your account?\n\n" +
      "Your account will be disabled but your questions, answers, and activity will remain on the platform."
    );

    if (!confirmAction) return;

    setDeactivating(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        is_active: false,
        updated_at: new Date(),
      })
      .eq("id", user.id);

    if (error) {
      console.log("DEACTIVATE ERROR:", error);
      setDeactivating(false);
      return;
    }

    await supabase.auth.signOut();

    window.location.href = "/";

    setDeactivating(false);
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 text-slate-500">Loading settings...</div>
      </AppLayout>
    );
  }

  if (!user || !profile) {
    return (
      <AppLayout>
        <div className="p-6 text-red-500">
          You are not logged in
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">

        <h1 className="text-2xl font-bold mb-1">
          ⚙️ Settings
        </h1>

        <p className="text-slate-500 mb-6">
          Manage your account and learning preferences
        </p>

        {/* PROFILE */}
        <div className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">👤 Profile</h2>

          <div className="grid grid-cols-2 gap-3">

            <input
              className="border p-2 rounded"
              value={profile.first_name || ""}
              onChange={(e) => updateProfile("first_name", e.target.value)}
              placeholder="First Name"
            />

            <input
              className="border p-2 rounded"
              value={profile.last_name || ""}
              onChange={(e) => updateProfile("last_name", e.target.value)}
              placeholder="Last Name"
            />

            <input
              className="border p-2 rounded"
              value={profile.school || ""}
              onChange={(e) => updateProfile("school", e.target.value)}
              placeholder="School"
            />

            <input
              className="border p-2 rounded"
              value={profile.province || ""}
              onChange={(e) => updateProfile("province", e.target.value)}
              placeholder="Province"
            />

            <input
              type="number"
              className="border p-2 rounded col-span-2"
              value={profile.grade || ""}
              onChange={(e) => updateProfile("grade", e.target.value)}
              placeholder="Grade"
            />
          </div>
        </div>

        {/* LEARNING */}
        <div className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">📚 Learning Preferences</h2>

          <input
            className="border p-2 rounded w-full mb-3"
            placeholder="Default Grade"
            value={prefs.default_grade}
            onChange={(e) => updatePrefs("default_grade", e.target.value)}
          />

          <select
            className="border p-2 rounded w-full"
            value={prefs.difficulty}
            onChange={(e) => updatePrefs("difficulty", e.target.value)}
          >
            <option value="basic">Basic</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* PRIVACY */}
        <div className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">🔒 Privacy</h2>

          <label className="flex justify-between">
            Show my profile publicly
            <input
              type="checkbox"
              checked={prefs.public_profile}
              onChange={(e) => updatePrefs("public_profile", e.target.checked)}
            />
          </label>

          <label className="flex justify-between mt-3">
            Enable notifications
            <input
              type="checkbox"
              checked={prefs.notifications}
              onChange={(e) => updatePrefs("notifications", e.target.checked)}
            />
          </label>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 flex-wrap">

          <button
            onClick={saveAll}
            disabled={saving}
            className="bg-indigo-600 text-white px-6 py-2 rounded"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="bg-red-500 text-white px-6 py-2 rounded"
          >
            Logout
          </button>

          <button
            onClick={deactivateAccount}
            disabled={deactivating}
            className="bg-black text-white px-6 py-2 rounded"
          >
            {deactivating ? "Deactivating..." : "Deactivate Account"}
          </button>

        </div>

      </div>
    </AppLayout>
  );
}