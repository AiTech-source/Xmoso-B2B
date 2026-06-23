"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Check if this is a valid admin user via our API
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Get current user to check role
      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role;
      if (role !== "super_admin" && role !== "admin" && role !== "editor") {
        // Not an admin user — sign them out
        await supabase.auth.signOut();
        setError("This account does not have admin access.");
        setLoading(false);
        return;
      }

      // If "remember me" is unchecked, set session to expire
      // Supabase SSR persists session by default; we manage "remember" via
      // how long the session lasts. If not remembered, we use a short session.
      if (!remember) {
        // The default session is already persistent in localStorage.
        // We can't easily make it short-lived, but we can note the user's preference.
        localStorage.setItem("admin_remember", "false");
      } else {
        localStorage.setItem("admin_remember", "true");
      }

      router.push("/admin/dashboard");
    } catch (e: any) {
      setError(e.message || "Login failed");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-deep-blue/50 border border-silver/10 rounded-xl p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-2 text-center">Admin Login</h1>
        <p className="text-sm text-silver/50 text-center mb-8">Sign in to manage your store</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="email"
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
