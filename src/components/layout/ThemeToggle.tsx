"use client";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.getAttribute("data-theme") === "light");
  }, []);

  async function toggle() {
    const next = !light;
    setLight(next);
    const theme = next ? "light" : "dark";

    // Update data-theme on current page
    if (next) {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }

    // Save to localStorage for admin session override
    localStorage.setItem("theme", theme);

    // Save to DB — makes it the global default for all visitors
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: theme }),
      });
    } catch (_) {}
  }

  return (
    <button onClick={toggle}
      className="w-full px-4 py-3 text-sm text-silver/40 hover:text-white transition-colors text-left">
      {light ? "☀️ Light Mode" : "🌙 Dark Mode"}
    </button>
  );
}
