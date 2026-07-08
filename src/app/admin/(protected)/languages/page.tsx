"use client";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";

type LanguageEntry = {
  locale: string;
  enabled: boolean;
  flag: string;
  label: string;
  native: string;
};

const LANGUAGE_ORDER = ["en", "zh", "de", "fr", "fi", "no", "sv"];

export default function AdminLanguagesPage() {
  const [languages, setLanguages] = useState<LanguageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/languages")
      .then((r) => r.json())
      .then((data) => {
        // Sort by defined order
        const sorted = [...(data.languages || [])].sort(
          (a, b) => LANGUAGE_ORDER.indexOf(a.locale) - LANGUAGE_ORDER.indexOf(b.locale)
        );
        setLanguages(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function toggleLanguage(locale: string, enabled: boolean) {
    setSaving(locale);
    try {
      const res = await fetch("/api/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, enabled }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to save");
        return;
      }
      setLanguages((prev) =>
        prev.map((l) => (l.locale === locale ? { ...l, enabled } : l))
      );
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-2">🌐 Language Management</h1>
        <p className="text-sm text-silver/50 mb-8">
          Toggle languages on/off. Only enabled languages will appear in the frontend language switcher.
          Content for disabled languages is preserved — no data is deleted.
        </p>

        {loading ? (
          <p className="text-silver/40 text-sm">Loading...</p>
        ) : (
          <div className="max-w-2xl space-y-3">
            {languages.map((lang) => {
              const enabledCount = languages.filter((l) => l.enabled).length;
              const isOnlyEnabled = lang.enabled && enabledCount <= 1;

              return (
                <div
                  key={lang.locale}
                  className={`flex items-center justify-between p-5 rounded-xl border transition-all ${
                    lang.enabled
                      ? "bg-forest/10 border-forest/30"
                      : "bg-deep-blue/20 border-silver/10"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <p className="text-white font-medium">
                        {lang.native}{" "}
                        <span className="text-silver/50 text-sm font-normal ml-2">
                          {lang.label}
                        </span>
                      </p>
                      <p className="text-xs text-silver/40 font-mono mt-0.5">{lang.locale}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        lang.enabled
                          ? "bg-forest/20 text-forest"
                          : "bg-red-400/10 text-red-400/60"
                      }`}
                    >
                      {lang.enabled ? "● Published" : "○ Hidden"}
                    </span>

                    <button
                      onClick={() => {
                        if (isOnlyEnabled) {
                          if (
                            !confirm(
                              "At least one language must remain enabled. Are you sure you want to disable English?"
                            )
                          )
                            return;
                        }
                        toggleLanguage(lang.locale, !lang.enabled);
                      }}
                      disabled={saving === lang.locale}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        lang.enabled ? "bg-forest" : "bg-silver/20"
                      }`}
                    >
                      {saving === lang.locale ? (
                        <span className="text-xs text-silver/40 ml-3">...</span>
                      ) : (
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            lang.enabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="mt-6 p-4 bg-deep-blue/20 border border-silver/10 rounded-xl">
              <p className="text-sm text-silver/60">
                <strong className="text-white">Enabled:</strong>{" "}
                {languages.filter((l) => l.enabled).length} / {languages.length} languages
              </p>
              <p className="text-xs text-silver/40 mt-1">
                Changes take effect immediately on the frontend. No page reload needed.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
