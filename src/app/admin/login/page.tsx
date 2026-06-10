"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message); else router.push("/admin/dashboard");
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-deep-blue/50 border border-silver/10 rounded-xl p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-2 text-center">Admin Login</h1>
        <p className="text-sm text-silver/50 text-center mb-8">Sign in to manage your store</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none" />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <Button type="submit" variant="primary" className="w-full">Sign In</Button>
        </form>
      </div>
    </div>
  );
}
