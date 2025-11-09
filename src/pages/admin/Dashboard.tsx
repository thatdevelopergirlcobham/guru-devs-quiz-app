import { Sidebar } from "@/components/layout/Sidebar";
import { StatsCard } from "@/components/ui/stats-card";
import { LayoutDashboard, FileQuestion, Users, BarChart3, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useNavigate } from "react-router-dom";

const adminNavItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Quizzes", url: "/admin/quizzes", icon: FileQuestion },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Logout", url: "/logout", icon: LogOut },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const [usersCountRes, quizzesCountRes, attemptsCountRes, avgPassRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("quizzes").select("id", { count: "exact", head: true }),
        supabase.from("attempts").select("id", { count: "exact", head: true }),
        supabase.from("attempts").select("score,total").limit(1000),
      ]);
      const usersCount = usersCountRes.count ?? 0;
      const quizzesCount = quizzesCountRes.count ?? 0;
      const attemptsCount = attemptsCountRes.count ?? 0;
      const avgPass = (() => {
        const rows = (avgPassRes.data ?? []) as { score: number; total: number }[];
        if (!rows.length) return 0;
        const pct = rows.reduce((acc, r) => acc + (r.total ? (r.score / r.total) * 100 : 0), 0) / rows.length;
        return Math.round(pct);
      })();

      // recent activity: latest 5 attempts with quiz title and user email
      const { data: recent } = await supabase
        .from("attempts")
        .select("id, created_at, score, total, quizzes: quiz_id (title), profiles: user_id (email)")
        .order("created_at", { ascending: false })
        .limit(5);

      // top quizzes from performance view if present
      const { data: top } = await supabase
        .from("quiz_performance")
        .select("quiz_id, title, attempts_count")
        .order("attempts_count", { ascending: false })
        .limit(3);

      return { usersCount, quizzesCount, attemptsCount, avgPass, recent: recent ?? [], top: top ?? [] };
    },
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar items={adminNavItems} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of platform statistics and activity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Total Users" value={isLoading ? "…" : String(stats?.usersCount ?? 0)} icon={Users} trend="" variant="default" />
            <StatsCard title="Total Quizzes" value={isLoading ? "…" : String(stats?.quizzesCount ?? 0)} icon={FileQuestion} trend="" variant="default" />
            <StatsCard title="Total Attempts" value={isLoading ? "…" : String(stats?.attemptsCount ?? 0)} icon={BarChart3} trend="" variant="default" />
            <StatsCard title="Average Score %" value={isLoading ? "…" : `${stats?.avgPass ?? 0}%`} icon={LayoutDashboard} trend="" variant="success" />
          </div>

          {/* Empty state when no quizzes */}
          {!isLoading && (stats?.quizzesCount ?? 0) === 0 && (
            <div className="flex flex-col items-center justify-center p-10 border rounded-3xl bg-card">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-20 h-20 text-muted-foreground mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h8m-8 4h5m-8 5h10M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
              </svg>
              <p className="text-muted-foreground mb-4">No quizzes yet. Create your first quiz to get started.</p>
              <button className="bg-primary text-primary-foreground px-5 py-2 rounded-full" onClick={() => navigate("/admin/quizzes")}>Create Quiz</button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                {(stats?.recent ?? []).map((r: any) => (
                  <p key={r.id} className="flex justify-between">
                    <span>{r.quizzes?.title ?? "Quiz"}</span>
                    <span>{r.profiles?.email ?? ""} • {new Date(r.created_at).toLocaleString()}</span>
                  </p>
                ))}
                {(!isLoading && (stats?.recent?.length ?? 0) === 0) && <p>No recent attempts</p>}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-4">Top Performing Quizzes</h3>
              <div className="space-y-3 text-sm">
                {(stats?.top ?? []).map((t: any) => (
                  <div key={t.quiz_id} className="flex justify-between">
                    <span>{t.title}</span>
                    <span className="text-success">{t.attempts_count} attempts</span>
                  </div>
                ))}
                {(!isLoading && (stats?.top?.length ?? 0) === 0) && <p className="text-muted-foreground">No data yet</p>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
