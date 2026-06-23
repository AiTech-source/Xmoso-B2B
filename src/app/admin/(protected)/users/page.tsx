"use client";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", password: "", display_name: "", role: "admin" });
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ display_name: "", role: "" });

  function loadUsers() {
    setLoading(true);
    fetch("/api/admin/users").then((r) => r.json()).then((d) => {
      if (d.error) { setError(d.error); setLoading(false); return; }
      setUsers(d.users || []); setLoading(false);
    }).catch(() => { setError("Failed to load users"); setLoading(false); });
  }

  useEffect(() => { loadUsers(); }, []);

  async function inviteUser() {
    if (!inviteForm.email || !inviteForm.password) return;
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inviteForm),
    });
    const d = await res.json();
    if (d.error) { setError(d.error); setLoading(false); return; }
    setShowInvite(false);
    setInviteForm({ email: "", password: "", display_name: "", role: "admin" });
    loadUsers();
  }

  async function updateUser(id: string, data: any) {
    const res = await fetch("/api/admin/users", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    const d = await res.json();
    if (d.error) { setError(d.error); return; }
    setEditing(null);
    loadUsers();
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-light tracking-wider text-white">👥 Admin Users</h1>
          <button onClick={() => setShowInvite(!showInvite)}
            className="px-4 py-2 text-sm rounded-lg bg-forest/20 text-forest border border-forest/30 hover:bg-forest/30 transition-colors">
            + Invite User
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-red-400/60 text-xs mt-1">Only super admin can manage users.</p>
          </div>
        )}

        {showInvite && (
          <div className="mb-6 p-6 bg-deep-blue/30 border border-silver/10 rounded-xl space-y-4">
            <h3 className="text-white text-sm font-medium">Invite New Admin</h3>
            <div className="grid grid-cols-2 gap-3">
              <input value={inviteForm.email} onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                placeholder="Email *" type="email" className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
              <input value={inviteForm.display_name} onChange={(e) => setInviteForm({...inviteForm, display_name: e.target.value})}
                placeholder="Display Name" className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
              <input value={inviteForm.password} onChange={(e) => setInviteForm({...inviteForm, password: e.target.value})}
                placeholder="Password *" type="password" className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
              <select value={inviteForm.role} onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white">
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={inviteUser} className="px-4 py-2 text-sm rounded-lg bg-forest/20 text-forest border border-forest/30 hover:bg-forest/30 transition-colors">Create User</button>
              <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm rounded-lg bg-transparent text-silver/50 border border-silver/20 hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-silver/40 text-sm py-12 text-center">Loading...</div>
        ) : (
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver/10 text-silver/50 text-xs uppercase tracking-wider">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Created</th>
                  <th className="text-right p-4 w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-silver/5 hover:bg-white/5">
                    {editing === u.id ? (
                      <>
                        <td className="p-2"><input value={editForm.display_name} onChange={(e) => setEditForm({...editForm, display_name: e.target.value})}
                          className="w-full bg-deep-dark border border-silver/10 rounded px-2 py-1.5 text-xs text-white" /></td>
                        <td className="p-2 text-silver/60 text-xs">{u.email}</td>
                        <td className="p-2"><select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                          className="bg-deep-dark border border-silver/10 rounded px-2 py-1.5 text-xs text-white">
                          <option value="super_admin">Super Admin</option><option value="admin">Admin</option><option value="editor">Editor</option>
                        </select></td>
                        <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? "bg-forest/20 text-forest" : "bg-red-400/20 text-red-400"}`}>{u.is_active ? "Active" : "Inactive"}</span></td>
                        <td className="p-2 text-xs text-silver/40">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-2 text-right">
                          <button onClick={() => updateUser(u.id, { display_name: editForm.display_name, role: editForm.role })} className="text-forest hover:text-forest/80 text-xs px-2">💾</button>
                          <button onClick={() => setEditing(null)} className="text-silver/40 hover:text-white text-xs px-2">✕</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 text-white text-xs">{u.display_name}</td>
                        <td className="p-4 text-silver/60 text-xs">{u.email}</td>
                        <td className="p-4"><span className={`text-[10px] px-2 py-0.5 rounded-full ${u.role === "super_admin" ? "bg-amber-400/20 text-amber-400" : u.role === "admin" ? "bg-forest/20 text-forest" : "bg-ice/20 text-ice"}`}>{u.role}</span></td>
                        <td className="p-4"><span className={`text-[10px] px-2 py-0.5 rounded-full ${u.is_active ? "bg-forest/15 text-forest/80" : "bg-red-400/15 text-red-400/80"}`}>{u.is_active ? "Active" : "Inactive"}</span></td>
                        <td className="p-4 text-xs text-silver/40">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button onClick={() => { setEditing(u.id); setEditForm({ display_name: u.display_name, role: u.role }); }} className="text-forest hover:text-forest/80 text-xs mr-3">Edit</button>
                          <button onClick={() => updateUser(u.id, { is_active: !u.is_active })} className={`text-xs ${u.is_active ? "text-red-400/60 hover:text-red-400" : "text-forest/60 hover:text-forest"}`}>{u.is_active ? "Disable" : "Enable"}</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
