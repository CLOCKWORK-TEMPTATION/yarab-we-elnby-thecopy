"use client";

import { Button } from "@/components/ui/button";
import { useApp } from "../context/AppContext";

const NAV_ITEMS = [
  { view: "home", label: "🏠 الرئيسية" },
  { view: "demo", label: "🎬 التجربة" },
  { view: "vocal", label: "🎤 تمارين الصوت" },
  { view: "voicecoach", label: "🎙️ مدرب الصوت" },
  { view: "rhythm", label: "🎵 إيقاع المشهد" },
  { view: "webcam", label: "👁️ التحليل البصري" },
  { view: "ar", label: "🥽 تدريب AR/MR" },
  { view: "memorization", label: "🧠 اختبار الحفظ" },
] as const;

export function AppHeader() {
  const { currentView, user, theme, navigate, toggleTheme, handleLogout } =
    useApp();

  return (
    <header className="bg-gradient-to-l from-blue-900 to-purple-900 text-white p-6 sticky top-0 z-40">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎭</span>
            <h1 className="text-3xl font-bold">الممثل الذكي</h1>
          </div>

          <nav className="flex items-center gap-2">
            {NAV_ITEMS.map(({ view, label }) => (
              <Button
                key={view}
                onClick={() => navigate(view)}
                variant={currentView === view ? "secondary" : "ghost"}
                className={
                  currentView === view
                    ? "bg-white text-blue-900"
                    : "text-white hover:bg-blue-800"
                }
              >
                {label}
              </Button>
            ))}

            {user ? (
              <>
                <Button
                  onClick={() => navigate("dashboard")}
                  variant={
                    currentView === "dashboard" ? "secondary" : "ghost"
                  }
                  className={
                    currentView === "dashboard"
                      ? "bg-white text-blue-900"
                      : "text-white hover:bg-blue-800"
                  }
                >
                  📊 لوحة التحكم
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-white hover:bg-red-600"
                >
                  🚪 خروج
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => navigate("login")}
                  variant="ghost"
                  className="text-white hover:bg-blue-800"
                >
                  دخول
                </Button>
                <Button
                  onClick={() => navigate("register")}
                  className="bg-white text-blue-900 hover:bg-gray-100"
                >
                  ابدأ الآن
                </Button>
              </>
            )}

            <Button
              onClick={toggleTheme}
              variant="ghost"
              className="text-white hover:bg-blue-800"
              size="icon"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
