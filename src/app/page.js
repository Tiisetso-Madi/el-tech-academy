"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-100 via-cyan-50 to-pink-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">
            🎓 EL-Tech Academy
          </h1>

          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-5 py-2 rounded-xl border-2 border-purple-500 text-purple-600 font-semibold hover:bg-purple-50 transition"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="px-5 py-2 rounded-xl text-white font-semibold bg-gradient-to-r from-purple-600 to-cyan-500 hover:scale-105 transition"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-bold">
              Learning Platform
            </span>

            <h1 className="mt-6 text-6xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
                Learn.
              </span>
              <br />
              Practice.
              <br />
              Achieve.
            </h1>

            <p className="mt-6 text-xl text-gray-600">
              Master your learning through engaging lessons,
              quizzes, assessments, past papers and interactive learning
              experiences.
            </p>

            <div className="flex gap-4 mt-8">
              <Link
                href="/register"
                className="px-8 py-4 rounded-2xl text-white font-bold text-lg bg-gradient-to-r from-purple-600 to-cyan-500 hover:scale-105 transition"
              >
                Start Learning
              </Link>

              <Link
                href="/login"
                className="px-8 py-4 rounded-2xl border-2 border-purple-500 text-purple-600 font-bold text-lg hover:bg-purple-50 transition"
              >
                Login
              </Link>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-100 p-6 rounded-2xl text-center">
                  <div className="text-4xl">📚</div>
                  <p className="font-bold mt-2">Lessons</p>
                </div>

                <div className="bg-cyan-100 p-6 rounded-2xl text-center">
                  <div className="text-4xl">🎥</div>
                  <p className="font-bold mt-2">Videos</p>
                </div>

                <div className="bg-orange-100 p-6 rounded-2xl text-center">
                  <div className="text-4xl">📝</div>
                  <p className="font-bold mt-2">Quizzes</p>
                </div>

                <div className="bg-green-100 p-6 rounded-2xl text-center">
                  <div className="text-4xl">🏆</div>
                  <p className="font-bold mt-2">Competitions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-6 text-center shadow-lg">
            <h3 className="text-4xl font-bold text-purple-600">500+</h3>
            <p className="text-gray-600 mt-2">Lessons</p>
          </div>

          <div className="bg-white rounded-3xl p-6 text-center shadow-lg">
            <h3 className="text-4xl font-bold text-cyan-600">2000+</h3>
            <p className="text-gray-600 mt-2">Questions</p>
          </div>

          <div className="bg-white rounded-3xl p-6 text-center shadow-lg">
            <h3 className="text-4xl font-bold text-orange-500">50+</h3>
            <p className="text-gray-600 mt-2">Assessments</p>
          </div>

          <div className="bg-white rounded-3xl p-6 text-center shadow-lg">
            <h3 className="text-4xl font-bold text-green-500">95%</h3>
            <p className="text-gray-600 mt-2">Pass Rate Goal</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-extrabold text-center mb-12">
          Everything You Need To Succeed
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-purple-100 rounded-3xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-4">📚 Lessons</h3>
            <p>
              Structured CAPS-aligned  lessons covering every
              topic required.
            </p>
          </div>

          <div className="bg-cyan-100 rounded-3xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-4">🎥 Video Tutorials</h3>
            <p>
              Watch step-by-step explanations and worked examples from
              experienced tutors.
            </p>
          </div>

          <div className="bg-orange-100 rounded-3xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-4">📝 Practice</h3>
            <p>
              Reinforce your learning through hundreds of practice
              questions.
            </p>
          </div>

          <div className="bg-green-100 rounded-3xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-4">✅ Quizzes</h3>
            <p>
              Track your understanding after every chapter and topic.
            </p>
          </div>

          <div className="bg-pink-100 rounded-3xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-4">📊 Assessments</h3>
            <p>
              Challenge yourself with formal tests and exam-style
              assessments.
            </p>
          </div>

          <div className="bg-yellow-100 rounded-3xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-4">🏆 Competitions</h3>
            <p>
              Compete against learners nationwide and win exciting prizes.
            </p>
          </div>
        </div>
      </section>

      {/* Mathematics Topics */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-extrabold text-center mb-12">
            Grade 12 Mathematics Topics
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              "Algebraic Expressions, Equations and Inequalities",
              "Patterns and Sequences",
              "Functions and Graphs",
              "Finance, Growth and Decay",
              "Differential Calculus",
              "Probability",
              "Euclidean Geometry",
              "Analytical Geometry",
              "Statistics and Regression",
              "Trigonometry",
            ].map((topic) => (
              <div
                key={topic}
                className="bg-gradient-to-r from-purple-50 to-cyan-50 p-5 rounded-2xl shadow hover:shadow-xl hover:-translate-y-1 transition"
              >
                {topic}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-extrabold mb-6">
            Ready To Ace Mathematics?
          </h2>

          <p className="text-xl text-gray-600 mb-8">
            Join EL-Tech Academy today and start preparing for success.
          </p>

          <Link
            href="/register"
            className="inline-block px-10 py-5 rounded-2xl text-white font-bold text-xl bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 hover:scale-105 transition"
          >
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-purple-800 via-indigo-800 to-cyan-700 text-white py-10">
        <div className="text-center">
          <h3 className="text-2xl font-bold">🎓 EL-Tech Academy</h3>
          <p className="mt-3 text-purple-100">
            Learn. Practice. Achieve.
          </p>
        </div>
      </footer>
    </main>
  );
}
