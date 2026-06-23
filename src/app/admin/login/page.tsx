"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if already logged in — if so, show a "goto dashboard" option
    // but still show the login form so user can re-auth or see the page
    supabase?.auth.getUser().then((result: { data?: { user?: any } }) => {
      if (result.data?.user) {
        setAlreadyLoggedIn(true);
      }
      setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email, password,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role;
      if (role !== "super_admin" && role !== "admin" && role !== "editor") {
        await supabase.auth.signOut();
        setError("This account does not have admin access.");
        setLoading(false);
        return;
      }

      router.push("/admin/dashboard");
    } catch (e: any) {
      setError(e.message || "Login failed");
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setAlreadyLoggedIn(false);
    setEmail("");
    setPassword("");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-dark">
        <p className="text-silver/40 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-deep-dark">
      <div className="w-full max-w-md bg-deep-blue/50 border border-silver/10 rounded-xl p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-2 text-center">Admin Login</h1>
        <p className="text-sm text-silver/50 text-center mb-8">Sign in to manage your store</p>

        {alreadyLoggedIn && (
          <div className="mb-6 p-4 bg-forest/10 border border-forest/30 rounded-lg">
            <p className="text-sm text-forest mb-3">✅ You are already logged in.</p>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/admin/dashboard")} size="sm">Go to Dashboard</Button>
              <Button onClick={handleLogout} size="sm" variant="outline">Sign Out</Button>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required autoFocus={!alreadyLoggedIn} autoComplete="email"
            className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none" />
          <input type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
            className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none" />

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded accent-forest" />
            <span className="text-sm text-silver/60">Remember me</span>
          </label>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
