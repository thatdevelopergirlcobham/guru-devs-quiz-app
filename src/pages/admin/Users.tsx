import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutDashboard, FileQuestion, Users as UsersIcon, BarChart3, LogOut, Trash2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

const adminNavItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Quizzes", url: "/admin/quizzes", icon: FileQuestion },
  { title: "Users", url: "/admin/users", icon: UsersIcon },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Logout", url: "/logout", icon: LogOut },
];

type Row = { id: string; name: string | null; email: string | null };

const AdminUsers = () => {
  const qc = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = users ?? [];
    if (!q) return list;
    return list.filter((u) => (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q));
  }, [users, query]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar items={adminNavItems} />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
              <p className="text-muted-foreground">Search and remove users</p>
            </div>
            <div className="relative w-full max-w-sm">
              <Input
                placeholder="Search by name or email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <Card className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Name</th>
                  <th className="text-left px-6 py-3 font-medium">Email</th>
                  <th className="text-right px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-border/60">
                    <td className="px-6 py-4">{u.name || "(no name)"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email || "(no email)"}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <Button variant="destructive" size="icon" onClick={() => del.mutate(u.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="px-6 py-10 text-center text-muted-foreground" colSpan={3}>No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
